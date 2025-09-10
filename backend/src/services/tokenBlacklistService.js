const redis = require('redis');

class TokenBlacklistService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if Redis is installed/available
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
        },
        database: process.env.REDIS_DB || 0
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected for token blacklist');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      console.log('⚠️  Token blacklist will be disabled');
      this.isConnected = false;
    }
  }

  async addToBlacklist(token, exp) {
    try {
      if (!this.isConnected) return false;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpire = exp - currentTime;

      if (timeToExpire > 0) {
        const key = `blacklist_${token}`;
        await this.client.setEx(key, timeToExpire, 'revoked');
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      return false;
    }
  }

  async isTokenBlacklisted(token) {
    try {
      if (!this.isConnected) return false;
      
      const key = `blacklist_${token}`;
      const result = await this.client.get(key);
      return result !== null;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  async addMultipleToBlacklist(userId, tokens) {
    try {
      const promises = tokens.map(tokenData => 
        this.addToBlacklist(tokenData.token, tokenData.exp)
      );
      
      await Promise.all(promises);
      console.log(`Blacklisted ${tokens.length} tokens for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error adding multiple tokens to blacklist:', error);
      return false;
    }
  }

  async getBlacklistStats() {
    try {
      if (!this.isConnected) return { totalBlacklistedTokens: 0, keys: [] };
      
      const keys = await this.client.keys('blacklist_*');
      return {
        totalBlacklistedTokens: keys.length,
        keys: keys.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting blacklist stats:', error);
      return { totalBlacklistedTokens: 0, keys: [] };
    }
  }

  async cleanupBlacklist() {
    try {
      if (!this.isConnected) return 0;
      
      const keys = await this.client.keys('blacklist_*');
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl === -1) {
          await this.client.del(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired blacklist entries`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up blacklist:', error);
      return 0;
    }
  }
}

module.exports = new TokenBlacklistService();
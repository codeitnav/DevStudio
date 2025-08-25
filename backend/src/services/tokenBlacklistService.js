const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} exp - Token expiration timestamp
 * @returns {Promise<boolean>} - Success status
 */
const addToBlacklist = async (token, exp) => {
  try {
    // Time until expiration (in seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpire = exp - currentTime;

    // Only add to blacklist if token hasn't already expired
    if (timeToExpire > 0) {
      const key = `blacklist_${token}`;
      await redisClient.setex(key, timeToExpire, 'revoked');
      console.log(`Token added to blacklist, expires in ${timeToExpire} seconds`);
      return true;
    }

    console.log('Token already expired, not adding to blacklist');
    return true;
    
  } catch (error) {
    console.error('Error adding token to blacklist:', error);
    throw new Error('Failed to blacklist token');
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {Promise<boolean>} - True if blacklisted, false otherwise
 */
const isTokenBlacklisted = async (token) => {
  try {
    const key = `blacklist_${token}`;
    const result = await redisClient.get(key);
    return result !== null;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // If Redis is down, allow the request but log the error
    return false;
  }
};

/**
 * Add multiple tokens to blacklist (for logout from all devices)
 * @param {string} userId - User ID
 * @param {Array} tokens - Array of token objects with {token, exp}
 * @returns {Promise<boolean>} - Success status
 */
const addMultipleToBlacklist = async (userId, tokens) => {
  try {
    const promises = tokens.map(tokenData => 
      addToBlacklist(tokenData.token, tokenData.exp)
    );
    
    await Promise.all(promises);
    console.log(`Blacklisted ${tokens.length} tokens for user ${userId}`);
    return true;

  } catch (error) {
    console.error('Error adding multiple tokens to blacklist:', error);
    throw new Error('Failed to blacklist tokens');
  }
};

/**
 * Get blacklist statistics
 * @returns {Promise<Object>} - Blacklist stats
 */
const getBlacklistStats = async () => {
  try {
    const keys = await redisClient.keys('blacklist_*');
    return {
      totalBlacklistedTokens: keys.length,
      keys: keys.slice(0, 10) // Return first 10 keys for debugging
    };
  } catch (error) {
    console.error('Error getting blacklist stats:', error);
    return { totalBlacklistedTokens: 0, keys: [] };
  }
};

/**
 * Clean up expired blacklist entries (run periodically)
 * @returns {Promise<number>} - Number of cleaned entries
 */
const cleanupBlacklist = async () => {
  try {
    const keys = await redisClient.keys('blacklist_*');
    let cleanedCount = 0;

    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1) { // Key exists but has no expiration
        await redisClient.del(key);
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
};

module.exports = {
  addToBlacklist,
  isTokenBlacklisted,
  addMultipleToBlacklist,
  getBlacklistStats,
  cleanupBlacklist
};

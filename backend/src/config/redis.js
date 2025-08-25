// src/config/redis.js
const redis = require('redis');
const config = require('./env');

// Create Redis client
const createRedisClient = () => {
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Redis server connection refused');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        console.error('Redis retry time exhausted');
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        console.error('Redis connection attempts exhausted');
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });

  client.on('connect', () => {
    console.log('Connected to Redis server');
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  client.on('end', () => {
    console.log('Redis connection ended');
  });

  return client;
};

const redisClient = createRedisClient();

module.exports = redisClient;
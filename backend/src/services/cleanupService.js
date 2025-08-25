// src/services/cleanupService.js
const { cleanupBlacklist } = require('./tokenBlacklistService');

/**
 * Start periodic cleanup of expired blacklist entries
 * @param {number} intervalMinutes - Cleanup interval in minutes (default: 60)
 */
const startCleanupScheduler = (intervalMinutes = 60) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`Starting blacklist cleanup scheduler (every ${intervalMinutes} minutes)`);
  
  setInterval(async () => {
    try {
      console.log('Running blacklist cleanup...');
      const cleaned = await cleanupBlacklist();
      console.log(`Blacklist cleanup completed. Cleaned ${cleaned} entries.`);
    } catch (error) {
      console.error('Blacklist cleanup failed:', error);
    }
  }, intervalMs);
};

module.exports = {
  startCleanupScheduler
};
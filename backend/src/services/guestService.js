const crypto = require('crypto');
const redisClient = require('../config/redis');
const config = require('../config/env');
const { getCachedGeolocation } = require('./geoLocationService');

/**
 * Generate a temporary room ID for guest access
 * @returns {string} - Temporary room ID
 */
const generateTempRoomId = () => {
  const tempId = `guest_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;
  return tempId;
};

/**
 * Generate a random guest username
 * @returns {string} - Random guest username
 */
const generateGuestUsername = () => {
  const adjectives = [
    'Anonymous', 'Quick', 'Silent', 'Swift', 'Clever', 'Smart', 'Fast', 'Bright',
    'Cool', 'Calm', 'Bold', 'Wise', 'Sharp', 'Kind', 'Neat', 'Fair', 'Wild',
    'Free', 'Pure', 'True', 'Live', 'Real', 'Epic', 'Nova', 'Zero', 'Prime'
  ];
  
  const animals = [
    'Coder', 'Developer', 'Programmer', 'Hacker', 'Builder', 'Creator', 'Designer',
    'Tiger', 'Eagle', 'Wolf', 'Lion', 'Fox', 'Bear', 'Hawk', 'Owl', 'Dolphin',
    'Phoenix', 'Dragon', 'Falcon', 'Shark', 'Panther', 'Raven', 'Viper', 'Lynx'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return `${adjective}${animal}${number}`;
};

/**
 * Generate guest session ID
 * @returns {string} - Guest session ID
 */
const generateGuestSessionId = () => {
  return `guest_session_${crypto.randomUUID()}`;
};

/**
 * Get session duration based on configuration and session type
 * @param {string} sessionType - 'new_room' | 'join_room' | 'collaboration'
 * @returns {Object} - Duration configuration
 */
const getSessionDuration = (sessionType = 'new_room') => {
  let durationMinutes = config.GUEST_SESSION_DURATION || 180; // Default 3 hours
  const idleTimeoutMinutes = config.GUEST_SESSION_IDLE_TIMEOUT || 30; // Default 30 minutes
  const maxDurationMinutes = config.GUEST_SESSION_MAX_DURATION || 480; // Default 8 hours
  
  // Adjust based on session type
  switch (sessionType) {
    case 'new_room':
      durationMinutes = config.GUEST_SESSION_DURATION || 180; // Full duration for new rooms
      break;
    case 'join_room':
      durationMinutes = Math.min(config.GUEST_SESSION_DURATION || 180, 240); // Max 4 hours for joining
      break;
    case 'collaboration':
      durationMinutes = maxDurationMinutes; // Extended for active collaboration
      break;
    case 'quick_demo':
      durationMinutes = 60; // 1 hour for quick demos
      break;
  }

  // Ensure we don't exceed maximum duration
  durationMinutes = Math.min(durationMinutes, maxDurationMinutes);

  const durationMs = durationMinutes * 60 * 1000;
  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
  const maxDurationMs = maxDurationMinutes * 60 * 1000;

  return {
    durationMinutes,
    durationMs,
    idleTimeoutMinutes,
    idleTimeoutMs,
    maxDurationMinutes,
    maxDurationMs,
    expiresAt: new Date(Date.now() + durationMs).toISOString(),
    idleExpiresAt: new Date(Date.now() + idleTimeoutMs).toISOString(),
    absoluteExpiresAt: new Date(Date.now() + maxDurationMs).toISOString()
  };
};

/**
 * Create and store guest session data with enhanced expiration management
 * @param {Object} options - Guest session options
 * @param {string} options.username - Guest username
 * @param {string} options.tempRoomId - Temporary room ID
 * @param {string} options.ip - Client IP address
 * @param {string} options.userAgent - Client user agent
 * @param {string} options.sessionType - Session type for duration calculation
 * @returns {Promise<Object>} - Guest session data
 */
const createGuestSession = async ({ username, tempRoomId, ip, userAgent, sessionType = 'new_room' }) => {
  try {
    const guestSessionId = generateGuestSessionId();
    const createdAt = new Date().toISOString();
    const sessionConfig = getSessionDuration(sessionType);
    
    const geoData = await getCachedGeolocation(ip);

    const guestData = {
      guestSessionId,
      username,
      tempRoomId,
      ip,
      userAgent,
      sessionType,
      createdAt,
      lastActivity: createdAt,
      expiresAt: sessionConfig.expiresAt,
      idleExpiresAt: sessionConfig.idleExpiresAt,
      absoluteExpiresAt: sessionConfig.absoluteExpiresAt,
      isGuest: true,
      activityCount: 0,
      permissions: {
        canEdit: sessionType === 'new_room' || sessionType === 'collaboration',
        canInvite: false,
        canDelete: false,
        canCreateFiles: sessionType === 'new_room' || sessionType === 'collaboration',
        canDeleteFiles: false,
        canSaveFiles: sessionType === 'new_room' || sessionType === 'collaboration',
        canChat: true,
        canVideoCall: sessionType === 'collaboration'
      },
      config: {
        durationMinutes: sessionConfig.durationMinutes,
        idleTimeoutMinutes: sessionConfig.idleTimeoutMinutes,
        maxDurationMinutes: sessionConfig.maxDurationMinutes
      },
      metadata: {
        browser: extractBrowser(userAgent),
        platform: extractPlatform(userAgent),
        location: {
          country: geoData.country,
          countryName: geoData.countryName,
          region: geoData.region,
          city: geoData.city,
          postal: geoData.postal,
          timezone: geoData.timezone,
          utcOffset: geoData.utcOffset,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          org: geoData.org,
          isp: geoData.isp,
          currency: geoData.currency,
          languages: geoData.languages,
          isLocal: geoData.isLocal,
          isUnknown: geoData.isUnknown,
          isEU: geoData.isEU,
          source: geoData.source
        },
        createdTimestamp: Date.now(),
        geoLookupSuccess: geoData.success
      }
    };
    const redisExpiry = Math.floor(sessionConfig.durationMs / 1000);
    await redisClient.setex(
      `guest_session_${guestSessionId}`,
      redisExpiry,
      JSON.stringify(guestData)
    );

    console.log(`Guest session created: ${guestSessionId} for ${username} from ${geoData.city}, ${geoData.countryName} (${sessionConfig.durationMinutes} min)`);
    
    return guestData;

  } catch (error) {
    console.error('Error creating guest session:', error);
    throw new Error('Failed to create guest session');
  }
};

/**
 * Get guest session data
 * @param {string} guestSessionId - Guest session ID
 * @returns {Promise<Object|null>} - Guest session data or null
 */
const getGuestSession = async (guestSessionId) => {
  try {
    const sessionData = await redisClient.get(`guest_session_${guestSessionId}`);
    
    if (!sessionData) {
      return null;
    }

    const guestData = JSON.parse(sessionData);
    
    // Check if session has expired based on absolute time
    const now = new Date();
    const absoluteExpiry = new Date(guestData.absoluteExpiresAt);
    const idleExpiry = new Date(guestData.idleExpiresAt);
    
    if (now > absoluteExpiry || now > idleExpiry) {
      // Session has expired, clean it up
      await redisClient.del(`guest_session_${guestSessionId}`);
      console.log(`Expired guest session cleaned up: ${guestSessionId}`);
      return null;
    }

    return guestData;

  } catch (error) {
    console.error('Error getting guest session:', error);
    return null;
  }
};

/**
 * Validate guest session and check if it's still valid
 * @param {string} guestSessionId - Guest session ID
 * @returns {Promise<Object>} - Validation result with details
 */
const isValidGuestSession = async (guestSessionId) => {
  try {
    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return {
        isValid: false,
        reason: 'Session not found or expired',
        code: 'SESSION_NOT_FOUND'
      };
    }

    const now = new Date();
    const absoluteExpiry = new Date(guestData.absoluteExpiresAt);
    const idleExpiry = new Date(guestData.idleExpiresAt);
    
    if (now > absoluteExpiry) {
      await redisClient.del(`guest_session_${guestSessionId}`);
      return {
        isValid: false,
        reason: 'Session exceeded maximum duration',
        code: 'MAX_DURATION_EXCEEDED'
      };
    }

    if (now > idleExpiry) {
      await redisClient.del(`guest_session_${guestSessionId}`);
      return {
        isValid: false,
        reason: 'Session idle timeout',
        code: 'IDLE_TIMEOUT'
      };
    }

    // Calculate remaining time
    const remainingAbsolute = Math.floor((absoluteExpiry - now) / (1000 * 60)); // minutes
    const remainingIdle = Math.floor((idleExpiry - now) / (1000 * 60)); // minutes

    return {
      isValid: true,
      remainingMinutes: Math.min(remainingAbsolute, remainingIdle),
      remainingAbsoluteMinutes: remainingAbsolute,
      remainingIdleMinutes: remainingIdle,
      code: 'VALID'
    };

  } catch (error) {
    console.error('Error validating guest session:', error);
    return {
      isValid: false,
      reason: 'Validation error',
      code: 'VALIDATION_ERROR'
    };
  }
};

/**
 * Update guest session activity with sliding window expiration
 * @param {string} guestSessionId - Guest session ID
 * @param {Object} activityData - Additional activity data
 * @returns {Promise<Object>} - Update result
 */
const updateGuestActivity = async (guestSessionId, activityData = {}) => {
  try {
    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return {
        success: false,
        reason: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      };
    }

    const now = new Date();
    const lastActivity = new Date(guestData.lastActivity);
    const timeSinceActivity = now - lastActivity;

    // Only update if more than 30 seconds has passed (prevent excessive updates)
    if (timeSinceActivity < 30 * 1000) {
      return {
        success: true,
        reason: 'Activity updated recently, skipping',
        code: 'RECENTLY_UPDATED'
      };
    }

    // Check if we're still within the maximum absolute duration
    const absoluteExpiry = new Date(guestData.absoluteExpiresAt);
    
    if (now > absoluteExpiry) {
      // Session has exceeded maximum duration
      await redisClient.del(`guest_session_${guestSessionId}`);
      return {
        success: false,
        reason: 'Session exceeded maximum duration',
        code: 'MAX_DURATION_EXCEEDED'
      };
    }

    // Implement sliding window - extend idle timeout
    const newIdleExpiry = new Date(now.getTime() + guestData.config.idleTimeoutMinutes * 60 * 1000);
    
    // Update session data
    guestData.lastActivity = now.toISOString();
    guestData.idleExpiresAt = newIdleExpiry.toISOString();
    guestData.activityCount = (guestData.activityCount || 0) + 1;

    // Merge any additional activity data
    if (activityData.action) {
      guestData.lastAction = activityData.action;
    }
    if (activityData.roomId) {
      guestData.currentRoomId = activityData.roomId;
    }

    // Calculate remaining absolute time
    const remainingAbsoluteTime = Math.floor((absoluteExpiry - now) / 1000);
    const newIdleTime = Math.floor((newIdleExpiry - now) / 1000);
    
    // Use the shorter of the two timeouts
    const effectiveTimeout = Math.min(remainingAbsoluteTime, newIdleTime);

    if (effectiveTimeout <= 0) {
      await redisClient.del(`guest_session_${guestSessionId}`);
      return {
        success: false,
        reason: 'Session expired during update',
        code: 'EXPIRED_DURING_UPDATE'
      };
    }

    await redisClient.setex(
      `guest_session_${guestSessionId}`,
      effectiveTimeout,
      JSON.stringify(guestData)
    );

    const remainingMinutes = Math.floor(effectiveTimeout / 60);
    console.log(`Guest activity updated: ${guestSessionId} (${remainingMinutes} min remaining, activity #${guestData.activityCount})`);
    
    return {
      success: true,
      remainingMinutes,
      activityCount: guestData.activityCount,
      code: 'ACTIVITY_UPDATED'
    };

  } catch (error) {
    console.error('Error updating guest activity:', error);
    return {
      success: false,
      reason: 'Update error',
      code: 'UPDATE_ERROR'
    };
  }
};

/**
 * Store temporary room data for guests with enhanced metadata
 * @param {string} tempRoomId - Temporary room ID
 * @param {Object} roomData - Room data
 * @returns {Promise<boolean>} - Success status
 */
const createTempRoom = async (tempRoomId, roomData = {}) => {
  try {
    const sessionConfig = getSessionDuration(roomData.sessionType || 'new_room');
    
    const tempRoom = {
      tempRoomId,
      name: roomData.name || 'Guest Room',
      description: roomData.description || 'Temporary room created by guest user',
      createdAt: new Date().toISOString(),
      expiresAt: sessionConfig.absoluteExpiresAt,
      createdBy: roomData.createdBy || 'Guest User',
      isTemporary: true,
      sessionType: roomData.sessionType || 'new_room',
      files: roomData.files || [
        {
          name: 'welcome.js',
          content: '// Welcome to DevStudio!\n// Start coding here...\n\nconsole.log("Hello, World!");',
          language: 'javascript',
          path: '/welcome.js',
          createdAt: new Date().toISOString()
        }
      ],
      folders: roomData.folders || [],
      participants: roomData.participants || [],
      settings: {
        allowGuestEdit: true,
        allowGuestChat: true,
        maxParticipants: 5,
        autoSave: false,
        ...roomData.settings
      },
      metadata: {
        totalFiles: (roomData.files || []).length + 1, // +1 for welcome file
        totalFolders: (roomData.folders || []).length,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Store temp room data in Redis
    const expiry = Math.floor(sessionConfig.maxDurationMs / 1000);
    await redisClient.setex(
      `temp_room_${tempRoomId}`,
      expiry,
      JSON.stringify(tempRoom)
    );

    console.log(`Temporary room created: ${tempRoomId} (expires in ${sessionConfig.maxDurationMinutes} minutes)`);
    return true;

  } catch (error) {
    console.error('Error creating temp room:', error);
    throw new Error('Failed to create temporary room');
  }
};

/**
 * Get temporary room data
 * @param {string} tempRoomId - Temporary room ID
 * @returns {Promise<Object|null>} - Room data or null
 */
const getTempRoom = async (tempRoomId) => {
  try {
    const roomData = await redisClient.get(`temp_room_${tempRoomId}`);
    
    if (!roomData) {
      return null;
    }

    const room = JSON.parse(roomData);
    
    // Check if room has expired
    const now = new Date();
    const expiresAt = new Date(room.expiresAt);
    
    if (now > expiresAt) {
      await redisClient.del(`temp_room_${tempRoomId}`);
      console.log(`Expired temp room cleaned up: ${tempRoomId}`);
      return null;
    }

    return room;

  } catch (error) {
    console.error('Error getting temp room:', error);
    return null;
  }
};

/**
 * Update temp room data
 * @param {string} tempRoomId - Temporary room ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<boolean>} - Success status
 */
const updateTempRoom = async (tempRoomId, updates = {}) => {
  try {
    const roomData = await getTempRoom(tempRoomId);
    
    if (!roomData) {
      return false;
    }

    // Apply updates
    const updatedRoom = {
      ...roomData,
      ...updates,
      metadata: {
        ...roomData.metadata,
        lastModified: new Date().toISOString(),
        version: incrementVersion(roomData.metadata.version)
      }
    };

    // Calculate remaining time
    const now = new Date();
    const expiresAt = new Date(roomData.expiresAt);
    const remainingTime = Math.floor((expiresAt - now) / 1000);

    if (remainingTime <= 0) {
      return false;
    }

    await redisClient.setex(
      `temp_room_${tempRoomId}`,
      remainingTime,
      JSON.stringify(updatedRoom)
    );

    return true;

  } catch (error) {
    console.error('Error updating temp room:', error);
    return false;
  }
};

/**
 * Extend guest session duration (premium feature or active collaboration)
 * @param {string} guestSessionId - Guest session ID
 * @param {number} additionalMinutes - Additional minutes to add
 * @returns {Promise<Object>} - Extension result
 */
const extendGuestSession = async (guestSessionId, additionalMinutes = 60) => {
  try {
    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return {
        success: false,
        reason: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      };
    }

    const now = new Date();
    const currentAbsoluteExpiry = new Date(guestData.absoluteExpiresAt);
    const maxAllowedDuration = guestData.config.maxDurationMinutes * 60 * 1000;
    const sessionAge = now - new Date(guestData.createdAt);

    // Check if we can extend (not exceeding maximum allowed duration)
    if (sessionAge + (additionalMinutes * 60 * 1000) > maxAllowedDuration) {
      return {
        success: false,
        reason: 'Cannot extend beyond maximum duration',
        code: 'MAX_DURATION_LIMIT'
      };
    }

    // Extend the session
    const newAbsoluteExpiry = new Date(currentAbsoluteExpiry.getTime() + (additionalMinutes * 60 * 1000));
    const newIdleExpiry = new Date(now.getTime() + guestData.config.idleTimeoutMinutes * 60 * 1000);

    guestData.absoluteExpiresAt = newAbsoluteExpiry.toISOString();
    guestData.idleExpiresAt = newIdleExpiry.toISOString();
    guestData.lastActivity = now.toISOString();
    guestData.extensionCount = (guestData.extensionCount || 0) + 1;

    const remainingTime = Math.floor((newAbsoluteExpiry - now) / 1000);

    await redisClient.setex(
      `guest_session_${guestSessionId}`,
      remainingTime,
      JSON.stringify(guestData)
    );

    console.log(`Guest session extended: ${guestSessionId} (+${additionalMinutes} min)`);

    return {
      success: true,
      additionalMinutes,
      newExpiryTime: newAbsoluteExpiry.toISOString(),
      totalExtensions: guestData.extensionCount,
      code: 'SESSION_EXTENDED'
    };

  } catch (error) {
    console.error('Error extending guest session:', error);
    return {
      success: false,
      reason: 'Extension error',
      code: 'EXTENSION_ERROR'
    };
  }
};

/**
 * Get guest session statistics
 * @returns {Promise<Object>} - Session statistics
 */
const getGuestSessionStats = async () => {
  try {
    const sessionKeys = await redisClient.keys('guest_session_*');
    const roomKeys = await redisClient.keys('temp_room_*');

    const stats = {
      totalActiveSessions: sessionKeys.length,
      totalTempRooms: roomKeys.length,
      sessionTypes: {},
      averageSessionAge: 0,
      totalActivityCount: 0
    };

    // Analyze session data
    let totalAge = 0;
    let validSessions = 0;

    for (const key of sessionKeys) {
      try {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const sessionType = session.sessionType || 'unknown';
          
          stats.sessionTypes[sessionType] = (stats.sessionTypes[sessionType] || 0) + 1;
          stats.totalActivityCount += session.activityCount || 0;
          
          const age = Date.now() - new Date(session.createdAt).getTime();
          totalAge += age;
          validSessions++;
        }
      } catch (err) {
        console.error('Error analyzing session:', key, err);
      }
    }

    if (validSessions > 0) {
      stats.averageSessionAge = Math.floor(totalAge / validSessions / (1000 * 60)); // in minutes
    }

    return stats;

  } catch (error) {
    console.error('Error getting guest session stats:', error);
    return {
      totalActiveSessions: 0,
      totalTempRooms: 0,
      sessionTypes: {},
      averageSessionAge: 0,
      totalActivityCount: 0
    };
  }
};

/**
 * Clean up expired guest sessions and temp rooms
 * @returns {Promise<Object>} - Cleanup results
 */
const cleanupExpiredGuestData = async () => {
  try {
    const guestKeys = await redisClient.keys('guest_session_*');
    const roomKeys = await redisClient.keys('temp_room_*');
    const lookupKeys = await redisClient.keys('guest_lookup_*');
    
    let cleanedSessions = 0;
    let cleanedRooms = 0;
    let cleanedLookups = 0;

    // Check and clean expired sessions
    for (const key of guestKeys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1 || ttl <= 0) { // Key expired or no expiration
        await redisClient.del(key);
        cleanedSessions++;
      }
    }

    // Check and clean expired rooms
    for (const key of roomKeys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1 || ttl <= 0) {
        await redisClient.del(key);
        cleanedRooms++;
      }
    }

    // Check and clean expired lookups
    for (const key of lookupKeys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1 || ttl <= 0) {
        await redisClient.del(key);
        cleanedLookups++;
      }
    }

    const totalCleaned = cleanedSessions + cleanedRooms + cleanedLookups;
    
    if (totalCleaned > 0) {
      console.log(`Guest data cleanup completed: ${cleanedSessions} sessions, ${cleanedRooms} rooms, ${cleanedLookups} lookups`);
    }

    return {
      cleanedSessions,
      cleanedRooms,
      cleanedLookups,
      totalCleaned
    };

  } catch (error) {
    console.error('Error cleaning up guest data:', error);
    return {
      cleanedSessions: 0,
      cleanedRooms: 0,
      cleanedLookups: 0,
      totalCleaned: 0
    };
  }
};

// Helper functions
const extractBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const extractPlatform = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown';
};

const incrementVersion = (version) => {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || '0') + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
};

module.exports = {
  generateTempRoomId,
  generateGuestUsername,
  generateGuestSessionId,
  getSessionDuration,
  createGuestSession,
  getGuestSession,
  isValidGuestSession,
  updateGuestActivity,
  createTempRoom,
  getTempRoom,
  updateTempRoom,
  extendGuestSession,
  getGuestSessionStats,
  cleanupExpiredGuestData
};

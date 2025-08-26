const {
  generateTempRoomId,
  generateGuestUsername,
  createGuestSession,
  getGuestSession,
  isValidGuestSession,
  createTempRoom,
  getTempRoom,
  updateGuestActivity
} = require('../../services/guestService');
const { getCachedGeolocation } = require('../../services/geoLocationService');

/**
 * Initialize guest session - "Try as Guest" endpoint
 */
const initializeGuestSession = async (req, res) => {
  try {
    const { username: customUsername, roomName } = req.body;
    
    // Extract real client IP (handle proxy scenarios)
    const getClientIP = (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.headers['x-real-ip'] || 
             req.headers['x-client-ip'] ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
             req.ip || 
             '127.0.0.1';
    };

    const clientIP = getClientIP(req);
    
    // Get geolocation data
    const geoData = await getCachedGeolocation(clientIP);
    
    // Generate username with location context if not provided
    let username = customUsername;
    if (!username) {
      const locationSuffix = geoData.isLocal ? 'Local' : 
                            geoData.isUnknown ? '' : 
                            `${geoData.country}`;
      username = generateGuestUsername() + (locationSuffix ? `_${locationSuffix}` : '');
    }
    
    // Validate custom username if provided
    if (customUsername) {
      if (customUsername.length < 3 || customUsername.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 20 characters'
        });
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(customUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username can only contain letters, numbers, and underscores'
        });
      }
    }

    // Generate temporary room ID
    const tempRoomId = generateTempRoomId();

    // Create guest session
    const guestSession = await createGuestSession({
      username,
      tempRoomId,
      ip: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      sessionType: 'new_room'
    });

    // Create temporary room
    await createTempRoom(tempRoomId, {
      name: roomName || `${username}'s Room`,
      createdBy: username,
      sessionType: 'new_room'
    });

    // Prepare location info for response (don't expose sensitive data)
    const locationInfo = {
      city: geoData.city,
      country: geoData.countryName,
      timezone: geoData.timezone,
      isLocal: geoData.isLocal,
      isUnknown: geoData.isUnknown
    };

    // Add welcome message based on location
    let welcomeMessage = 'Guest session initialized successfully';
    if (!geoData.isLocal && !geoData.isUnknown) {
      welcomeMessage += ` - Welcome from ${geoData.city}, ${geoData.countryName}!`;
    }

    res.status(201).json({
      success: true,
      message: welcomeMessage,
      data: {
        guestSessionId: guestSession.guestSessionId,
        tempRoomId,
        username,
        roomName: roomName || `${username}'s Room`,
        expiresAt: guestSession.expiresAt,
        permissions: guestSession.permissions,
        location: locationInfo,
        timezone: geoData.timezone,
        geoLookupSuccess: geoData.success
      }
    });

  } catch (error) {
    console.error('Initialize guest session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize guest session'
    });
  }
};

/**
 * Get geolocation info endpoint
 */
const getGuestLocationInfo = async (req, res) => {
  try {
    const { guestSessionId } = req.params;

    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Guest session ID is required'
      });
    }

    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return res.status(404).json({
        success: false,
        message: 'Guest session not found or expired'
      });
    }

    // Return safe location information
    res.status(200).json({
      success: true,
      data: {
        location: {
          city: guestData.metadata.location.city,
          country: guestData.metadata.location.countryName,
          region: guestData.metadata.location.region,
          timezone: guestData.metadata.location.timezone,
          currency: guestData.metadata.location.currency,
          languages: guestData.metadata.location.languages,
          isLocal: guestData.metadata.location.isLocal
        },
        browser: guestData.metadata.browser,
        platform: guestData.metadata.platform,
        createdAt: guestData.createdAt
      }
    });

  } catch (error) {
    console.error('Get guest location info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location information'
    });
  }
};

/**
 * Get guest session info
 */
const getGuestSessionInfo = async (req, res) => {
  try {
    const { guestSessionId } = req.params;

    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Guest session ID is required'
      });
    }

    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return res.status(404).json({
        success: false,
        message: 'Guest session not found or expired'
      });
    }

    // Update activity
    await updateGuestActivity(guestSessionId);

    // Get temp room info
    const roomData = await getTempRoom(guestData.tempRoomId);

    res.status(200).json({
      success: true,
      data: {
        username: guestData.username,
        tempRoomId: guestData.tempRoomId,
        createdAt: guestData.createdAt,
        expiresAt: guestData.expiresAt,
        permissions: guestData.permissions,
        room: roomData ? {
          name: roomData.name,
          files: roomData.files || [],
          folders: roomData.folders || []
        } : null
      }
    });

  } catch (error) {
    console.error('Get guest session info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get guest session info'
    });
  }
};

/**
 * Validate guest session - CORRECTED VERSION
 */
const validateGuestSession = async (req, res) => {
  try {
    const { guestSessionId } = req.body;

    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Guest session ID is required'
      });
    }

    // ✅ FIXED: Handle object return value
    const validationResult = await isValidGuestSession(guestSessionId);

    if (validationResult.isValid) {
      // Update activity only if session is valid
      await updateGuestActivity(guestSessionId);
    }

    res.status(200).json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        message: validationResult.isValid ? 'Session is valid' : validationResult.reason,
        remainingMinutes: validationResult.remainingMinutes || 0,
        code: validationResult.code
      }
    });

  } catch (error) {
    console.error('Validate guest session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate guest session'
    });
  }
};

/**
 * Join existing room as guest - CORRECTED VERSION
 */
const joinRoomAsGuest = async (req, res) => {
  try {
    const { roomId, username: customUsername } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Generate or use provided username
    const username = customUsername || generateGuestUsername();

    // Validate username if provided
    if (customUsername) {
      if (customUsername.length < 3 || customUsername.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 20 characters'
        });
      }
    }

    // Get client info
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    // ✅ FIXED: Add sessionType
    const guestSession = await createGuestSession({
      username,
      tempRoomId: null, // No temp room, joining existing
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      sessionType: 'join_room' // Add this line
    });

    res.status(201).json({
      success: true,
      message: 'Guest session created for room join',
      data: {
        guestSessionId: guestSession.guestSessionId,
        roomId,
        username,
        expiresAt: guestSession.expiresAt,
        permissions: {
          canEdit: false, // Guests can only view existing rooms by default
          canInvite: false,
          canDelete: false,
          canCreateFiles: false,
          canDeleteFiles: false
        }
      }
    });

  } catch (error) {
    console.error('Join room as guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room as guest'
    });
  }
};

/**
 * Convert guest to registered user
 */
const convertGuestToUser = async (req, res) => {
  try {
    const { guestSessionId, email, password } = req.body;

    if (!guestSessionId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Guest session ID, email, and password are required'
      });
    }

    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return res.status(404).json({
        success: false,
        message: 'Guest session not found or expired'
      });
    }

    // Here you would typically:
    // 1. Create a new user account with the guest's username
    // 2. Convert the temporary room to a permanent room
    // 3. Transfer guest session data to user account
    // 4. Clean up guest session

    res.status(200).json({
      success: true,
      message: 'Guest conversion initiated',
      data: {
        guestUsername: guestData.username,
        tempRoomId: guestData.tempRoomId,
        note: 'This would typically create a user account and convert the session'
      }
    });

  } catch (error) {
    console.error('Convert guest to user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert guest to user'
    });
  }
};

module.exports = {
  initializeGuestSession,
  getGuestSessionInfo,
  validateGuestSession,
  joinRoomAsGuest,
  convertGuestToUser,
  getGuestLocationInfo 
};

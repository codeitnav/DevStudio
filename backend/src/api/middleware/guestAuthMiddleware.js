// src/api/middleware/guestAuthMiddleware.js
const { getGuestSession, isValidGuestSession, updateGuestActivity } = require('../../services/guestService');

/**
 * Middleware to validate guest sessions
 */
const validateGuest = async (req, res, next) => {
  try {
    const guestSessionId = req.headers['x-guest-session-id'] || req.query.guestSessionId;

    if (!guestSessionId) {
      return res.status(401).json({
        success: false,
        message: 'Guest session ID is required'
      });
    }

    const isValid = await isValidGuestSession(guestSessionId);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Guest session is invalid or expired'
      });
    }

    const guestData = await getGuestSession(guestSessionId);
    
    if (!guestData) {
      return res.status(401).json({
        success: false,
        message: 'Guest session not found'
      });
    }

    // Update guest activity
    await updateGuestActivity(guestSessionId);

    // Add guest info to request
    req.guest = {
      guestSessionId,
      username: guestData.username,
      tempRoomId: guestData.tempRoomId,
      permissions: guestData.permissions,
      isGuest: true,
      createdAt: guestData.createdAt,
      expiresAt: guestData.expiresAt
    };

    next();

  } catch (error) {
    console.error('Guest validation middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware that allows both authenticated users and guests
 */
const allowGuestOrUser = async (req, res, next) => {
  try {
    // First try to validate as a regular user
    const token = req.headers.authorization?.split(' ')[1];
    const guestSessionId = req.headers['x-guest-session-id'];

    if (token) {
      // Use regular auth middleware logic here
      // For now, we'll just set a flag
      req.isAuthenticated = true;
      req.isGuest = false;
      next();
    } else if (guestSessionId) {
      // Validate as guest
      const isValid = await isValidGuestSession(guestSessionId);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session'
        });
      }

      const guestData = await getGuestSession(guestSessionId);
      
      req.guest = {
        guestSessionId,
        username: guestData.username,
        tempRoomId: guestData.tempRoomId,
        permissions: guestData.permissions,
        isGuest: true
      };
      req.isAuthenticated = false;
      req.isGuest = true;
      
      // Update activity
      await updateGuestActivity(guestSessionId);
      
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login or use guest mode.'
      });
    }

  } catch (error) {
    console.error('Guest or user validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  validateGuest,
  allowGuestOrUser
};

// src/api/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('../../config/env');
const { isTokenBlacklisted } = require('../../services/tokenBlacklistService');

// Protect routes - require authentication with blacklist check
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // First, check if token is blacklisted
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked. Please login again.'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid. User no longer exists.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      // Add user info and token data to request
      req.user = {
        userId: user._id,
        email: user.email,
        username: user.username
      };
      req.token = token;
      req.tokenExp = decoded.exp;

      next();

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Optional authentication - doesn't require token but sets user if provided
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        // Check if token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
        if (!isBlacklisted) {
          const decoded = jwt.verify(token, config.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          
          if (user && user.isActive) {
            req.user = {
              userId: user._id,
              email: user.email,
              username: user.username
            };
            req.token = token;
            req.tokenExp = decoded.exp;
          }
        }
      } catch (jwtError) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = {
  protect,
  optionalAuth
};
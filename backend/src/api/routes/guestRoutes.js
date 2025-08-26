const express = require('express');
const {
  initializeGuestSession,
  getGuestSessionInfo,
  validateGuestSession,
  joinRoomAsGuest,
  convertGuestToUser
} = require('../controllers/guestController');
const { validateGuest } = require('../middleware/guestAuthMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for guest routes
const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 guest session creations per windowMs
  message: {
    success: false,
    message: 'Too many guest sessions created, please try again later.'
  }
});

// Public guest routes
router.post('/initialize', guestLimiter, initializeGuestSession);
router.post('/join-room', guestLimiter, joinRoomAsGuest);
router.post('/validate', validateGuestSession);
router.get('/session/:guestSessionId/location', getGuestLocationInfo);

// Protected guest routes
router.get('/session/:guestSessionId', getGuestSessionInfo);
router.post('/convert-to-user', validateGuest, convertGuestToUser);

module.exports = router;

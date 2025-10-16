const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRoom, getRooms } = require('../controllers/roomController');

// Authentication middleware to all routes
router.use(protect);

router.route('/').post(createRoom).get(getRooms);

module.exports = router;
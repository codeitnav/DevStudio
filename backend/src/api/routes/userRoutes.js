const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserRooms,
  deleteUserAccount
} = require('../controllers/userController');

// @route   GET /api/users/profile
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
router.put('/profile', protect, updateUserProfile);

// @route   PUT /api/users/change-password
router.put('/change-password', protect, changePassword);

// @route   GET /api/users/rooms
router.get('/rooms', protect, getUserRooms);

// @route   DELETE /api/users/account
router.delete('/account', protect, deleteUserAccount);

module.exports = router;
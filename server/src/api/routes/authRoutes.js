const express = require('express');
const router = express.Router();
const {
  signupUser,
  loginUser,
  guestLogin,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/guest', guestLogin);

router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);
router.put('/me/change-password', protect, changePassword);
router.delete('/me', protect, deleteUser);

module.exports = router;
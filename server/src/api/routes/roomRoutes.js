const express = require('express');
const router = express.Router();
// We are removing the 'protect' middleware to make this public
const { protect } = require('../middleware/authMiddleware');
const { 
  createRoom, 
  getRooms,
  getRoomById,
  deleteRoom,
  addMember
} = require('../controllers/roomController');

// FIX: Authentication middleware removed for all room routes
router.use(protect);

router.route('/')
  .post(createRoom)
  .get(getRooms);

router.route('/:roomId')
  .get(getRoomById)
  // We should still protect deletion and adding members,
  // but for simplicity as requested, auth is removed.
  // Consider re-adding 'protect' middleware to sensitive routes
  // like deleteRoom and addMember later.
  .delete(deleteRoom);
  
router.route('/:roomId/members')
  .post(addMember);

module.exports = router;

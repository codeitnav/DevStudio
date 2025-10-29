const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createRoom, 
  getRooms,
  getRoomById,
  deleteRoom,
  addMember,
  joinRoom // Import the new function
} = require('../controllers/roomController');

// This correctly protects all routes in this file
router.use(protect);

router.route('/')
  .post(createRoom)
  .get(getRooms);

// [NEW] This route handles a user's request to join a room
router.route('/:roomId/join')
  .post(joinRoom);

router.route('/:roomId')
  .get(getRoomById)
  .delete(deleteRoom);
  
// This route is for an owner *inviting* another user
router.route('/:roomId/members')
  .post(addMember);

module.exports = router;

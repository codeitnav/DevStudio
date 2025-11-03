const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createRoom, 
  getRooms,
  joinRoom,
  getRoomById,
  deleteRoom,
  addMember,
  saveProject
} = require('../controllers/roomController');

router.use(protect);

router.route('/')
  .post(createRoom)
  .get(getRooms);

router.route('/:roomId/join')
.post(joinRoom);

router.route('/:roomId')
  .get(getRoomById)
  .delete(deleteRoom);
  
router.route('/:roomId/members')
  .post(addMember);

router.route('/:roomId/save')
  .post(saveProject);

module.exports = router;
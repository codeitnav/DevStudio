const Room = require('../../models/Room');
const { nanoid } = require('nanoid');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
exports.createRoom = async (req, res) => {
  const { name } = req.body;
  const owner = req.user._id;

  if (!name) {
    return res.status(400).json({ message: 'Room name is required.' });
  }

  try {
    const newRoom = await Room.create({
      name,
      owner,
      roomId: nanoid(10), 
      members: [owner], // The owner is also a member
    });
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error: Cannot create room.', error: error.message });
  }
};

// @desc    Get all rooms for the logged-in user
// @route   GET /api/rooms
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error: Cannot fetch rooms.', error: error.message });
  }
};
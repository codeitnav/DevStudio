const Room = require('../models/Room');
// Assuming yjs config is exported from 'config/yjs.js'
const { mdb } = require('../config/yjs'); 
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
      roomId: nanoid(10), // This is the human-readable ID
      members: [owner],
    });

    // --- Yjs ---
    // Initialize the file system map for the new room
    const fileSystemDocName = `files-${newRoom.roomId}`;
    const ydoc = await mdb.getYDoc(fileSystemDocName);
    const nodeMap = ydoc.getMap('file-system-map');
    
    // Check if it's truly empty (it should be)
    if (nodeMap.size === 0) {
      // You could create a root node if your model requires one
      // For now, we just ensure the doc is created.
      console.log(`Initialized Yjs doc: ${fileSystemDocName}`);
      // Persist this initial state
      await mdb.flushDoc(fileSystemDocName);
    }
    // --- End Yjs ---

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error: Cannot create room.', error: error.message });
  }
};

// @desc    Get all rooms for the logged-in user
// @route   GET /api/rooms
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id }).select('-__v');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error: Cannot fetch rooms.', error: error.message });
  }
};

// @desc    Get details for a single room
// @route   GET /api/rooms/:roomId
// @access  Private (members only)
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied or room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a member to a room
// @route   POST /api/rooms/:roomId/members
// @access  Private (owner only)
exports.addMember = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the room owner can add members' });
    }
    
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to add a member' });
    }

    room.members.addToSet(userId); // addToSet prevents duplicates
    await room.save();
    
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a room and all its contents
// @route   DELETE /api/rooms/:roomId
// @access  Private (owner only)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to delete this room' });
    }

    // --- Yjs Deletion ---
    const fileSystemDocName = `files-${room.roomId}`;
    try {
      // Get the file system doc to find all file content docs
      const ydoc = await mdb.getYDoc(fileSystemDocName);
      const nodeMap = ydoc.getMap('file-system-map');
      
      const fileContentIds = [];
      nodeMap.forEach(node => {
        // node is a Y.Map itself
        if (node.get('type') === 'file' && node.get('fileContentId')) {
          fileContentIds.push(node.get('fileContentId'));
        }
      });

      // Delete all associated file content docs
      for (const contentId of fileContentIds) {
        const fileDocName = `file-${contentId}`;
        console.log(`Deleting Yjs file doc: ${fileDocName}`);
        await mdb.destroyDoc(fileDocName);
      }
      
      // Delete the main file system doc
      console.log(`Deleting Yjs file system doc: ${fileSystemDocName}`);
      await mdb.destroyDoc(fileSystemDocName);

      // Clean up in-memory Y.Doc instance
      ydoc.destroy();

    } catch (yjsError) {
      console.error(`Error deleting Yjs docs for room ${room.roomId}:`, yjsError);
      // We don't stop the room deletion, but we log the error.
    }
    // --- End Yjs Deletion ---

    // Note: We no longer need to delete from 'File' or 'Folder' models
    // as they are obsolete.

    // Delete the room from MongoDB
    await Room.deleteOne({ _id: room._id });

    res.status(200).json({ message: 'Room and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

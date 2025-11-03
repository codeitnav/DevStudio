const Room = require('../../models/Room');
const { mdb } = require('../../config/yjs'); 
const { nanoid } = require('nanoid');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
exports.createRoom = async (req, res) => {
  const { name } = req.body;
  const ownerId = req.user._id; 

  if (!name) {
    return res.status(400).json({ message: 'Room name is required.' });
  }

  try {
    const newRoom = await Room.create({
      name,
      owner: ownerId,
      roomId: nanoid(10), 
      members: [ownerId],
    });

    const fileSystemDocName = `files-${newRoom.roomId}`;
    const ydoc = await mdb.getYDoc(fileSystemDocName);
    const nodeMap = ydoc.getMap('file-system-map');

    if (nodeMap.size === 0) {
      console.log(`Initialized Yjs doc: ${fileSystemDocName}`);
      await mdb.flushDocument(fileSystemDocName);
    }

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error: Cannot create room.', error: error.message });
  }
};

// @desc    Add the current user to a room
// @route   POST /api/rooms/:roomId/join
// @access  Private
exports.joinRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    room.members.addToSet(req.user._id);
    await room.save();

    res.status(200).json(room);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Server error: Could not join room.', error: error.message });
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

// @desc    Add a member to a room (for inviting others)
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

    room.members.addToSet(userId);
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
      return res.status(4404).json({ message: 'Room not found' });
    }
    if (!room.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to delete this room' });
    }

    const fileSystemDocName = `files-${room.roomId}`;
    try {
      const ydoc = await mdb.getYDoc(fileSystemDocName);
      const nodeMap = ydoc.getMap('file-system-map');
      
      const fileContentIds = [];
      nodeMap.forEach(node => {
        if (node.get('type') === 'file' && node.get('fileContentId')) {
          fileContentIds.push(node.get('fileContentId'));
        }
      });

      for (const contentId of fileContentIds) {
        const fileDocName = `file-${contentId}`;
        console.log(`Deleting Yjs file doc: ${fileDocName}`);
        await mdb.clearDocument(fileDocName);
      }
      
      console.log(`Deleting Yjs file system doc: ${fileSystemDocName}`);
      await mdb.clearDocument(fileSystemDocName);

      ydoc.destroy();

    } catch (yjsError) {
      console.error(`Error deleting Yjs docs for room ${room.roomId}:`, yjsError);
    }
    await Room.deleteOne({ _id: room._id });

    res.status(200).json({ message: 'Room and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Force save all project documents to MongoDB
// @route   POST /api/rooms/:roomId/save
// @access  Private (members only)
exports.saveProject = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied or room not found' });
    }

    const fileSystemDocName = `files-${roomId}`;
    console.log(`Flushing document: ${fileSystemDocName}`);
    await mdb.flushDocument(fileSystemDocName);

    const ydoc = await mdb.getYDoc(fileSystemDocName);
    const nodeMap = ydoc.getMap('file-system-map');
    
    const fileContentIds = [];
    nodeMap.forEach(node => {
      if (node.get('type') === 'file' && node.get('fileContentId')) {
        fileContentIds.push(node.get('fileContentId'));
      }
    });

    const flushPromises = fileContentIds.map(contentId => {
      const fileDocName = `file-${contentId}`;
      console.log(`Flushing document: ${fileDocName}`);
      return mdb.flushDocument(fileDocName);
    });

    await Promise.all(flushPromises);

    ydoc.destroy();

    res.status(200).json({ message: 'Project saved successfully.' });
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
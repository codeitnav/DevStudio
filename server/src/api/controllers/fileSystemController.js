const Folder = require('../../models/Folder');
const File = require('../../models/File');
const Room = require('../../models/Room'); 
const fs = require('fs');
const path = require('path');

// HELPER FUNCTIONS

/**
 * Checks if a user has access to a room using the public-facing roomId.
 * @param {string} roomId - The public roomId of the room.
 * @param {string} userId - The user's MongoDB _id.
 * @returns {Promise<string|null>} The internal MongoDB _id of the room if access is granted, otherwise null.
 */
const checkRoomAccess = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room || !room.members.includes(userId)) {
    return null;
  }
  return room._id; 
};

/**
 * Checks if a user has access to a room by checking the membership based on a file or folder ID.
 * @param {mongoose.Model} model - The Mongoose model to use (File or Folder).
 * @param {string} itemId - The _id of the file or folder.
 * @param {string} userId - The user's MongoDB _id.
 * @returns {Promise<boolean>} True if the user has access, otherwise false.
 */
const checkAccessByItemId = async (model, itemId, userId) => {
    const item = await model.findById(itemId).populate('room');
    if (!item || !item.room || !item.room.members.includes(userId)) {
        return false;
    }
    return true;
};


// CONTROLLER FUNCTIONS 

// @desc    Create a new, empty file in a room
// @route   POST /api/fs/:roomId/files
// @access  Private
const createEmptyFile = async (req, res) => {
  const { name, folderId } = req.body;
  const { roomId } = req.params;

  const roomInternalId = await checkRoomAccess(roomId, req.user._id);
  if (!roomInternalId) {
    return res.status(403).json({ message: 'Access denied to this room' });
  }

  const dataToSave = {
    name,
    content: '',
    storageName: `empty-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    path: 'virtual',
    mimetype: 'text/plain',
    size: 0,
    room: roomInternalId,
    folder: folderId || null,
  };

  try {
    const newFile = await File.create(dataToSave);
    res.status(201).json(newFile);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A file with this name already exists here.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get contents of a folder in a room
// @route   GET /api/fs/:roomId/contents
// @access  Private
const getFolderContents = async (req, res) => {
  const { roomId } = req.params;
  const parentFolderId = req.query.folderId || null;

  const roomInternalId = await checkRoomAccess(roomId, req.user._id);
  if (!roomInternalId) {
    return res.status(403).json({ message: 'Access denied to this room' });
  }

  try {
    const folders = await Folder.find({ room: roomInternalId, parent: parentFolderId });
    const files = await File.find({ room: roomInternalId, folder: parentFolderId });
    
    res.status(200).json({ folders, files });
  } catch (error) {
    res.status(500).json({ message: 'Server error: Cannot get contents of the folder', error: error.message });
  }
};

// @desc    Create a new folder in a room
// @route   POST /api/fs/:roomId/folders
// @access  Private
const createFolder = async (req, res) => {
  const { name, parentId } = req.body;
  const { roomId } = req.params;

  const roomInternalId = await checkRoomAccess(roomId, req.user._id);
  if (!roomInternalId) {
    return res.status(403).json({ message: 'Access denied to this room' });
  }

  try {
    const newFolder = await Folder.create({
      name,
      room: roomInternalId,
      parent: parentId || null,
    });
    res.status(201).json(newFolder);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A folder with this name already exists here.' });
    }
    res.status(500).json({ message: 'Server error: Cannot create a new folder', error: error.message });
  }
};

// @desc    Upload a new file to a room
// @route   POST /api/fs/:roomId/files/upload
// @access  Private
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const { folderId } = req.body;
  const { roomId } = req.params;

  const roomInternalId = await checkRoomAccess(roomId, req.user._id);
  if (!roomInternalId) {
    fs.unlinkSync(req.file.path); // Clean up the uploaded file if access is denied
    return res.status(403).json({ message: 'Access denied to this room' });
  }

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const newFile = await File.create({
      name: req.file.originalname,
      storageName: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      room: roomInternalId,
      folder: folderId || null,
      content: fileContent,
    });
    res.status(201).json(newFile);
  } catch (error) {
    fs.unlinkSync(req.file.path);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A file with this name already exists here.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single file's details and content
// @route   GET /api/fs/files/:fileId
// @access  Private
const getFileById = async (req, res) => {
  try {
    if (!await checkAccessByItemId(File, req.params.fileId, req.user._id)) {
        return res.status(403).json({ message: 'Access denied or file not found' });
    }
    const file = await File.findById(req.params.fileId);
    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Download a file
// @route   GET /api/fs/files/:fileId/download
// @access  Private
const downloadFile = async (req, res) => {
  try {
    if (!await checkAccessByItemId(File, req.params.fileId, req.user._id)) {
        return res.status(403).json({ message: 'Access denied or file not found' });
    }
    const file = await File.findById(req.params.fileId);
    
    if (file.path === 'virtual') {
      res.setHeader('Content-disposition', `attachment; filename=${file.name}`);
      res.setHeader('Content-type', file.mimetype);
      res.send(file.content);
      return;
    }
    res.download(file.path, file.name);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a file
// @route   DELETE /api/fs/files/:fileId
// @access  Private
const deleteFile = async (req, res) => {
  try {
    if (!await checkAccessByItemId(File, req.params.fileId, req.user._id)) {
        return res.status(403).json({ message: 'Access denied or file not found' });
    }
    const file = await File.findById(req.params.fileId);

    if (file.path !== 'virtual') {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting physical file:", err);
      });
    }
    
    await File.findByIdAndDelete(req.params.fileId);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a folder and all its contents
// @route   DELETE /api/fs/folders/:folderId
// @access  Private
const deleteFolder = async (req, res) => {
    try {
        if (!await checkAccessByItemId(Folder, req.params.folderId, req.user._id)) {
            return res.status(403).json({ message: 'Access denied or folder not found' });
        }

        const deleteContents = async (folderId) => {
            const files = await File.find({ folder: folderId });
            for (const file of files) {
                if (file.path !== 'virtual') {
                  fs.unlink(file.path, (err) => {
                    if (err) console.error("Could not delete physical file:", err);
                  });
                }
                await File.findByIdAndDelete(file._id);
            }

            const subFolders = await Folder.find({ parent: folderId });
            for (const subFolder of subFolders) {
                await deleteContents(subFolder._id);
            }

            await Folder.findByIdAndDelete(folderId);
        };

        await deleteContents(req.params.folderId);
        res.status(200).json({ message: 'Folder and all its contents deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a file's content
// @route   PUT /api/fs/files/:fileId
// @access  Private
const updateFileContent = async (req, res) => {
  const { content } = req.body;
  
  if (typeof content !== 'string') {
    return res.status(400).json({ message: 'Content must be a string.' });
  }

  try {
    if (!await checkAccessByItemId(File, req.params.fileId, req.user._id)) {
        return res.status(403).json({ message: 'Access denied or file not found' });
    }
    const file = await File.findById(req.params.fileId);

    file.content = content;
    file.size = Buffer.byteLength(content, 'utf8');
    
    const updatedFile = await file.save();
    res.status(200).json(updatedFile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Rename a file or folder
// @route   PUT /api/fs/rename/:type/:id
// @access  Private
const renameItem = async (req, res) => {
  const { type, id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'New name is required' });
  }

  const model = type === 'file' ? File : Folder;

  try {
    if (!await checkAccessByItemId(model, id, req.user._id)) {
        return res.status(403).json({ message: 'Access denied or item not found' });
    }
    const item = await model.findById(id);

    item.name = name;
    await item.save();
    res.status(200).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An item with this name already exists here.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createEmptyFile,
  uploadFile,
  createFolder,
  getFolderContents,
  getFileById,
  updateFileContent,
  downloadFile,
  deleteFile,
  deleteFolder,
  renameItem,
};
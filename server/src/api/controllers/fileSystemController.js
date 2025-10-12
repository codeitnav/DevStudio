const Folder = require('../../models/Folder');
const File = require('../../models/File');
const fs = require('fs');
const path = require('path');

// @desc    Create a new, empty file
// @route   POST /api/fs/files
// @access  Private
// @body    { "name": "new-file.js", "folderId": "<folder_id>" }
const createEmptyFile = async (req, res) => {
  const { name, folderId } = req.body;
  const owner = req.user._id;

  if (!name) {
    return res.status(400).json({ message: 'File name is required.' });
  }

  const dataToSave = {
    name,
    content: '',
    storageName: `empty-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    path: 'virtual',
    mimetype: 'text/plain',
    size: 0,
    owner,
    folder: folderId || null,
  };

  try {
    const newFile = await File.create(dataToSave);
    console.log("SUCCESS: File created in DB.");
    res.status(201).json(newFile);
  } catch (error) {
    console.error("!!! DATABASE ERROR !!!");
    console.error("Full Error Object:", error); 

    if (error.code === 11000) {
      return res.status(400).json({ message: 'A file with this name already exists here.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get contents of a folder (subfolders and files)
// @route   GET /api/fs/contents
// @access  Private
// @query   ?folderId=<folder_id> (optional, for root if not provided)
const getFolderContents = async (req, res) => {
  const owner = req.user._id;
  const parentFolderId = req.query.folderId || null;

  try {
    // If not root, check if the user owns the parent folder
    if (parentFolderId) {
      const parentFolder = await Folder.findById(parentFolderId);
      if (!parentFolder || !parentFolder.owner.equals(owner)) {
        return res.status(403).json({ message: 'Access denied to this folder' });
      }
    }
    
    const folders = await Folder.find({ owner, parent: parentFolderId });
    const files = await File.find({ owner, folder: parentFolderId });
    
    res.status(200).json({ folders, files });
  } catch (error) {
    res.status(500).json({ message: 'Server error: Cannot get contents of the folder', error: error.message });
  }
};

// @desc    Create a new folder
// @route   POST /api/fs/folders
// @access  Private
// @body    { "name": "New Folder", "parentId": "<folder_id>" }
const createFolder = async (req, res) => {
  const { name, parentId } = req.body;
  const owner = req.user._id;

  try {
    const newFolder = await Folder.create({
      name,
      owner,
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

// @desc    Upload a new file
// @route   POST /api/fs/files/upload
// @access  Private
// @body    multipart/form-data with field "file" and optional "folderId"
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const { folderId } = req.body;
  const owner = req.user._id;

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const newFile = await File.create({
      name: req.file.originalname,
      storageName: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      owner,
      folder: folderId || null,
      content: fileContent, // Read content on upload
    });
    res.status(201).json(newFile);
  } catch (error) {
    // If DB entry fails, delete the orphaned physical file
    fs.unlinkSync(req.file.path);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A file with this name already exists here.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single file's details and content
// @route   GET /api/fs/files/:id
// @access  Private
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied or file not found' });
    }
    res.status(200).json(file); // Send the full file object including content
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Download a file
// @route   GET /api/fs/files/:id/download
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied or file not found' });
    }
    if(file.path === 'virtual') {
      // For virtual files, we can create a file on the fly from its content
      res.setHeader('Content-disposition', `attachment; filename=${file.name}`);
      res.setHeader('Content-type', file.mimetype);
      res.send(file.content);
      return;
    }
    res.download(file.path, file.name); // Sends the physical file for download
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Delete a file
// @route   DELETE /api/fs/files/:id
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied or file not found' });
    }

    // If it's a physical file, delete it from the 'uploads' folder
    if (file.path !== 'virtual') {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting physical file (it may not exist):", err);
      });
    }
    
    await File.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'File deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Delete a folder and all its contents
// @route   DELETE /api/fs/folders/:id
// @access  Private
const deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder || !folder.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied or folder not found' });
        }

        // Recursive deletion function
        const deleteContents = async (folderId) => {
            // Delete files in the current folder
            const files = await File.find({ folder: folderId });
            for (const file of files) {
                if (file.path !== 'virtual') {
                  fs.unlink(file.path, (err) => {
                    if (err) console.error("Could not delete physical file:", err);
                  });
                }
                await File.findByIdAndDelete(file._id);
            }

            // Find and recursively delete subfolders
            const subFolders = await Folder.find({ parent: folderId });
            for (const subFolder of subFolders) {
                await deleteContents(subFolder._id); // Recursive call
            }

            // Delete the folder itself
            await Folder.findByIdAndDelete(folderId);
        };

        await deleteContents(req.params.id);
        res.status(200).json({ message: 'Folder and all its contents deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a file's content
// @route   PUT /api/fs/files/:id
// @access  Private
const updateFileContent = async (req, res) => {
  const { content } = req.body;
  
  if (typeof content !== 'string') {
    return res.status(400).json({ message: 'Content must be a string.' });
  }

  try {
    const file = await File.findById(req.params.id);

    if (!file || !file.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied or file not found' });
    }

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
// @body    { "name": "New Name" }
const renameItem = async (req, res) => {
  const { type, id } = req.params;
  const { name } = req.body;
  const owner = req.user._id;
  
  if (!name) {
    return res.status(400).json({ message: 'New name is required' });
  }

  try {
    let item;
    const model = type === 'file' ? File : Folder;
    item = await model.findOne({ _id: id, owner });

    if (!item) {
      return res.status(404).json({ message: 'Item not found or access denied' });
    }

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

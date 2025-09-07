const express = require('express');
const fileSystemService = require('../../services/fileSystemService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/projects/:projectId/files
// @desc    Create a new file or folder
// @access  Public (should check room membership)
router.post('/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, name, parentId, content, extension } = req.body;

    // Validate required fields
    if (!type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Type and name are required'
      });
    }

    if (!['file', 'folder'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "file" or "folder"'
      });
    }

    // Extract user info (should be enhanced with proper auth)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let createdBy = 'anonymous';
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        createdBy = decoded.userId;
      } catch (err) {
        // Continue as anonymous
      }
    }

    const itemData = {
      type,
      name: name.trim(),
      parentId,
      content: content || '',
      extension,
      createdBy
    };

    const result = await fileSystemService.createFileSystemItem(projectId, itemData);

    res.status(201).json(result);

  } catch (error) {
    console.error('Error creating file system item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/projects/:projectId/files/:fileId
// @desc    Delete a file or folder
// @access  Public (should check room membership)
router.delete('/:projectId/files/:fileId', async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    const result = await fileSystemService.deleteFileSystemItem(projectId, fileId);

    res.json(result);

  } catch (error) {
    console.error('Error deleting file system item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/projects/:projectId/files/:fileId
// @desc    Rename a file or folder
// @access  Public (should check room membership)
router.put('/:projectId/files/:fileId', async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const result = await fileSystemService.renameFileSystemItem(
      projectId, 
      fileId, 
      name.trim()
    );

    res.json(result);

  } catch (error) {
    console.error('Error renaming file system item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/projects/:projectId/files
// @desc    Get file system structure
// @access  Public (should check room membership)
router.get('/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await fileSystemService.getFileSystemStructure(projectId);

    res.json(result);

  } catch (error) {
    console.error('Error getting file system structure:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/projects/:projectId/files/:fileId/content
// @desc    Get file content
// @access  Public (should check room membership)
router.get('/:projectId/files/:fileId/content', async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    const result = await fileSystemService.getFileContent(projectId, fileId);

    res.json(result);

  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/projects/:projectId/files/:fileId/content
// @desc    Update file content
// @access  Public (should check room membership)
router.put('/:projectId/files/:fileId/content', async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const { content } = req.body;

    // Extract user info for modification tracking
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let modifiedBy = 'anonymous';
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        modifiedBy = decoded.userId;
      } catch (err) {
        // Continue as anonymous
      }
    }

    const result = await fileSystemService.updateFileContent(
      projectId, 
      fileId, 
      content || '', 
      modifiedBy
    );

    res.json(result);

  } catch (error) {
    console.error('Error updating file content:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
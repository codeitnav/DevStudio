const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const upload = require('../../config/multerConfig');

const {
  createFolder,
  uploadFile,
  getFolderContents,
  downloadFile,
  updateFileContent,
  deleteFile,
  deleteFolder,
  renameItem,
  createEmptyFile,
  getFileById,
} = require('../controllers/fileSystemController');



// Apply authentication middleware to all routes
router.use(protect);


// Folder Routes
router.get('/contents', getFolderContents);    
router.post('/folders', createFolder);         
router.delete('/folders/:id', deleteFolder); 

// File Routes
router.post('/files', createEmptyFile);                    
router.post('/files/upload', upload.single('file'), uploadFile); 
router.put('/files/:id', updateFileContent); 
router.get('/files/:id', getFileById);                    
router.get('/files/:id/download', downloadFile);         
router.delete('/files/:id', deleteFile);                  

// Rename Route
router.put('/rename/:type/:id', renameItem);  // Rename a file or folder

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../../config/multerConfig');

const {
  createFolder,
  getFolderContents,
  deleteFolder,
  createEmptyFile,
  uploadFile,
  updateFileContent,
  getFileById,
  downloadFile,
  deleteFile,
  renameItem,
} = require('../controllers/fileSystemController');

router.use(protect);

// Nested routes under a specific room
router.get('/:roomId/contents', getFolderContents);
router.post('/:roomId/folders', createFolder);
router.post('/:roomId/files', createEmptyFile);
router.post('/:roomId/files/upload', upload.single('file'), uploadFile);

// Routes for specific files/folders (these don't need roomId in the URL
// as we can get the room from the item's document in the DB)
router.delete('/folders/:folderId', deleteFolder);
router.put('/files/:fileId', updateFileContent);
router.get('/files/:fileId', getFileById);
router.get('/files/:fileId/download', downloadFile);
router.delete('/files/:fileId', deleteFile);
router.put('/rename/:type/:id', renameItem);

module.exports = router;
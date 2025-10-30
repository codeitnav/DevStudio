const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

if (typeof askAI !== 'function') {
   console.error(
    "FATAL: AI controller function is missing. " +
    "Check exports in 'server/src/api/controllers/aiController.js'."
  );
} else {
  router.post('/ask', protect, askAI);
}

module.exports = router;
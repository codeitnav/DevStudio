const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');

if (typeof authMiddleware !== 'function') {
  console.error(
    "FATAL: 'authMiddleware' is not a function. " +
    "Check the export in 'server/src/api/middleware/authMiddleware.js'."
  );
  console.warn(
    "Registering /api/ai/ask route UNPROTECTED as a fallback to prevent server crash."
  );
  router.post('/ask', askAI);
} else if (typeof askAI !== 'function') {
   console.error(
    "FATAL: 'askAI' controller is not a function. " +
    "Check the export in 'server/src/api/controllers/aiController.js'."
  );
}
else {
  router.post('/ask', authMiddleware, askAI);
}

module.exports = router;
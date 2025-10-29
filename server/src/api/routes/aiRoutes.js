const express = require('express');
const router = express.Router();
const { askAI, generateProjectSummary } = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Check if authMiddleware is a function
if (typeof authMiddleware !== 'function') {
  console.error(
    "FATAL: 'authMiddleware' is not a function. " +
    "Check the export in 'server/src/api/middleware/authMiddleware.js'."
  );
  console.warn(
    "Registering AI routes UNPROTECTED as a fallback to prevent server crash."
  );
  
  // Register routes without auth
  router.post('/ask', askAI);
  router.get('/summary/:roomId', generateProjectSummary);

} else if (typeof askAI !== 'function' || typeof generateProjectSummary !== 'function') {
   console.error(
    "FATAL: AI controller function is missing. " +
    "Check exports in 'server/src/api/controllers/aiController.js'."
  );
}
else {
  // --- [SECURE] AI Pair Programmer Route ---
  // Protects the endpoint, ensuring only logged-in users can use AI features
  router.post('/ask', authMiddleware, askAI);

  // --- [SECURE] AI Summarizer Route ---
  // Protects the endpoint, ensuring only logged-in users can generate summaries
  router.get('/summary/:roomId', authMiddleware, generateProjectSummary);
}

module.exports = router;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { mdb } = require('../../config/yjs'); // Import Yjs instance
const Room = require('../../models/Room'); // Import Room model

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

/**
 * Helper function to call the Gemini API with retry logic.
 */
const callGeminiWithRetry = async (prompt, maxRetries = 3) => {
  let lastError = null;
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Switched to 2.5 Flash as requested
    safetySettings,
  });

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    } catch (error) {
      lastError = error;
      if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
        console.warn(`[DevStudio AI] Gemini API overloaded. Retrying... (${i + 1}/${maxRetries})`);
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        // Don't retry on non-retryable errors (like 404, 400)
        throw error;
      }
    }
  }
  // If loop finishes without returning, all retries failed
  console.error('[DevStudio AI] Gemini API call failed after all retries.', lastError);
  throw new Error(`AI API Error: ${lastError.message}`);
};

/**
 * @desc    Handle AI chat query
 * @route   POST /api/ai/ask
 * @access  Private
 */
const askAI = async (req, res) => {
  const { query, codeContext } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required.' });
  }

  const fullPrompt = `
You are DevStudio AI, a helpful pair programmer. 
Based on the following code context, please answer the user's question.
Provide your answer in GitHub-flavored Markdown.

---CODE CONTEXT---
${codeContext || 'No code context provided.'}
---END CODE CONTEXT---

---USER QUESTION---
${query}
---END USER QUESTION---
`;

  try {
    const aiMessage = await callGeminiWithRetry(fullPrompt);
    res.status(200).json({ message: aiMessage });
  } catch (error) {
    console.error('[DevStudio AI] Error in askAI:', error);
    const apiErrorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ message: `AI API Error: ${apiErrorMessage}` });
  }
};

/**
 * @desc    Generate a summary for a project
 * @route   GET /api/ai/summary/:roomId
 * @access  Private
 */
const generateProjectSummary = async (req, res) => {
  const { roomId } = req.params;

  try {
    // 1. Verify user is a member of the room (for security)
    const room = await Room.findOne({ roomId, members: req.user._id });
    if (!room) {
      return res.status(403).json({ message: 'Access denied or room not found.' });
    }

    // 2. Get the file system YDoc for the room
    const fileSystemDocName = `files-${roomId}`;
    const fileSystemYDoc = await mdb.getYDoc(fileSystemDocName);
    const fileSystemMap = fileSystemYDoc.getMap('file-system-map');

    if (fileSystemMap.size === 0) {
      return res.status(200).json({ message: "This project is empty. There's nothing to summarize." });
    }

    // 3. Create a list of all file content promises
    const fileContentPromises = [];
    fileSystemMap.forEach((node, nodeId) => {
      if (node.get('type') === 'file') {
        const fileContentId = node.get('fileContentId');
        const fileName = node.get('name');
        if (fileContentId) {
          const fileDocName = `file-${fileContentId}`;
          fileContentPromises.push(
            mdb.getYDoc(fileDocName).then(fileYDoc => ({
              name: fileName,
              content: fileYDoc.getText('file-content').toString(),
            }))
          );
        }
      }
    });

    if (fileContentPromises.length === 0) {
      return res.status(200).json({ message: "This project only contains empty folders. There's no code to summarize." });
    }

    // 4. [FIX] Fetch all files using Promise.allSettled
    // This prevents one bad file doc from crashing the entire operation
    const results = await Promise.allSettled(fileContentPromises);

    let combinedContent = '';
    let failedCount = 0;

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.content.trim()) {
        // Add file content to the context for the AI
        combinedContent += `\n\n--- FILE: ${result.value.name} ---\n`;
        combinedContent += result.value.content;
      } else if (result.status === 'rejected') {
        // Log files that failed to load, but don't crash
        console.warn(`[DevStudio AI] Failed to read file for summary:`, result.reason);
        failedCount++;
      }
    });

    if (!combinedContent.trim()) {
      if (failedCount > 0) {
        return res.status(500).json({ message: 'Failed to read project files. Please try again.' });
      }
      return res.status(200).json({ message: 'All files in this project are empty.' });
    }

    // 5. Build the final prompt for the AI
    const summaryPrompt = `
You are an expert project manager and senior software engineer.
Analyze the following code files from a project named "${room.name}" and provide a concise summary.
Your summary should be in GitHub-flavored Markdown and include:

1.  **Project Overview**: A high-level, one-paragraph description of what this project seems to do.
2.  **Key Files**: A bulleted list of the 2-3 most important files and their likely purpose.
3.  **Technology Stack**: A brief guess at the main technologies or languages being used.
4.  **Next Steps**: One or two suggested next steps for completing the project.

--- PROJECT CODE ---
${combinedContent}
--- END PROJECT CODE ---
`;

    // 6. Call AI and send response
    const aiSummary = await callGeminiWithRetry(summaryPrompt);
    res.status(200).json({ message: aiSummary });

  } catch (error) {
    console.error(`[DevStudio AI] Error in generateProjectSummary for room ${roomId}:`, error);
    const apiErrorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ message: `AI API Error: ${apiErrorMessage}` });
  }
};


module.exports = {
  askAI,
  generateProjectSummary,
};
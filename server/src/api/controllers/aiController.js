const { GoogleGenerativeAI } = require('@google/generative-ai');
// Removed unused imports for mdb and Room model

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

/**
 * Helper function to call the Gemini API with retry logic.
 */
const callGeminiWithRetry = async (prompt, maxRetries = 3) => {
  let lastError = null;
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings });

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    } catch (error) {
      lastError = error;
      if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
        console.warn(`[DevStudio AI] Gemini API overloaded. Retrying... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
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

module.exports = {
  askAI,
};
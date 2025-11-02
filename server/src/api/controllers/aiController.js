const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

/**
 * Helper: Call Gemini API with exponential backoff + fallback model logic.
 */
const callGeminiWithRetry = async (prompt, maxRetries = 4) => {
  let lastError = null;

  for (const modelName of MODELS) {
    console.log(`[DevStudio AI] Trying model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return await response.text();
      } catch (error) {
        lastError = error;
        const message = error.message || '';

        if (message.includes('503') || message.includes('overloaded')) {
          const delay = 1000 * Math.pow(2, i) + Math.random() * 500;
          console.warn(`[DevStudio AI] ${modelName} overloaded. Retrying in ${(delay / 1000).toFixed(1)}s (${i + 1}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
        } else if (message.includes('404')) {
          console.warn(`[DevStudio AI] ${modelName} not supported. Trying fallback model...`);
          break; // Move to next model in MODELS
        } else {
          throw error; // For other API errors
        }
      }
    }

    console.warn(`[DevStudio AI] Model ${modelName} failed after ${maxRetries} retries. Switching fallback...`);
  }

  console.error('[DevStudio AI] All models failed.', lastError);
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
You are DevStudio AI, a helpful and context-aware pair programmer.
Based on the following code, answer the user's question clearly in Markdown.

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
    console.error('[DevStudio AI] askAI Error:', error);
    const apiErrorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ message: `AI API Error: ${apiErrorMessage}` });
  }
};

module.exports = { askAI };

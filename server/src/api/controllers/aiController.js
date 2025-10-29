const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const maxRetries = 3;
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const aiMessage = await response.text();
        return res.status(200).json({ message: aiMessage });
      } catch (error) {
        lastError = error;
        if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
          console.warn(`Gemini API overloaded. Retrying... (${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); 
        } else {
          throw error;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

  } catch (error) {
    console.error('Error calling Gemini API after retries:', error);
    const apiErrorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ message: `AI API Error: ${apiErrorMessage}` });
  }
};

module.exports = { askAI };
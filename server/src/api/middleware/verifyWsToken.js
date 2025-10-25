const jwt = require('jsonwebtoken');

/**
 * Verifies JWT from WebSocket query params.
 * Client URL example: ws://localhost:5000/editor/room123?token=YOUR_JWT
 */
const verifyWsToken = (req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('❌ Missing token in WebSocket request');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // { userId, username, iat, exp }
  } catch (err) {
    console.error('❌ Invalid or expired JWT:', err.message);
    return null;
  }
};

module.exports = { verifyWsToken };

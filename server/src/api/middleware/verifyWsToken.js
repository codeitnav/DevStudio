const jwt = require('jsonwebtoken');

const verifyWsToken = (req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('❌ Missing token in WebSocket request');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('❌ Invalid or expired JWT:', err.message);
    return null;
  }
};

module.exports = { verifyWsToken };
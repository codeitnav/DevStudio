// --- Imports ---
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

// --- Local Imports ---
const connectDB = require('./config/db');
const { mdb } = require('./config/yjs');
const { initWebSocketServer } = require('./services/websocketService');
const authRoutes = require('./api/routes/authRoutes'); 
const roomRoutes = require('./api/routes/roomRoutes'); 
const aiRoutes = require('./api/routes/aiRoutes'); // --- [NEW] Register AI routes

// --- Environment Variable Validation ---
const { PORT } = process.env;
if (!PORT) {
  console.error('Error: Missing required environment variable PORT.');
  process.exit(1);
}

connectDB();
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// --- REST API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes); // --- This line registers all AI routes ---

// --- HTTP Server Creation ---
const server = http.createServer(app);

// --- Initialize WebSocket Server ---
// Pass the HTTP server and the Yjs persistence instance
initWebSocketServer(server, mdb);

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`  REST API listening on http://localhost:${PORT}`);
  console.log(`  WebSocket Server listening on ws://localhost:${PORT}`);
});


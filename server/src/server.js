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
// You could add other REST routes here (e.g., for creating/managing rooms)

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


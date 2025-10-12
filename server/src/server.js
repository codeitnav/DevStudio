require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const authRoutes = require('./api/routes/authRoutes');
const fileSystemRoutes = require('./api/routes/fileSystemRoutes');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database Connection 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/fs', fileSystemRoutes);

// Yjs WebSocket Server 
const wss = new Server({ server });
wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server with Yjs WebSocket support running at http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const cron = require('node-cron');
const { cleanupGuestData } = require('./jobs/cleanup');

const authRoutes = require('./api/routes/authRoutes');
const fileSystemRoutes = require('./api/routes/fileSystemRoutes');
const roomRoutes = require('./api/routes/roomRoutes'); 
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
app.use('/api/rooms', roomRoutes); 

// Yjs WebSocket Server 
const wss = new Server({ server });
wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

// Schedule the cleanup job
cron.schedule('0 0 * * *', cleanupGuestData, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});
console.log('Scheduled guest data cleanup job to run daily at midnight.');

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server with Yjs WebSocket support running at http://localhost:${PORT}`);
});
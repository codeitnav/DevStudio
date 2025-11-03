require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { mdb } = require('./config/yjs');
const { initWebSocketServer } = require('./services/websocketService');
const authRoutes = require('./api/routes/authRoutes'); 
const roomRoutes = require('./api/routes/roomRoutes'); 
const aiRoutes = require('./api/routes/aiRoutes'); 

const { PORT } = process.env;
if (!PORT) {
  console.error('Error: Missing required environment variable PORT.');
  process.exit(1);
}

connectDB();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://dev-studio-code-editor.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: The origin ${origin} is not allowed`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes);

const server = http.createServer(app);
initWebSocketServer(server, mdb);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`  REST API listening on http://localhost:${PORT}`);
  console.log(`  WebSocket Server listening on ws://localhost:${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mdb.destroy(); 
      console.log('Yjs persistence flushed to MongoDB.');
      process.exit(0);
    } catch (err) {
      console.error('Error flushing Yjs persistence during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
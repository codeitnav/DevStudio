const WebSocket = require('ws');
const { setupYjsConnection, roomManager } = require('./yjsServer');

function initializeWebSocketServers(server) {
  // Existing Socket.IO server 
  const io = require('socket.io')(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Add Yjs WebSocket server on different path
  const yjsWss = new WebSocket.Server({ 
    server,
    path: '/yjs-sync'
  });

  yjsWss.on('connection', (ws, req) => {
    setupYjsConnection(ws, req);
  });

  // Optional: Add room stats endpoint
  yjsWss.on('listening', () => {
    console.log('Yjs WebSocket server ready on /yjs-sync');
  });

  return { io, yjsWss, roomManager };
}

module.exports = { initializeWebSocketServers };
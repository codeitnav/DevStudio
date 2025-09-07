const WebSocket = require('ws');
const { setupWSConnection } = require('@y/websocket-server');
const Y = require('yjs');
const url = require('url');

class YjsRoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      const doc = new Y.Doc();
      const room = {
        doc: doc,
        clients: new Set(),
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      this.rooms.set(roomId, room);
      this.setupRoomEvents(roomId, doc);
      console.log(`Created new Yjs room: ${roomId}`);
    }
    
    return this.rooms.get(roomId);
  }

  setupRoomEvents(roomId, doc) {
    doc.on('update', (update) => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.lastActivity = new Date();
      }
    });
  }

  addClientToRoom(roomId, clientId) {
    const room = this.getOrCreateRoom(roomId);
    room.clients.add(clientId);
    console.log(`Client ${clientId} joined room ${roomId}. Total clients: ${room.clients.size}`);
    return room.doc;
  }

  removeClientFromRoom(roomId, clientId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.delete(clientId);
      console.log(`Client ${clientId} left room ${roomId}. Remaining clients: ${room.clients.size}`);
      
      // Clean up empty rooms after 5 minutes of inactivity
      if (room.clients.size === 0) {
        setTimeout(() => {
          const currentRoom = this.rooms.get(roomId);
          if (currentRoom && currentRoom.clients.size === 0) {
            this.rooms.delete(roomId);
            console.log(`Cleaned up empty room: ${roomId}`);
          }
        }, 300000); // 5 minutes
      }
    }
  }

  getRoomStats() {
    const stats = {};
    this.rooms.forEach((room, roomId) => {
      stats[roomId] = {
        clients: room.clients.size,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      };
    });
    return stats;
  }
}

const roomManager = new YjsRoomManager();

function setupYjsConnection(ws, req) {
  const urlParts = url.parse(req.url, true);
  const roomId = urlParts.query.room;
  
  if (!roomId) {
    ws.close(1008, 'Room ID required');
    return;
  }

  // Generate client ID
  const clientId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

  // Add client to room
  roomManager.addClientToRoom(roomId, clientId);

  // Set up Yjs WebSocket connection
  setupWSConnection(ws, req, {
    docName: roomId,
    gc: true // Enable garbage collection
  });

  // Handle client disconnect
  ws.on('close', () => {
    roomManager.removeClientFromRoom(roomId, clientId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId} in room ${roomId}:`, error);
    roomManager.removeClientFromRoom(roomId, clientId);
  });
}

module.exports = {
  setupYjsConnection,
  roomManager
};

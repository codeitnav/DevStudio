const jwt = require('jsonwebtoken');

// Store active rooms and users
const activeRooms = new Map();
const userSessions = new Map();

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      handleUserDisconnect(socket);
    });
  });

  // Room namespace for collaborative coding
  const roomNamespace = io.of('/room');
  
  roomNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.username = decoded.username;
      } else {
        // Guest user
        socket.userId = `guest_${socket.id}`;
        socket.username = socket.handshake.auth.username || 'Anonymous';
      }
      next();
    } catch (err) {
      console.log('Socket authentication error:', err);
      socket.userId = `guest_${socket.id}`;
      socket.username = 'Anonymous';
      next();
    }
  });

  roomNamespace.on('connection', (socket) => {
    console.log(`User ${socket.username} connected to room namespace: ${socket.id}`);
    
    // Store user session
    userSessions.set(socket.id, {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id
    });

    // Join room event
    socket.on('join-room', async (data) => {
      const { roomId, language = 'javascript' } = data;
      
      try {
        // Leave previous room if exists
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom);
          await handleLeaveRoom(socket, socket.currentRoom);
        }

        // Join new room
        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.currentLanguage = language;

        // Initialize room if doesn't exist
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            id: roomId,
            users: new Map(),
            code: '// Welcome to DevStudio!\n// Start collaborative coding...\n',
            language: language,
            createdAt: new Date()
          });
        }

        const room = activeRooms.get(roomId);
        
        // Add user to room
        room.users.set(socket.id, {
          userId: socket.userId,
          username: socket.username,
          socketId: socket.id,
          cursor: { line: 0, ch: 0 },
          selection: null
        });

        // Send current room state to joined user
        socket.emit('room-joined', {
          roomId: roomId,
          code: room.code,
          language: room.language,
          users: Array.from(room.users.values())
        });

        // Notify other users in room
        socket.to(roomId).emit('user-joined', {
          userId: socket.userId,
          username: socket.username,
          socketId: socket.id
        });

        // Send updated user list to all users in room
        roomNamespace.to(roomId).emit('users-update', {
          users: Array.from(room.users.values())
        });

        console.log(`User ${socket.username} joined room ${roomId}`);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('room-error', { message: 'Failed to join room' });
      }
    });

    // Code change event
    socket.on('code-change', (data) => {
      const { roomId, code, changes } = data;
      
      if (socket.currentRoom !== roomId) return;

      const room = activeRooms.get(roomId);
      if (room) {
        room.code = code;
        
        // Broadcast code changes to other users in the room
        socket.to(roomId).emit('code-update', {
          code,
          changes,
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Cursor position event
    socket.on('cursor-change', (data) => {
      const { roomId, cursor, selection } = data;
      
      if (socket.currentRoom !== roomId) return;

      const room = activeRooms.get(roomId);
      if (room && room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        user.cursor = cursor;
        user.selection = selection;

        // Broadcast cursor position to other users
        socket.to(roomId).emit('cursor-update', {
          userId: socket.userId,
          username: socket.username,
          cursor,
          selection
        });
      }
    });

    // Language change event
    socket.on('language-change', (data) => {
      const { roomId, language } = data;
      
      if (socket.currentRoom !== roomId) return;

      const room = activeRooms.get(roomId);
      if (room) {
        room.language = language;
        socket.currentLanguage = language;

        // Broadcast language change to all users in room
        roomNamespace.to(roomId).emit('language-update', {
          language,
          changedBy: socket.username
        });
      }
    });

    // Chat message event
    socket.on('chat-message', (data) => {
      const { roomId, message } = data;
      
      if (socket.currentRoom !== roomId) return;

      // Broadcast message to all users in room
      roomNamespace.to(roomId).emit('chat-message', {
        userId: socket.userId,
        username: socket.username,
        message,
        timestamp: new Date()
      });
    });

    // Leave room event
    socket.on('leave-room', async () => {
      if (socket.currentRoom) {
        await handleLeaveRoom(socket, socket.currentRoom);
        socket.leave(socket.currentRoom);
        socket.currentRoom = null;
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.username} disconnected from room namespace`);
      
      if (socket.currentRoom) {
        await handleLeaveRoom(socket, socket.currentRoom);
      }
      
      userSessions.delete(socket.id);
    });
  });

  // Admin namespace for monitoring
  const adminNamespace = io.of('/admin');
  
  adminNamespace.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    
    // Send server stats
    socket.emit('server-stats', {
      activeRooms: activeRooms.size,
      connectedUsers: userSessions.size,
      rooms: Array.from(activeRooms.values()).map(room => ({
        id: room.id,
        userCount: room.users.size,
        language: room.language,
        createdAt: room.createdAt
      }))
    });

    socket.on('get-room-details', (roomId) => {
      const room = activeRooms.get(roomId);
      if (room) {
        socket.emit('room-details', {
          ...room,
          users: Array.from(room.users.values())
        });
      }
    });
  });
}

// Helper function to handle user leaving room
async function handleLeaveRoom(socket, roomId) {
  const room = activeRooms.get(roomId);
  if (room) {
    room.users.delete(socket.id);
    
    // Notify other users
    socket.to(roomId).emit('user-left', {
      userId: socket.userId,
      username: socket.username
    });

    // Send updated user list
    socket.to(roomId).emit('users-update', {
      users: Array.from(room.users.values())
    });

    // Clean up empty rooms after 5 minutes
    if (room.users.size === 0) {
      setTimeout(() => {
        if (activeRooms.has(roomId) && activeRooms.get(roomId).users.size === 0) {
          activeRooms.delete(roomId);
          console.log(`Cleaned up empty room: ${roomId}`);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  }
}

// Helper function to handle general user disconnect
function handleUserDisconnect(socket) {
  userSessions.delete(socket.id);
}

module.exports = setupSocketHandlers;
const jwt = require("jsonwebtoken");
const roomService = require("../services/roomService");
const Room = require("../models/Room");
const RoomMember = require("../models/RoomMember");
const bcrypt = require("bcryptjs");

// Store active rooms and user sessions
const activeRooms = new Map();
const userSessions = new Map();

function setupSocketHandlers(io) {
  // Main Socket.IO connection handler
  io.on("connection", (socket) => {
    console.log(`🔗 Socket client connected: ${socket.id}`);

    // Extract user information from authentication
    extractUserInfo(socket);

    // Core Task 2.3 Events
    handleJoinRoom(socket, io);
    handleLeaveRoom(socket, io);
    handleYjsUpdate(socket, io);
    handleCursorUpdate(socket, io);

    // Additional collaboration events
    handleCodeChange(socket, io);
    handleLanguageChange(socket, io);
    handleUserTyping(socket, io);
    handleAwarenessUpdate(socket, io);

    // Connection management
    handleDisconnect(socket, io);
  });
}

// Extract user information from token or create guest user
function extractUserInfo(socket) {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userData = {
        userId: decoded.userId,
        username: decoded.username || decoded.email || "User",
        userType: "user",
        isAuthenticated: true,
      };
      console.log(
        `👤 Authenticated user connected: ${socket.userData.username}`
      );
    } catch (error) {
      console.log(`⚠️ Invalid token for socket ${socket.id}:`, error.message);
      socket.userData = createGuestUser(socket);
    }
  } else {
    socket.userData = createGuestUser(socket);
  }

  // Store user session
  userSessions.set(socket.id, {
    ...socket.userData,
    socketId: socket.id,
    connectedAt: new Date(),
  });
}

function createGuestUser(socket) {
  const guestId = `guest_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
  const guestName = `Guest_${socket.id.substring(0, 6)}`;

  console.log(`👤 Guest user connected: ${guestName}`);

  return {
    userId: guestId,
    username: guestName,
    userType: "guest",
    isAuthenticated: false,
  };
}

// Core Event 1: join-room - A user connects to a specific room ID
function handleJoinRoom(socket, io) {
  socket.on("join-room", async (data) => {
    try {
      const { roomId, password = "" } = data;
      console.log(
        `🚪 ${socket.userData.username} attempting to join room: ${roomId}`
      );

      // Validate room exists in database
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }],
      });

      if (!room) {
        socket.emit("join-room-error", {
          error: "Room not found",
          code: "ROOM_NOT_FOUND",
        });
        return;
      }

      // Check password for private rooms
      if (room.isPrivate && room.password) {
        if (!password || !(await bcrypt.compare(password, room.password))) {
          socket.emit("join-room-error", {
            error: "Invalid password",
            code: "INVALID_PASSWORD",
            requiresPassword: true,
          });
          return;
        }
      }

      // Check room capacity
      const currentMembers = await RoomMember.countDocuments({
        roomId: room.roomId,
      });

      if (currentMembers >= room.maxMembers) {
        socket.emit("join-room-error", {
          error: "Room is full",
          code: "ROOM_FULL",
        });
        return;
      }

      // Leave previous room if exists
      if (socket.currentRoomId) {
        await performLeaveRoom(socket, socket.currentRoomId, io);
      }

      // Join the new room
      socket.join(room.roomId);
      socket.currentRoomId = room.roomId;

      // Initialize room in activeRooms if not exists
      if (!activeRooms.has(room.roomId)) {
        activeRooms.set(room.roomId, {
          id: room.roomId,
          name: room.roomName,
          users: new Map(),
          code: room.code,
          language: room.language,
          createdAt: room.createdAt,
          lastActivity: new Date(),
        });
      }

      const activeRoom = activeRooms.get(room.roomId);

      // Add user to active room
      activeRoom.users.set(socket.id, {
        userId: socket.userData.userId,
        username: socket.userData.username,
        userType: socket.userData.userType,
        socketId: socket.id,
        cursor: { line: 0, ch: 0 },
        selection: null,
        color: getUserColor(socket.userData.userId),
        joinedAt: new Date(),
      });

      // Initialize Yjs document for CRDT
      roomService.initializeYjsDocument(room.roomId);
      roomService.addActiveCollaborator(room.roomId, socket.userData.userId);

      // Update/create room member in database
      await updateRoomMember(room.roomId, socket.userData);

      // Get current room state
      const roomState = await getRoomState(room.roomId);

      // Send success response to joining user
      socket.emit("join-room-success", {
        roomId: room.roomId,
        roomName: room.roomName,
        code: activeRoom.code,
        language: activeRoom.language,
        settings: room.settings,
        websocketUrl: `ws://localhost:${process.env.PORT}/yjs?room=${room.roomId}`,
        ...roomState,
      });

      // Notify others in room about new user
      socket.to(room.roomId).emit("user-joined-room", {
        userId: socket.userData.userId,
        username: socket.userData.username,
        userType: socket.userData.userType,
        socketId: socket.id,
        color: getUserColor(socket.userData.userId),
        joinedAt: new Date(),
      });

      // Broadcast updated user list to all users in room
      const users = Array.from(activeRoom.users.values());
      io.to(room.roomId).emit("users-update", { users });

      console.log(
        `✅ ${socket.userData.username} joined room: ${room.roomId} (${users.length} users)`
      );
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("join-room-error", {
        error: "Failed to join room",
        code: "SERVER_ERROR",
      });
    }
  });
}

// Core Event 2: leave-room - A user disconnects
function handleLeaveRoom(socket, io) {
  socket.on("leave-room", async (data) => {
    try {
      const roomId = data?.roomId || socket.currentRoomId;

      if (!roomId) {
        socket.emit("leave-room-error", { error: "No room to leave" });
        return;
      }

      await performLeaveRoom(socket, roomId, io);
      socket.emit("leave-room-success", { roomId });

      console.log(`🚪 ${socket.userData.username} left room: ${roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
      socket.emit("leave-room-error", { error: "Failed to leave room" });
    }
  });
}

// Core Event 3: yjs-update - Main event for broadcasting CRDT changes
function handleYjsUpdate(socket, io) {
  socket.on("yjs-update", async (data) => {
    try {
      const { roomId, update, origin } = data;

      if (!roomId || !socket.rooms.has(roomId)) {
        console.warn(
          `⚠️ Unauthorized yjs-update attempt from ${socket.userData.username} to room: ${roomId}`
        );
        return;
      }

      console.log(
        `📝 Yjs update from ${socket.userData.username} in room: ${roomId}`
      );

      // Apply update to room service for persistence
      if (update) {
        await roomService.applyDocumentUpdate(
          roomId,
          update,
          socket.userData.userId
        );
      }

      // Update active room code if available
      const activeRoom = activeRooms.get(roomId);
      if (activeRoom) {
        activeRoom.lastActivity = new Date();
      }

      // Broadcast to all other clients in the room
      socket.to(roomId).emit("yjs-update", {
        update,
        origin: origin || socket.userData.userId,
        timestamp: new Date(),
        fromUser: {
          userId: socket.userData.userId,
          username: socket.userData.username,
          color: getUserColor(socket.userData.userId),
        },
      });

      // Update database room activity
      await Room.findOneAndUpdate(
        { $or: [{ roomId }, { joinCode: roomId }] },
        { lastActivity: new Date() }
      );
    } catch (error) {
      console.error("Error handling yjs-update:", error);
      socket.emit("yjs-update-error", { error: "Failed to process update" });
    }
  });
}

// Core Event 4: cursor-update - Broadcasts real-time cursor positions
function handleCursorUpdate(socket, io) {
  socket.on("cursor-update", (data) => {
    try {
      const { roomId, position, selection } = data;

      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      // Update cursor in active room
      const activeRoom = activeRooms.get(roomId);
      if (activeRoom && activeRoom.users.has(socket.id)) {
        const user = activeRoom.users.get(socket.id);
        user.cursor = position;
        user.selection = selection;
      }

      // Broadcast cursor position to all other clients in room (volatile for performance)
      socket.volatile.to(roomId).emit("cursor-update", {
        userId: socket.userData.userId,
        username: socket.userData.username,
        socketId: socket.id,
        position,
        selection,
        color: getUserColor(socket.userData.userId),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error handling cursor-update:", error);
    }
  });
}

// Additional Event: code-change - Real-time code synchronization
function handleCodeChange(socket, io) {
  socket.on("code-change", async (data) => {
    try {
      const { roomId, code, delta, language } = data;

      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      console.log(
        `💾 Code change from ${socket.userData.username} in room: ${roomId}`
      );

      // Update active room
      const activeRoom = activeRooms.get(roomId);
      if (activeRoom) {
        activeRoom.code = code;
        if (language) activeRoom.language = language;
        activeRoom.lastActivity = new Date();
      }

      // Broadcast to others immediately
      socket.to(roomId).emit("code-change", {
        code,
        delta,
        language,
        fromUser: {
          userId: socket.userData.userId,
          username: socket.userData.username,
          color: getUserColor(socket.userData.userId),
        },
        timestamp: new Date(),
      });

      // Debounced database save
      debounceCodeSave(roomId, code, language);
    } catch (error) {
      console.error("Error handling code-change:", error);
    }
  });
}

// Additional Event: language-change
function handleLanguageChange(socket, io) {
  socket.on("language-change", async (data) => {
    try {
      const { roomId, language } = data;

      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      // Update active room
      const activeRoom = activeRooms.get(roomId);
      if (activeRoom) {
        activeRoom.language = language;
        activeRoom.lastActivity = new Date();
      }

      // Update database
      await Room.findOneAndUpdate(
        { $or: [{ roomId }, { joinCode: roomId }] },
        { language, lastActivity: new Date() }
      );

      // Broadcast to all clients in room
      io.to(roomId).emit("language-change", {
        language,
        fromUser: {
          userId: socket.userData.userId,
          username: socket.userData.username,
        },
        timestamp: new Date(),
      });

      console.log(`🔧 Language changed to ${language} in room: ${roomId}`);
    } catch (error) {
      console.error("Error handling language-change:", error);
    }
  });
}

// Additional Event: user-typing - Typing indicators
function handleUserTyping(socket, io) {
  socket.on("user-typing", (data) => {
    try {
      const { roomId, isTyping } = data;

      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      // Broadcast typing status (volatile for performance)
      socket.volatile.to(roomId).emit("user-typing", {
        userId: socket.userData.userId,
        username: socket.userData.username,
        isTyping,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error handling user-typing:", error);
    }
  });
}

// Additional Event: awareness-update - User presence and selection state
function handleAwarenessUpdate(socket, io) {
  socket.on("awareness-update", async (data) => {
    try {
      const { roomId, awareness } = data;

      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      // Update awareness in room service
      await roomService.updateAwareness(
        roomId,
        socket.userData.userId,
        awareness
      );

      // Broadcast awareness to others
      socket.to(roomId).emit("awareness-update", {
        userId: socket.userData.userId,
        username: socket.userData.username,
        awareness,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error handling awareness-update:", error);
    }
  });
}

// Handle disconnect
function handleDisconnect(socket, io) {
  socket.on("disconnect", async (reason) => {
    console.log(`❌ Socket ${socket.userData.username} disconnected:`, reason);

    if (socket.currentRoomId) {
      await performLeaveRoom(socket, socket.currentRoomId, io);
    }

    // Clean up user session
    userSessions.delete(socket.id);
  });
}

// Helper Functions
async function performLeaveRoom(socket, roomId, io) {
  try {
    // Leave the socket.io room
    socket.leave(roomId);

    // Remove from active room
    const activeRoom = activeRooms.get(roomId);
    if (activeRoom) {
      activeRoom.users.delete(socket.id);

      // Notify others
      socket.to(roomId).emit("user-left-room", {
        userId: socket.userData.userId,
        username: socket.userData.username,
        socketId: socket.id,
        reason: "left",
      });

      // Send updated user list
      const users = Array.from(activeRoom.users.values());
      io.to(roomId).emit("users-update", { users });

      // Clean up empty rooms after 5 minutes
      if (activeRoom.users.size === 0) {
        setTimeout(() => {
          if (
            activeRooms.has(roomId) &&
            activeRooms.get(roomId).users.size === 0
          ) {
            activeRooms.delete(roomId);
            console.log(`🗑️ Cleaned up empty room: ${roomId}`);
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    }

    // Remove from CRDT service
    roomService.removeActiveCollaborator(roomId, socket.userData.userId);

    // Update database member status
    await RoomMember.findOneAndUpdate(
      { roomId, userId: socket.userData.userId },
      { isOnline: false, lastSeen: new Date() }
    );

    socket.currentRoomId = null;
  } catch (error) {
    console.error("Error performing leave room:", error);
  }
}

async function updateRoomMember(roomId, userData) {
  try {
    const existingMember = await RoomMember.findOne({
      roomId,
      userId: userData.userId,
    });

    if (existingMember) {
      // Update existing member
      existingMember.isOnline = true;
      existingMember.lastSeen = new Date();
      await existingMember.save();
    } else if (userData.userType === "user") {
      // Create new member for authenticated users
      const newMember = new RoomMember({
        roomId,
        userId: userData.userId,
        userType: userData.userType,
        role: "member",
        permissions: ["read", "write"],
        isOnline: true,
      });
      await newMember.save();
    }
  } catch (error) {
    console.error("Error updating room member:", error);
  }
}

async function getRoomState(roomId) {
  try {
    const members = await RoomMember.find({ roomId })
      .populate("userId", "username email")
      .sort({ joinedAt: 1 });

    const activeCollaborators = roomService.getActiveCollaborators(roomId);
    const activeRoom = activeRooms.get(roomId);

    return {
      members: members.map((member) => ({
        userId: member.userId?._id || member.userId,
        username: member.userId?.username || member.username || "Anonymous",
        role: member.role,
        isOnline: member.isOnline,
        joinedAt: member.joinedAt,
      })),
      activeUsers: activeRoom ? Array.from(activeRoom.users.values()) : [],
      activeCollaborators: activeCollaborators.length,
      totalMembers: members.length,
    };
  } catch (error) {
    console.error("Error getting room state:", error);
    return {
      members: [],
      activeUsers: [],
      activeCollaborators: 0,
      totalMembers: 0,
    };
  }
}

function getUserColor(userId) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  const hash = userId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

// Debounced code saving to prevent too many DB writes
const debounceCodeSave = (() => {
  const timeouts = new Map();

  return (roomId, code, language) => {
    if (timeouts.has(roomId)) {
      clearTimeout(timeouts.get(roomId));
    }

    const timeout = setTimeout(async () => {
      try {
        const updateData = { code, lastActivity: new Date() };
        if (language) updateData.language = language;

        await Room.findOneAndUpdate(
          { $or: [{ roomId }, { joinCode: roomId }] },
          updateData
        );
        console.log(`💾 Code auto-saved for room: ${roomId}`);
      } catch (error) {
        console.error("Error auto-saving code:", error);
      } finally {
        timeouts.delete(roomId);
      }
    }, 2000); // 2 second debounce

    timeouts.set(roomId, timeout);
  };
})();

module.exports = setupSocketHandlers;

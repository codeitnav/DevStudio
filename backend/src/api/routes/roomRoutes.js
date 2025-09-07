const express = require("express");
const jwt = require("jsonwebtoken");
const Room = require("../../models/Room");
const RoomMember = require("../../models/RoomMember");
const User = require("../../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roomService = require("../../services/roomService");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Generate unique room ID
function generateRoomId() {
  return (
    Math.random().toString(36).substring(2, 8).toUpperCase() +
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
}

// Generate room join code
function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// @route   POST /api/room/create
// @desc    Create a new room with CRDT support
// @access  Public
router.post("/create", async (req, res) => {
  try {
    const {
      roomName,
      description = "",
      language = "javascript",
      isPrivate = false,
      maxMembers = 10,
      password = "",
    } = req.body;

    // Validate required fields
    if (!roomName || roomName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Room name is required",
      });
    }

    // Check if user is authenticated
    let ownerId = null;
    let ownerType = "guest";
    let ownerUsername = "Anonymous";

    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ownerId = decoded.userId;
        ownerType = "user";
        ownerUsername = decoded.username || decoded.email || "User";

        console.log(
          `✅ Authenticated user creating room: ${ownerUsername} (ID: ${ownerId})`
        );
      } catch (jwtError) {
        console.log(`⚠️ Invalid/expired token during room creation:`, {
          error: jwtError.name,
          message: jwtError.message,
          expiredAt: jwtError.expiredAt || "N/A",
        });

        // Continue as guest - graceful degradation
        ownerId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        ownerType = "guest";
        ownerUsername = "Guest User";
      }
    } else {
      // No token provided - guest user
      console.log("👤 No token provided, creating room as guest");
      ownerId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      ownerUsername = "Guest User";
    }

    // Generate unique IDs
    const roomId = generateRoomId();
    const joinCode = generateJoinCode();

    // Create new room
    const newRoom = new Room({
      roomId,
      roomName: roomName.trim(),
      description: description.trim(),
      joinCode,
      ownerId,
      ownerType,
      language,
      isPrivate,
      password: password ? await bcrypt.hash(password, 10) : "",
      maxMembers,
      code: `// Welcome to ${roomName}!\n// Created by: ${ownerUsername}\n// Language: ${language}\n// Start collaborative coding...\n\n`,
      settings: {
        allowGuests: true,
        allowCodeDownload: true,
        autoSave: true,
        theme: "dark",
      },
      collaborationEnabled: true,
    });

    await newRoom.save();

    // Initialize Yjs document for CRDT collaboration
    roomService.initializeYjsDocument(roomId);
    console.log(`🔧 Yjs document initialized for room: ${roomId}`);

    // If authenticated user, add them as owner/member
    if (ownerId) {
      const roomMember = new RoomMember({
        roomId,
        userId: ownerId,
        userType: ownerType,
        role: "owner",
        permissions: ["read", "write", "admin"],
      });
      await roomMember.save();
    }

    res.status(201).json({
      success: true,
      message: "Room created successfully with CRDT support",
      room: {
        roomId,
        roomName: newRoom.roomName,
        joinCode,
        language,
        isPrivate,
        maxMembers,
        createdAt: newRoom.createdAt,
        ownerType,
        collaborationEnabled: true,
        websocketUrl: `ws://${req.headers.host}/yjs?room=${roomId}`,
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create room. Please try again.",
    });
  }
});

// @route   GET /api/room/:roomId
// @desc    Get room details and join room
// @access  Public
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password = "" } = req.query;

    // Find room
    const room = await Room.findOne({
      $or: [{ roomId }, { joinCode: roomId }],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if room is private and needs password
    if (room.isPrivate && room.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          error: "Password required",
          requiresPassword: true,
        });
      }

      const isValidPassword = await bcrypt.compare(password, room.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid password",
        });
      }
    }

    // Check room capacity
    const currentMembers = await RoomMember.countDocuments({
      roomId: room.roomId,
    });
    if (currentMembers >= room.maxMembers) {
      return res.status(403).json({
        success: false,
        error: "Room is full",
      });
    }

    // Get room members
    const members = await RoomMember.find({ roomId: room.roomId })
      .populate("userId", "username email")
      .select("-__v");

    // Get collaboration info
    const collaborationInfo = roomService.getActiveCollaborators(room.roomId);

    res.json({
      success: true,
      room: {
        roomId: room.roomId,
        roomName: room.roomName,
        description: room.description,
        language: room.language,
        code: room.code,
        isPrivate: room.isPrivate,
        maxMembers: room.maxMembers,
        currentMembers: currentMembers,
        settings: room.settings,
        createdAt: room.createdAt,
        collaborationEnabled: room.collaborationEnabled || true,
        websocketUrl: `ws://${req.headers.host}/yjs?room=${room.roomId}`,
        activeCollaborators: collaborationInfo.length,
        members: members.map((member) => ({
          userId: member.userId?._id || member.userId,
          username: member.userId?.username || `Guest_${member.userId}`,
          role: member.role,
          joinedAt: member.joinedAt,
          isOnline: member.isOnline,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch room details",
    });
  }
});

// @route   POST /api/room/:roomId/join
// @desc    Join a room
// @access  Public
router.post("/:roomId/join", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username = "", password = "" } = req.body;

    // Find room
    const room = await Room.findOne({
      $or: [{ roomId }, { joinCode: roomId }],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Verify password if required
    if (room.isPrivate && room.password) {
      if (!password || !(await bcrypt.compare(password, room.password))) {
        return res.status(401).json({
          success: false,
          error: "Invalid password",
        });
      }
    }

    // Check capacity
    const currentMembers = await RoomMember.countDocuments({
      roomId: room.roomId,
    });
    if (currentMembers >= room.maxMembers) {
      return res.status(403).json({
        success: false,
        error: "Room is full",
      });
    }

    // Check if user is authenticated
    let userId = null;
    let userType = "guest";
    let role = "member";

    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        userType = "user";

        // Check if already a member
        const existingMember = await RoomMember.findOne({
          roomId: room.roomId,
          userId: userId,
          userType: "user",
        });

        if (existingMember) {
          // Update online status
          existingMember.isOnline = true;
          existingMember.lastSeen = new Date();
          await existingMember.save();

          return res.json({
            success: true,
            message: "Welcome back to the room",
            member: {
              userId: existingMember.userId,
              role: existingMember.role,
              joinedAt: existingMember.joinedAt,
              permissions: existingMember.permissions,
            },
            collaboration: {
              websocketUrl: `ws://${req.headers.host}/yjs?room=${room.roomId}`,
              roomId: room.roomId,
            },
          });
        }
      } catch (err) {
        // Continue as guest
        userId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
      }
    } else {
      // Generate guest ID
      userId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
    }

    // Create room member
    const roomMember = new RoomMember({
      roomId: room.roomId,
      userId: userId,
      userType: userType,
      username: userType === "guest" ? username || "Anonymous" : undefined,
      role: role,
      permissions: ["read", "write"],
      isOnline: true,
    });

    await roomMember.save();

    // Update room activity
    room.lastActivity = new Date();
    await room.save();

    res.json({
      success: true,
      message: "Successfully joined room",
      member: {
        userId: roomMember.userId,
        username: roomMember.username,
        role: roomMember.role,
        joinedAt: roomMember.joinedAt,
        permissions: roomMember.permissions,
      },
      collaboration: {
        websocketUrl: `ws://${req.headers.host}/yjs?room=${room.roomId}`,
        roomId: room.roomId,
        collaborationEnabled: room.collaborationEnabled || true,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join room",
    });
  }
});

// @route   POST /api/room/:roomId/save
// @desc    Save room code with CRDT persistence
// @access  Public
router.post("/:roomId/save", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code, language } = req.body;

    // Find room
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Update room code and language
    room.code = code;
    if (language) room.language = language;
    room.lastActivity = new Date();

    await room.save();

    // Also persist to Yjs document
    try {
      await roomService.persistDocumentState(roomId, code, language);
      console.log(`💾 Document state persisted for room: ${roomId}`);
    } catch (yjsError) {
      console.warn(
        `⚠️ Failed to persist Yjs state for room ${roomId}:`,
        yjsError
      );
    }

    res.json({
      success: true,
      message: "Code saved successfully",
    });
  } catch (error) {
    console.error("Error saving room code:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save code",
    });
  }
});

// @route   GET /api/room/:roomId/members
// @desc    Get room members
// @access  Public
router.get("/:roomId/members", async (req, res) => {
  try {
    const { roomId } = req.params;

    const members = await RoomMember.find({ roomId })
      .populate("userId", "username email avatar")
      .sort({ joinedAt: 1 });

    const formattedMembers = members.map((member) => ({
      id: member._id,
      userId: member.userId?._id || member.userId,
      username: member.userId?.username || member.username || "Anonymous",
      email: member.userId?.email,
      avatar: member.userId?.avatar,
      userType: member.userType,
      role: member.role,
      permissions: member.permissions,
      isOnline: member.isOnline,
      joinedAt: member.joinedAt,
      lastSeen: member.lastSeen,
    }));

    // Get active collaborators from Yjs
    const activeCollaborators = roomService.getActiveCollaborators(roomId);

    res.json({
      success: true,
      members: formattedMembers,
      totalMembers: formattedMembers.length,
      activeCollaborators: activeCollaborators.length,
      collaboration: {
        websocketUrl: `ws://${req.headers.host}/yjs?room=${roomId}`,
      },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch members",
    });
  }
});

// @route   GET /api/room/:roomId/collaboration
// @desc    Get collaboration info and WebSocket connection details
// @access  Public
router.get("/:roomId/collaboration", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find room by roomId or joinCode
    const room = await Room.findOne({
      $or: [{ roomId }, { joinCode: roomId }],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check room capacity
    const currentMembers = await RoomMember.countDocuments({
      roomId: room.roomId,
    });

    if (currentMembers >= room.maxMembers) {
      return res.status(403).json({
        success: false,
        error: "Room is full",
      });
    }

    // Get active collaborators
    const activeCollaborators = roomService.getActiveCollaborators(room.roomId);

    res.json({
      success: true,
      collaboration: {
        roomId: room.roomId,
        websocketUrl: `ws://${req.headers.host}/yjs?room=${room.roomId}`,
        collaborationEnabled: room.collaborationEnabled !== false,
        activeCollaborators: activeCollaborators,
        maxMembers: room.maxMembers,
        currentMembers: currentMembers,
        language: room.language,
        lastActivity: room.lastActivity,
      },
    });
  } catch (error) {
    console.error("Error getting collaboration info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get collaboration info",
    });
  }
});

// @route   GET /api/room/:roomId/document-state
// @desc    Get current document state for CRDT initialization
// @access  Public
router.get("/:roomId/document-state", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find room
    const room = await Room.findOne({
      $or: [{ roomId }, { joinCode: roomId }],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get document state from roomService
    let documentState = null;
    try {
      documentState = await roomService.getDocumentState(room.roomId);
    } catch (error) {
      console.warn(
        `⚠️ Failed to get Yjs document state for room ${room.roomId}`
      );
    }

    res.json({
      success: true,
      documentState: documentState,
      code: room.code, // Fallback to stored code
      language: room.language,
      lastActivity: room.lastActivity,
    });
  } catch (error) {
    console.error("Error getting document state:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get document state",
    });
  }
});

// @route   PUT /api/room/:roomId/settings
// @desc    Update room settings (owner only)
// @access  Private
router.put("/:roomId/settings", authMiddleware.protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { settings } = req.body;

    // Find room and verify ownership
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if user is owner
    if (room.ownerId?.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Only room owner can update settings",
      });
    }

    // Update settings
    room.settings = { ...room.settings, ...settings };
    await room.save();

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: room.settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update settings",
    });
  }
});

// @route   DELETE /api/room/:roomId/leave
// @desc    Leave room
// @access  Public
router.delete("/:roomId/leave", async (req, res) => {
  try {
    const { roomId } = req.params;
    let userId = req.body.userId;

    // Try to get userId from token if not provided
    if (!userId) {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (err) {
          return res.status(400).json({
            success: false,
            error: "User ID required",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: "User ID required",
        });
      }
    }

    // Remove member from room
    const result = await RoomMember.deleteOne({ roomId, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Member not found in room",
      });
    }

    // Remove from active collaborators
    roomService.removeActiveCollaborator(roomId, userId);

    res.json({
      success: true,
      message: "Successfully left room",
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to leave room",
    });
  }
});

// @route   DELETE /api/room/:roomId
// @desc    Delete room (owner only)
// @access  Private
router.delete("/:roomId", authMiddleware.protect, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find room
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check ownership
    if (room.ownerId?.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Only room owner can delete room",
      });
    }

    // Delete room and all members
    await Room.deleteOne({ roomId });
    await RoomMember.deleteMany({ roomId });

    // Clean up Yjs document
    roomService.cleanupYjsDocument(roomId);

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete room",
    });
  }
});

module.exports = router;

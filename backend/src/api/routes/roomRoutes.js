const express = require("express");
const jwt = require("jsonwebtoken");
const Room = require("../../models/Room");
const RoomMember = require("../../models/RoomMember");
const User = require("../../models/User");
const authMiddleware = require("../../middleware/authMiddleware");
const router = express.Router();
const bcrypt = require("bcrypt");

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
// @desc    Create a new room
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

        // Determine error type and continue as guest
        if (jwtError.name === "TokenExpiredError") {
          console.log("🔄 Token expired, continuing as guest user");
        } else if (jwtError.name === "JsonWebTokenError") {
          console.log("❌ Invalid token format, continuing as guest user");
        } else {
          console.log("🔍 JWT verification failed, continuing as guest user");
        }

        // Continue as guest - no return statement, graceful degradation
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
    });

    await newRoom.save();

    // If authenticated user, add them as owner/member
    if (ownerId) {
      const roomMember = new RoomMember({
        roomId,
        userId: ownerId,
        userType: "user",
        role: "owner",
        permissions: ["read", "write", "admin"],
      });
      await roomMember.save();
    }

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        roomId,
        roomName: newRoom.roomName,
        joinCode,
        language,
        isPrivate,
        maxMembers,
        createdAt: newRoom.createdAt,
        ownerType,
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
// @desc    Save room code
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

    res.json({
      success: true,
      members: formattedMembers,
      totalMembers: formattedMembers.length,
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch members",
    });
  }
});

// @route   PUT /api/room/:roomId/settings
// @desc    Update room settings (owner only)
// @access  Private
router.put("/:roomId/settings", authMiddleware, async (req, res) => {
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
router.delete("/:roomId", authMiddleware, async (req, res) => {
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

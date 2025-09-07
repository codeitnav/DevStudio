const express = require("express");
const Room = require("../../models/Room");
const User = require("../../models/User");
const RoomMember = require("../../models/RoomMember");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to ensure the user is admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, error: "Admin access required" });
  }
  next();
}

// Protect all admin routes
router.use(requireAuth.protect);
router.use(requireAdmin);

//--- Real-Time System Overview ---
router.get("/overview", async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeRooms = await Room.countDocuments({
      lastActivity: { $gte: new Date(Date.now() - 60000) },
    });
    const activeUsers = await RoomMember.countDocuments({ isOnline: true });

    res.json({
      success: true,
      overview: {
        totalRooms,
        totalUsers,
        activeRoomsLastMinute: activeRooms,
        activeUsersNow: activeUsers,
        serverTime: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//--- Room & Project Management ---
// List rooms (limit 100 for performance)
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find()
      .sort({ lastActivity: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get room details including members
router.get("/rooms/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({
      $or: [{ roomId: req.params.roomId }, { _id: req.params.roomId }],
    }).lean();

    if (!room)
      return res.status(404).json({ success: false, error: "Room not found" });

    const members = await RoomMember.find({ roomId: room._id })
      .populate("userId", "username email")
      .lean();

    res.json({
      success: true,
      room: {
        ...room,
        members,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a room and all its members
router.delete("/rooms/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room)
      return res.status(404).json({ success: false, error: "Room not found" });

    await Room.deleteOne({ _id: room._id });
    await RoomMember.deleteMany({ roomId: room._id });

    // TODO: notify or clean any cache or related data here

    res.json({
      success: true,
      message: "Room and members deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//--- User Management ---
// List users (limit 100)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user details including rooms they belong to
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const memberships = await RoomMember.find({ userId: user._id })
      .populate("roomId", "roomName roomId")
      .lean();

    res.json({
      success: true,
      user,
      memberships,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ban a user (simple flag)
router.post("/users/:userId/ban", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    user.isBanned = true;
    await user.save();

    res.json({ success: true, message: "User banned successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unban a user
router.post("/users/:userId/unban", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    user.isBanned = false;
    await user.save();

    res.json({ success: true, message: "User unbanned successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

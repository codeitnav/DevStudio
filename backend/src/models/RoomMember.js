const mongoose = require("mongoose");

const roomMemberSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, "Room ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.Mixed, // Supports ObjectId for users and string for guests
      required: [true, "User ID is required"],
      index: true,
    },
    userType: {
      type: String,
      enum: ["user", "guest"],
      default: "user",
    },
    username: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["owner", "member", "viewer"],
      default: "member",
      required: [true, "Role is required"],
    },
    permissions: {
      type: [String],
      default: ["read"],
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });
roomMemberSchema.index({ role: 1 });

module.exports = mongoose.model("RoomMember", roomMemberSchema);

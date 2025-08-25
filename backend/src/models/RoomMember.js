const mongoose = require("mongoose");

const roomMemberSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "viewer",
      required: [true, "Role is required"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Permissions for fine-grained access control
    permissions: {
      canEdit: {
        type: Boolean,
        default: function () {
          return this.role === "owner" || this.role === "editor";
        },
      },
      canInvite: {
        type: Boolean,
        default: function () {
          return this.role === "owner" || this.role === "editor";
        },
      },
      canDelete: {
        type: Boolean,
        default: function () {
          return this.role === "owner";
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
roomMemberSchema.index({ room_id: 1, user_id: 1 }, { unique: true }); // Prevent duplicate memberships
roomMemberSchema.index({ room_id: 1 });
roomMemberSchema.index({ user_id: 1 });
roomMemberSchema.index({ role: 1 });

// Pre-save middleware to set permissions based on role
roomMemberSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    switch (this.role) {
      case "owner":
        this.permissions.canEdit = true;
        this.permissions.canInvite = true;
        this.permissions.canDelete = true;
        break;
      case "editor":
        this.permissions.canEdit = true;
        this.permissions.canInvite = true;
        this.permissions.canDelete = false;
        break;
      case "viewer":
        this.permissions.canEdit = false;
        this.permissions.canInvite = false;
        this.permissions.canDelete = false;
        break;
    }
  }
  next();
});

// Static method to find room members with user details
roomMemberSchema.statics.findRoomMembersWithUsers = function (roomId) {
  return this.find({ room_id: roomId, isActive: true })
    .populate("user_id", "username email")
    .sort({ joinedAt: 1 });
};

// Static method to check if user is member of room
roomMemberSchema.statics.isMember = function (roomId, userId) {
  return this.findOne({
    room_id: roomId,
    user_id: userId,
    isActive: true,
  });
};

// Static method to check if user can invite others to room
roomMemberSchema.statics.canUserInvite = async function (roomId, userId) {
  const member = await this.findOne({
    room_id: roomId,
    user_id: userId,
    isActive: true,
  });

  return member && member.permissions.canInvite;
};

module.exports = mongoose.model("RoomMember", roomMemberSchema);

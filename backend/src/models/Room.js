const mongoose = require("mongoose");

// Schema for individual files within a room
const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "javascript",
    enum: [
      // Core programming languages
      "c",
      "cpp",
      "java",
      "python",
      "javascript",
      "typescript",

      // Web development focused
      "html",
      "css",
      "php",
      "ruby",

      // Modern & trending
      "go",
      "rust",
      "kotlin",
      "swift",

      // Data science / scripting
      "r",
      "julia",
      "shell",
      "bash",

      // Additional useful formats
      "json",
      "markdown",
      "yaml",
      "xml",
      "sql",
      "plain",
    ],
  },
  path: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
  },
  files: [fileSchema],
  subfolders: [this],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [1, "Room name cannot be empty"],
      maxlength: [100, "Room name cannot exceed 100 characters"],
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Room must have an owner"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      trim: true,
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: [1, "Room must allow at least 1 member"],
      max: [50, "Room cannot have more than 50 members"],
    },
    files: [fileSchema],
    folders: [folderSchema],

    // Yjs document state for real-time collaboration
    yjsState: {
      type: Buffer,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ owner_id: 1 });
roomSchema.index({ name: 1, owner_id: 1 });
roomSchema.index({ isPublic: 1 });
roomSchema.index({ createdAt: -1 });

// Virtual to get member count
roomSchema.virtual("memberCount", {
  ref: "RoomMember",
  localField: "_id",
  foreignField: "room_id",
  count: true,
});

roomSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Room", roomSchema);

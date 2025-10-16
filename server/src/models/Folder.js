const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique folder names under the same parent for a given room
folderSchema.index(
  { name: 1, room: 1, parent: 1 },
  { unique: true }
);

module.exports = mongoose.model('Folder', folderSchema);
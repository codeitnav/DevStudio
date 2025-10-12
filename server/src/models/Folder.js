const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Compound index to ensure unique folder names under the same parent for a given owner
folderSchema.index(
  { name: 1, owner: 1, parent: 1 },
  { unique: true }
);

module.exports = mongoose.model('Folder', folderSchema);

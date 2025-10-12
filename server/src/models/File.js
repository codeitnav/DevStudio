const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    storageName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate file names in the same folder by the same owner
fileSchema.index(
  { name: 1, owner: 1, folder: 1 },
  { unique: true }
);

module.exports = mongoose.model('File', fileSchema);

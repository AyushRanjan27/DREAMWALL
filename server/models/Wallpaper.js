const mongoose = require('mongoose');

const wallpaperSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  modelUsed: {
    type: String,
    default: 'flux',
  },
  aspectRatio: {
    type: String,
    default: '16:9',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  userName: {
    type: String,
    default: 'Anonymous',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Wallpaper', wallpaperSchema);
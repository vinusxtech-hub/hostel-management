const mongoose = require('mongoose');

const deviceInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  deviceModel: {
    type: String,
    trim: true,
    default: 'Unknown'
  },
  deviceType: {
    type: String,
    trim: true,
    default: 'Unknown'
  },
  osName: {
    type: String,
    trim: true,
    default: 'Unknown'
  },
  osVersion: {
    type: String,
    trim: true,
    default: 'Unknown'
  }
}, {
  timestamps: true
});

// Index for faster lookups by userId
deviceInfoSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DeviceInfo', deviceInfoSchema);

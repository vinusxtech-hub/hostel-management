const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: [true, 'Notice content is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['General', 'Maintenance', 'Event', 'Emergency', 'Academic'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries — pinned first, then newest
noticeSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);

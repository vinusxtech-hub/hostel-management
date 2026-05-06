const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String, // HH:MM format
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  distance: {
    type: Number, // Distance from hostel in km
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent'],
    required: true
  },
  location: {
    type: String,
    enum: ['Inside', 'Outside'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance per day per user
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

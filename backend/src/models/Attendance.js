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
    default: '00:00'  // Optional for system-generated "On Leave" records
  },
  latitude: {
    type: Number,
    default: 0  // Optional for system-generated "On Leave" records
  },
  longitude: {
    type: Number,
    default: 0  // Optional for system-generated "On Leave" records
  },
  distance: {
    type: Number, // Distance from hostel in km
    default: 0  // Optional for system-generated "On Leave" records
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'On Leave'],  // Integration: Leave Management System
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

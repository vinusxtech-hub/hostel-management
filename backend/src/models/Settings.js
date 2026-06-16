const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  checkInTime: {
    type: String,
    default: '20:00'
  },
  cutoffTime: {
    type: String,
    default: '22:00'
  },
  geofenceRadius: {
    type: Number,
    default: 200
  },
  campusLatitude: {
    type: Number,
    default: 23.2815
  },
  campusLongitude: {
    type: Number,
    default: 77.4562
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);

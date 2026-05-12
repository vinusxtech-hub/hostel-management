const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Maintenance', 'Electrical', 'Plumbing', 'Cleanliness', 'Internet/Wi-Fi', 'Mess Food', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  adminResponse: {
    type: String,
    default: ''
  },
  wardenResponse: {
    type: String,
    default: ''
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);

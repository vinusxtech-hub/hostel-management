const Settings = require('../models/Settings');

// @desc    Get attendance settings/config
// @route   GET /api/student/settings
// @access  Private
exports.getAttendanceSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Fallback & create initial settings from env or defaults
      settings = await Settings.create({
        checkInTime: process.env.CHECKIN_TIME || '20:00',
        cutoffTime: process.env.CUTOFF_TIME || '22:00',
        geofenceRadius: parseInt(process.env.GEOFENCE_RADIUS_METERS) || 200,
        campusLatitude: parseFloat(process.env.HOSTEL_LAT) || 23.2815,
        campusLongitude: parseFloat(process.env.HOSTEL_LNG) || 77.4562
      });
    }

    const { checkInTime, cutoffTime, geofenceRadius, campusLatitude, campusLongitude } = settings;

    // Determine if attendance window is currently open
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [checkInH, checkInM] = checkInTime.split(':').map(Number);
    const [cutoffH, cutoffM] = cutoffTime.split(':').map(Number);
    const checkInMinutes = checkInH * 60 + checkInM;
    const cutoffMinutes = cutoffH * 60 + cutoffM;

    let isOpen;
    if (cutoffMinutes > checkInMinutes) {
      // Same-day window (e.g. 20:00 - 22:00)
      isOpen = currentMinutes >= checkInMinutes && currentMinutes <= cutoffMinutes;
    } else {
      // Overnight window (e.g. 22:00 - 06:00)
      isOpen = currentMinutes >= checkInMinutes || currentMinutes <= cutoffMinutes;
    }

    // Departments list (configurable via env, comma-separated)
    const defaultDepartments = 'Computer Science,AIDS,ECE/EX,Civil/Mechanical,Pharmacy';
    const departments = (process.env.DEPARTMENTS || defaultDepartments)
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    // Resolution categories (configurable via env, comma-separated)
    const defaultCategories = 'Maintenance,Electrical,Plumbing,Cleanliness,Internet/Wi-Fi,Mess Food,Other';
    const resolutionCategories = (process.env.RESOLUTION_CATEGORIES || defaultCategories)
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    res.json({
      checkInTime,
      cutoffTime,
      geofenceRadius,
      campusLatitude,
      campusLongitude,
      status: isOpen ? 'Open' : 'Closed',
      locationRequired: 'Inside SISTec campus area',
      departments,
      resolutionCategories
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance settings' });
  }
};

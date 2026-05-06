// @desc    Get attendance settings/config
// @route   GET /api/student/settings
// @access  Private
exports.getAttendanceSettings = async (req, res) => {
  try {
    const checkInTime = process.env.CHECKIN_TIME || '20:00';
    const cutoffTime = process.env.CUTOFF_TIME || '22:00';
    const geofenceRadius = parseInt(process.env.GEOFENCE_RADIUS_METERS) || 200;

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

    res.json({
      checkInTime,
      cutoffTime,
      geofenceRadius,
      status: isOpen ? 'Open' : 'Closed',
      locationRequired: 'Inside Hostel'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance settings' });
  }
};

const Attendance = require('../models/Attendance');
const Resolution = require('../models/Resolution');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { getLocalDateString, getLocalTimeStr } = require('../utils/dateHelper');

// Haversine formula to calculate distance in km
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Get attendance history for logged-in student
// @route   GET /api/student/attendance
exports.getAttendanceHistory = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
};

// @desc    Mark attendance with geolocation validation
// @route   POST /api/student/attendance
exports.markAttendance = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        checkInTime: process.env.CHECKIN_TIME || '20:00',
        cutoffTime: process.env.CUTOFF_TIME || '22:00',
        geofenceRadius: parseInt(process.env.GEOFENCE_RADIUS_METERS) || 200,
        campusLatitude: parseFloat(process.env.HOSTEL_LAT) || 23.2815,
        campusLongitude: parseFloat(process.env.HOSTEL_LNG) || 77.4562
      });
    }

    const hostelLat = settings.campusLatitude;
    const hostelLng = settings.campusLongitude;
    const radiusMeters = settings.geofenceRadius;

    // Calculate distance
    const distance = getDistanceFromLatLonInKm(latitude, longitude, hostelLat, hostelLng);
    const distanceMeters = distance * 1000;
    const isInside = distanceMeters <= radiusMeters;

    if (!isInside) {
      return res.status(400).json({
        error: `You are ${(distance).toFixed(2)} km away from the SISTec campus area. You must be within ${radiusMeters}m to mark attendance.`,
        distance: distance.toFixed(4),
        location: 'Outside'
      });
    }

    // Check for duplicate entry today
    const today = getLocalDateString();
    const existingRecord = await Attendance.findOne({
      userId: req.user._id,
      date: today
    });

    const now = new Date();
    const timeStr = getLocalTimeStr(now);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;
    
    // Parse cutoff time (e.g. "22:00")
    const [cutoffH, cutoffM] = settings.cutoffTime.split(':').map(Number);
    const cutoffMinutes = cutoffH * 60 + cutoffM;
    
    let status = currentMinutes >= cutoffMinutes ? 'Late' : 'Present';

    if (existingRecord) {
      if (existingRecord.status === 'Absent') {
        const updatedStatus = currentMinutes >= cutoffMinutes ? 'Late' : 'Present';
        existingRecord.status = updatedStatus;
        existingRecord.time = timeStr;
        existingRecord.timestamp = now;
        existingRecord.latitude = latitude;
        existingRecord.longitude = longitude;
        existingRecord.distance = parseFloat(distance.toFixed(4));
        existingRecord.location = 'Inside';
        await existingRecord.save();
        return res.status(200).json(existingRecord);
      }
      return res.status(400).json({
        error: 'Attendance already marked for today',
        existingRecord
      });
    }

    const newRecord = await Attendance.create({
      userId: req.user._id,
      date: today,
      timestamp: now,
      time: timeStr,
      latitude,
      longitude,
      distance: parseFloat(distance.toFixed(4)),
      status,
      location: 'Inside'
    });

    res.status(201).json(newRecord);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Attendance already marked for today' });
    }
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// @desc    Get student's reports/statistics
// @route   GET /api/student/reports
exports.getReports = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.user._id })
      .sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const absent = records.filter(r => r.status === 'Absent').length;

    // Weekly data (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayRecord = records.find(r => r.date === dateStr);
      weeklyData.push({
        name: days[d.getDay()],
        present: dayRecord?.status === 'Present' ? 1 : 0,
        late: dayRecord?.status === 'Late' ? 1 : 0,
        absent: (!dayRecord || dayRecord?.status === 'Absent') ? 1 : 0
      });
    }

    // Monthly trend (last 5 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthRecords = records.filter(r => {
        const [rYear, rMonth, rDay] = r.date.split('-').map(Number);
        return (rMonth - 1) === month && rYear === year;
      });
      const monthTotal = monthRecords.length || 1;
      const monthPresent = monthRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
      monthlyData.push({
        month: months[month],
        attendance: Math.round((monthPresent / monthTotal) * 100)
      });
    }

    // Pie data
    const pieData = [
      { name: 'Present', value: present },
      { name: 'Late', value: late },
      { name: 'Absent', value: absent }
    ];

    res.json({
      total,
      present,
      late,
      absent,
      percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      weeklyData,
      monthlyData,
      pieData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// @desc    Get resolutions for logged-in student
// @route   GET /api/student/resolutions
exports.getResolutions = async (req, res) => {
  try {
    const resolutions = await Resolution.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    // Format to match frontend expectations
    const formatted = resolutions.map(c => ({
      id: c._id,
      category: c.category,
      description: c.description,
      status: c.status,
      adminResponse: c.adminResponse,
      date: c.createdAt.toISOString().split('T')[0]
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resolutions' });
  }
};

// Keep backward compatibility alias
exports.getResolutions = exports.getResolutions;

// @desc    Submit new resolution
// @route   POST /api/student/resolutions
exports.submitResolution = async (req, res) => {
  try {
    const { category, description } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    const resolution = await Resolution.create({
      userId: req.user._id,
      category,
      description
    });

    res.status(201).json({
      id: resolution._id,
      category: resolution.category,
      description: resolution.description,
      status: resolution.status,
      date: resolution.createdAt.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit resolution' });
  }
};

// Keep backward compatibility alias
exports.submitResolution = exports.submitResolution;

// @desc    Get student profile
// @route   GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hostelSection: user.hostelSection,
      room: user.room,
      phone: user.phone,
      parentPhone: user.parentPhone,
      address: user.address,
      department: user.department
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'parentPhone', 'address', 'room', 'department'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hostelSection: user.hostelSection,
      room: user.room,
      phone: user.phone,
      parentPhone: user.parentPhone,
      address: user.address,
      department: user.department
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

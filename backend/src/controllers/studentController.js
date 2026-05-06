const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

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

    const hostelLat = parseFloat(process.env.HOSTEL_LAT) || 28.6139;
    const hostelLng = parseFloat(process.env.HOSTEL_LNG) || 77.2090;
    const radiusMeters = parseInt(process.env.GEOFENCE_RADIUS_METERS) || 200;

    // Calculate distance
    const distance = getDistanceFromLatLonInKm(latitude, longitude, hostelLat, hostelLng);
    const distanceMeters = distance * 1000;
    const isInside = distanceMeters <= radiusMeters;

    if (!isInside) {
      return res.status(400).json({
        error: `You are ${(distance).toFixed(2)} km away from the hostel. You must be within ${radiusMeters}m to mark attendance.`,
        distance: distance.toFixed(4),
        location: 'Outside'
      });
    }

    // Check for duplicate entry today
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await Attendance.findOne({
      userId: req.user._id,
      date: today
    });

    if (existingRecord) {
      return res.status(400).json({
        error: 'Attendance already marked for today',
        existingRecord
      });
    }

    // Determine status based on time
    const now = new Date();
    const hours = now.getHours();
    const timeStr = `${hours.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const status = hours >= 22 ? 'Late' : 'Present';

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
      const dateStr = d.toISOString().split('T')[0];
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
        const rd = new Date(r.date);
        return rd.getMonth() === month && rd.getFullYear() === year;
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

// @desc    Get complaints for logged-in student
// @route   GET /api/student/complaints
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    // Format to match frontend expectations
    const formatted = complaints.map(c => ({
      id: c._id,
      category: c.category,
      description: c.description,
      status: c.status,
      adminResponse: c.adminResponse,
      date: c.createdAt.toISOString().split('T')[0]
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// @desc    Submit new complaint
// @route   POST /api/student/complaints
exports.submitComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    const complaint = await Complaint.create({
      userId: req.user._id,
      category,
      description
    });

    res.status(201).json({
      id: complaint._id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      date: complaint.createdAt.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

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

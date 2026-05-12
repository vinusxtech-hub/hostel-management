const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');

// @desc    Get warden dashboard stats
// @route   GET /api/warden/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = await User.countDocuments({ role: 'student' });
    const todayRecords = await Attendance.find({ date: today });

    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const lateToday = todayRecords.filter(r => r.status === 'Late').length;
    const absentToday = totalStudents - presentToday - lateToday;

    // Complaint stats
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const rejectedComplaints = await Complaint.countDocuments({ status: 'Rejected' });
    const totalComplaints = pendingComplaints + inProgressComplaints + resolvedComplaints + rejectedComplaints;

    // Today's resolved
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resolvedToday = await Complaint.countDocuments({
      status: 'Resolved',
      updatedAt: { $gte: startOfDay }
    });

    // Recent complaints (last 5)
    const recentComplaints = await Complaint.find()
      .populate('userId', 'name room email')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedRecent = recentComplaints.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      category: c.category,
      description: c.description.substring(0, 80) + (c.description.length > 80 ? '...' : ''),
      status: c.status,
      date: c.createdAt.toISOString().split('T')[0]
    }));

    // Weekly complaint trend
    const weeklyComplaints = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const newComplaints = await Complaint.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      const resolvedDay = await Complaint.countDocuments({
        status: 'Resolved',
        updatedAt: { $gte: dayStart, $lte: dayEnd }
      });

      weeklyComplaints.push({
        day: days[d.getDay()],
        new: newComplaints,
        resolved: resolvedDay
      });
    }

    res.json({
      totalStudents,
      presentToday,
      absentToday: Math.max(0, absentToday),
      lateToday,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
      resolvedToday,
      recentComplaints: formattedRecent,
      weeklyComplaints
    });
  } catch (error) {
    console.error('Warden dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// @desc    Get all students
// @route   GET /api/warden/students
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ name: 1 });
    const today = new Date().toISOString().split('T')[0];

    const result = await Promise.all(students.map(async (student) => {
      const todayRecord = await Attendance.findOne({ userId: student._id, date: today });
      const totalRecords = await Attendance.countDocuments({ userId: student._id });
      const presentRecords = await Attendance.countDocuments({
        userId: student._id,
        status: { $in: ['Present', 'Late'] }
      });
      const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

      // Get complaint count for this student
      const complaintCount = await Complaint.countDocuments({ userId: student._id });
      const pendingComplaintCount = await Complaint.countDocuments({ userId: student._id, status: 'Pending' });

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        room: student.room || 'N/A',
        department: student.department || 'N/A',
        phone: student.phone || 'N/A',
        parentPhone: student.parentPhone || 'N/A',
        address: student.address || 'N/A',
        attendanceRate: rate,
        status: todayRecord ? 'Inside' : 'Outside',
        totalComplaints: complaintCount,
        pendingComplaints: pendingComplaintCount
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('Warden students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// @desc    Get single student details
// @route   GET /api/warden/students/:id
exports.getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get attendance history (last 30 days)
    const attendanceHistory = await Attendance.find({ userId: student._id })
      .sort({ date: -1 })
      .limit(30);

    // Get all complaints
    const complaints = await Complaint.find({ userId: student._id })
      .sort({ createdAt: -1 });

    // Attendance stats
    const totalRecords = await Attendance.countDocuments({ userId: student._id });
    const presentRecords = await Attendance.countDocuments({
      userId: student._id,
      status: { $in: ['Present', 'Late'] }
    });
    const lateRecords = await Attendance.countDocuments({ userId: student._id, status: 'Late' });
    const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        room: student.room || 'N/A',
        department: student.department || 'N/A',
        phone: student.phone || 'N/A',
        parentPhone: student.parentPhone || 'N/A',
        address: student.address || 'N/A',
        createdAt: student.createdAt
      },
      attendance: {
        rate,
        totalDays: totalRecords,
        presentDays: presentRecords,
        lateDays: lateRecords,
        absentDays: totalRecords - presentRecords,
        history: attendanceHistory.map(a => ({
          date: a.date,
          time: a.time,
          status: a.status,
          location: a.location
        }))
      },
      complaints: complaints.map(c => ({
        id: c._id,
        category: c.category,
        description: c.description,
        status: c.status,
        wardenResponse: c.wardenResponse,
        adminResponse: c.adminResponse,
        date: c.createdAt.toISOString().split('T')[0]
      }))
    });
  } catch (error) {
    console.error('Student details error:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

// @desc    Get all complaints
// @route   GET /api/warden/complaints
exports.getComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('userId', 'name room email department phone')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    const formatted = complaints.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      studentEmail: c.userId?.email || '',
      studentDepartment: c.userId?.department || 'N/A',
      studentPhone: c.userId?.phone || 'N/A',
      category: c.category,
      description: c.description,
      status: c.status,
      wardenResponse: c.wardenResponse || '',
      adminResponse: c.adminResponse || '',
      resolvedByName: c.resolvedBy?.name || '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      date: c.createdAt.toISOString().split('T')[0]
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Warden complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// @desc    Update complaint status
// @route   PUT /api/warden/complaints/:id
exports.updateComplaint = async (req, res) => {
  try {
    const { status, wardenResponse } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (wardenResponse !== undefined) updateData.wardenResponse = wardenResponse;

    // Track who resolved/handled the complaint
    if (status === 'Resolved' || status === 'Rejected') {
      updateData.resolvedBy = req.user._id;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('userId', 'name room email department phone')
      .populate('resolvedBy', 'name');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({
      id: complaint._id,
      studentName: complaint.userId?.name || 'Unknown',
      studentRoom: complaint.userId?.room || 'N/A',
      studentEmail: complaint.userId?.email || '',
      studentDepartment: complaint.userId?.department || 'N/A',
      studentPhone: complaint.userId?.phone || 'N/A',
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      wardenResponse: complaint.wardenResponse || '',
      adminResponse: complaint.adminResponse || '',
      resolvedByName: complaint.resolvedBy?.name || '',
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      date: complaint.createdAt.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
};

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');
const LeaveRequest = require('../models/LeaveRequest');  // Integration: Leave Management System

const normalizeHostelSection = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['boys', 'boy', 'male', 'm'].includes(normalized)) return 'boys';
  if (['girls', 'girl', 'female', 'f'].includes(normalized)) return 'girls';
  return '';
};

const getHostelSectionFilter = (user) => {
  const hostelSection = normalizeHostelSection(user?.hostelSection);
  return hostelSection ? { hostelSection } : {};
};

// @desc    Get warden dashboard stats
// @route   GET /api/warden/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const studentFilter = { role: 'student', ...getHostelSectionFilter(req.user) };
    const studentIds = await User.find(studentFilter).distinct('_id');
    const totalStudents = studentIds.length;
    const todayRecords = await Attendance.find({ date: today, userId: { $in: studentIds } });

    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const lateToday = todayRecords.filter(r => r.status === 'Late').length;
    const absentToday = totalStudents - presentToday - lateToday;

    // Complaint stats
    const complaintFilter = studentIds.length ? { userId: { $in: studentIds } } : { userId: null };
    const pendingComplaints = await Complaint.countDocuments({ ...complaintFilter, status: 'Pending' });
    const inProgressComplaints = await Complaint.countDocuments({ ...complaintFilter, status: 'In Progress' });
    const resolvedComplaints = await Complaint.countDocuments({ ...complaintFilter, status: 'Resolved' });
    const rejectedComplaints = await Complaint.countDocuments({ ...complaintFilter, status: 'Rejected' });
    const totalComplaints = pendingComplaints + inProgressComplaints + resolvedComplaints + rejectedComplaints;

    // Today's resolved
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resolvedToday = await Complaint.countDocuments({
      ...complaintFilter,
      status: 'Resolved',
      updatedAt: { $gte: startOfDay }
    });

    // Recent complaints (last 5)
    const recentComplaints = await Complaint.find(complaintFilter)
      .populate('userId', 'name room email hostelSection')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedRecent = recentComplaints.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      hostelSection: c.userId?.hostelSection || '',
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
        ...complaintFilter,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      const resolvedDay = await Complaint.countDocuments({
        ...complaintFilter,
        status: 'Resolved',
        updatedAt: { $gte: dayStart, $lte: dayEnd }
      });

      weeklyComplaints.push({
        day: days[d.getDay()],
        new: newComplaints,
        resolved: resolvedDay
      });
    }

    // Integration: Leave Management System — leave stats
    const leaveFilter = studentIds.length ? { studentId: { $in: studentIds } } : { studentId: null };
    const pendingLeaves = await LeaveRequest.countDocuments({ ...leaveFilter, status: 'Pending' });
    const approvedLeaves = await LeaveRequest.countDocuments({ ...leaveFilter, status: 'Approved' });
    const rejectedLeaves = await LeaveRequest.countDocuments({ ...leaveFilter, status: 'Rejected' });
    const totalLeaves = pendingLeaves + approvedLeaves + rejectedLeaves;

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
      weeklyComplaints,
      hostelSection: req.user.hostelSection || '',
      // Leave stats
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves
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
    const students = await User.find({ role: 'student', ...getHostelSectionFilter(req.user) }).sort({ name: 1 });
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
        hostelSection: student.hostelSection || '',
        building: student.building || '',
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
    if (
      normalizeHostelSection(req.user.hostelSection) &&
      student.hostelSection !== normalizeHostelSection(req.user.hostelSection)
    ) {
      return res.status(403).json({ error: 'Access denied for this hostel section' });
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
    const absentRecords = await Attendance.countDocuments({ userId: student._id, status: 'Absent' });
    const onLeaveRecords = await Attendance.countDocuments({ userId: student._id, status: 'On Leave' });
    const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Leave requests
    let leaveRequests = [];
    try {
      leaveRequests = await LeaveRequest.find({ studentId: student._id })
        .sort({ createdAt: -1 })
        .limit(20);
    } catch (e) {
      // LeaveRequest model may not have data yet
    }

    // Today's status
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = await Attendance.findOne({ userId: student._id, date: today });

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        hostelSection: student.hostelSection || '',
        building: student.building || '',
        room: student.room || 'N/A',
        department: student.department || 'N/A',
        phone: student.phone || 'N/A',
        parentPhone: student.parentPhone || 'N/A',
        address: student.address || 'N/A',
        createdAt: student.createdAt,
        todayStatus: todayRecord ? todayRecord.status : 'Absent'
      },
      attendance: {
        rate,
        totalDays: totalRecords,
        presentDays: presentRecords,
        lateDays: lateRecords,
        absentDays: absentRecords,
        onLeaveDays: onLeaveRecords,
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
        wardenResponse: c.wardenResponse || '',
        adminResponse: c.adminResponse || '',
        date: c.createdAt.toISOString().split('T')[0]
      })),
      leaveRequests: leaveRequests.map(l => ({
        id: l._id,
        reason: l.reason,
        type: l.type || 'Personal',
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        approvedBy: l.approvedBy || '',
        createdAt: l.createdAt
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

    const studentIds = await User.find({ role: 'student', ...getHostelSectionFilter(req.user) }).distinct('_id');
    filter.userId = studentIds.length ? { $in: studentIds } : null;

    const complaints = await Complaint.find(filter)
      .populate('userId', 'name room email department phone hostelSection')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    const formatted = complaints.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      studentEmail: c.userId?.email || '',
      studentDepartment: c.userId?.department || 'N/A',
      studentPhone: c.userId?.phone || 'N/A',
      hostelSection: c.userId?.hostelSection || '',
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

    const existingComplaint = await Complaint.findById(req.params.id).populate('userId', 'hostelSection');
    if (!existingComplaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    if (
      normalizeHostelSection(req.user.hostelSection) &&
      existingComplaint.userId?.hostelSection !== normalizeHostelSection(req.user.hostelSection)
    ) {
      return res.status(403).json({ error: 'Access denied for this hostel section' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('userId', 'name room email department phone hostelSection')
      .populate('resolvedBy', 'name');

    res.json({
      id: complaint._id,
      studentName: complaint.userId?.name || 'Unknown',
      studentRoom: complaint.userId?.room || 'N/A',
      studentEmail: complaint.userId?.email || '',
      studentDepartment: complaint.userId?.department || 'N/A',
      studentPhone: complaint.userId?.phone || 'N/A',
      hostelSection: complaint.userId?.hostelSection || '',
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

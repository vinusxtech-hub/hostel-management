const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Resolution = require('../models/Resolution');
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

    // Resolution stats
    const resolutionFilter = studentIds.length ? { userId: { $in: studentIds } } : { userId: null };
    const pendingResolutions = await Resolution.countDocuments({ ...resolutionFilter, status: 'Pending' });
    const inProgressResolutions = await Resolution.countDocuments({ ...resolutionFilter, status: 'In Progress' });
    const resolvedResolutions = await Resolution.countDocuments({ ...resolutionFilter, status: 'Resolved' });
    const rejectedResolutions = await Resolution.countDocuments({ ...resolutionFilter, status: 'Rejected' });
    const totalResolutions = pendingResolutions + inProgressResolutions + resolvedResolutions + rejectedResolutions;

    // Today's resolved
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resolvedToday = await Resolution.countDocuments({
      ...resolutionFilter,
      status: 'Resolved',
      updatedAt: { $gte: startOfDay }
    });

    // Recent resolutions (last 5)
    const recentResolutions = await Resolution.find(resolutionFilter)
      .populate('userId', 'name room email hostelSection')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedRecent = recentResolutions.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      hostelSection: c.userId?.hostelSection || '',
      category: c.category,
      description: c.description.substring(0, 80) + (c.description.length > 80 ? '...' : ''),
      status: c.status,
      date: c.createdAt.toISOString().split('T')[0]
    }));

    // Weekly resolution trend
    const weeklyResolutions = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const newResolutions = await Resolution.countDocuments({
        ...resolutionFilter,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      const resolvedDay = await Resolution.countDocuments({
        ...resolutionFilter,
        status: 'Resolved',
        updatedAt: { $gte: dayStart, $lte: dayEnd }
      });

      weeklyResolutions.push({
        day: days[d.getDay()],
        new: newResolutions,
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
      totalResolutions: totalResolutions,
      pendingResolutions: pendingResolutions,
      inProgressResolutions: inProgressResolutions,
      resolvedResolutions: resolvedResolutions,
      rejectedResolutions: rejectedResolutions,
      resolvedToday,
      recentResolutions: formattedRecent,
      weeklyResolutions,
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

      // Get resolution count for this student
      const resolutionCount = await Resolution.countDocuments({ userId: student._id });
      const pendingResolutionCount = await Resolution.countDocuments({ userId: student._id, status: 'Pending' });

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
        totalResolutions: resolutionCount,
        pendingResolutions: pendingResolutionCount
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

    // Get all resolutions
    const resolutions = await Resolution.find({ userId: student._id })
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
      resolutions: resolutions.map(c => ({
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

// @desc    Get all resolutions
// @route   GET /api/warden/resolutions
exports.getResolutions = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;

    const studentIds = await User.find({ role: 'student', ...getHostelSectionFilter(req.user) }).distinct('_id');
    filter.userId = studentIds.length ? { $in: studentIds } : null;

    const resolutions = await Resolution.find(filter)
      .populate('userId', 'name room email department phone hostelSection')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    const formatted = resolutions.map(c => ({
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
    console.error('Warden resolutions error:', error);
    res.status(500).json({ error: 'Failed to fetch resolutions' });
  }
};

// Keep backward compatibility
exports.getResolutions = exports.getResolutions;

// @desc    Update resolution status
// @route   PUT /api/warden/resolutions/:id
exports.updateResolution = async (req, res) => {
  try {
    const { status, wardenResponse } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (wardenResponse !== undefined) updateData.wardenResponse = wardenResponse;

    // Track who resolved/handled the resolution
    if (status === 'Resolved' || status === 'Rejected') {
      updateData.resolvedBy = req.user._id;
    }

    const existingResolution = await Resolution.findById(req.params.id).populate('userId', 'hostelSection');
    if (!existingResolution) {
      return res.status(404).json({ error: 'Resolution not found' });
    }
    if (
      normalizeHostelSection(req.user.hostelSection) &&
      existingResolution.userId?.hostelSection !== normalizeHostelSection(req.user.hostelSection)
    ) {
      return res.status(403).json({ error: 'Access denied for this hostel section' });
    }

    const resolution = await Resolution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('userId', 'name room email department phone hostelSection')
      .populate('resolvedBy', 'name');

    res.json({
      id: resolution._id,
      studentName: resolution.userId?.name || 'Unknown',
      studentRoom: resolution.userId?.room || 'N/A',
      studentEmail: resolution.userId?.email || '',
      studentDepartment: resolution.userId?.department || 'N/A',
      studentPhone: resolution.userId?.phone || 'N/A',
      hostelSection: resolution.userId?.hostelSection || '',
      category: resolution.category,
      description: resolution.description,
      status: resolution.status,
      wardenResponse: resolution.wardenResponse || '',
      adminResponse: resolution.adminResponse || '',
      resolvedByName: resolution.resolvedBy?.name || '',
      createdAt: resolution.createdAt,
      updatedAt: resolution.updatedAt,
      date: resolution.createdAt.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Update resolution error:', error);
    res.status(500).json({ error: 'Failed to update resolution' });
  }
};

// Keep backward compatibility
exports.updateResolution = exports.updateResolution;

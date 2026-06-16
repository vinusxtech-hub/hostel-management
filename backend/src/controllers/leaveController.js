const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ============================================================
// Leave Controller
// Integration: Leave Management System
// Handles: Student leave CRUD, Warden approval/rejection,
//          Automatic attendance integration, Gender-based routing
// ============================================================

// Helper: Normalize hostel section for gender-based filtering
const normalizeHostelSection = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['boys', 'boy', 'male', 'm'].includes(normalized)) return 'boys';
  if (['girls', 'girl', 'female', 'f'].includes(normalized)) return 'girls';
  return '';
};

const normalizeBuilding = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (['A', 'B', 'C'].includes(normalized)) return normalized;
  return '';
};

const canWardenAccessStudent = (wardenSection, wardenBuilding, studentSection, studentBuilding) => {
  if (wardenSection && normalizeHostelSection(studentSection) !== wardenSection) return false;
  if (wardenBuilding && normalizeBuilding(studentBuilding) !== wardenBuilding) return false;
  return true;
};

const getStudentIdsForSection = async (wardenSection, wardenBuilding) => {
  const students = await User.find({ role: 'student' }).select('_id hostelSection building');
  return students
    .filter((student) => canWardenAccessStudent(wardenSection, wardenBuilding, student.hostelSection, student.building))
    .map((student) => student._id);
};

// Helper: Get date string in YYYY-MM-DD format
const toDateStr = (date) => new Date(date).toISOString().split('T')[0];

// Helper: Get all dates between start and end (inclusive)
const getDateRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  const endDate = new Date(end);
  current.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(toDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// Helper: Create "On Leave" attendance records for approved leave dates
const createOnLeaveAttendanceRecords = async (studentId, startDate, endDate) => {
  const dates = getDateRange(startDate, endDate);
  const today = toDateStr(new Date());
  let created = 0;

  for (const dateStr of dates) {
    // Skip past dates that already have attendance records
    const existing = await Attendance.findOne({ userId: studentId, date: dateStr });
    if (existing) continue;

    // Only create records for today and future dates
    if (dateStr >= today) {
      try {
        await Attendance.create({
          userId: studentId,
          date: dateStr,
          timestamp: new Date(dateStr),
          time: '00:00',
          latitude: 0,
          longitude: 0,
          distance: 0,
          status: 'On Leave',
          location: 'Outside'
        });
        created++;
      } catch (err) {
        // Skip duplicate key errors (race condition protection)
        if (err.code !== 11000) throw err;
      }
    }
  }
  return created;
};

// Helper: Remove "On Leave" attendance records when leave is cancelled/rejected
const removeOnLeaveAttendanceRecords = async (studentId, startDate, endDate) => {
  const dates = getDateRange(startDate, endDate);
  const today = toDateStr(new Date());

  for (const dateStr of dates) {
    if (dateStr >= today) {
      await Attendance.deleteOne({
        userId: studentId,
        date: dateStr,
        status: 'On Leave'
      });
    }
  }
};

// ============================================================
// STUDENT ENDPOINTS
// ============================================================

// @desc    Create a new leave request
// @route   POST /api/student/leaves
// @access  Student
exports.createLeaveRequest = async (req, res) => {
  try {
    const { reason, startDate, endDate, documentUrl } = req.body;

    // Validation
    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'Reason, start date, and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    if (end < start) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    // Check for overlapping leave requests (Pending or Approved only)
    const overlapping = await LeaveRequest.findOne({
      studentId: req.user._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        error: 'You already have a leave request overlapping with these dates'
      });
    }

    const leave = await LeaveRequest.create({
      studentId: req.user._id,
      reason,
      startDate: start,
      endDate: end,
      documentUrl: documentUrl || ''
    });

    res.status(201).json({
      id: leave._id,
      reason: leave.reason,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status,
      remarks: leave.remarks,
      documentUrl: leave.documentUrl,
      createdAt: leave.createdAt
    });
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
};

// @desc    Get all leave requests for logged-in student
// @route   GET /api/student/leaves
// @access  Student
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ studentId: req.user._id })
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    const formatted = leaves.map(l => ({
      id: l._id,
      reason: l.reason,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status,
      remarks: l.remarks,
      approvedByName: l.approvedBy?.name || '',
      approvedByRole: l.approvedBy?.role || '',
      approvedAt: l.approvedAt || null,
      documentUrl: l.documentUrl,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

// @desc    Cancel a pending leave request
// @route   PUT /api/student/leaves/:id/cancel
// @access  Student
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      studentId: req.user._id
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be cancelled' });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
};

// ============================================================
// WARDEN ENDPOINTS
// ============================================================

// @desc    Get pending leave requests (filtered by warden's hostel section)
// @route   GET /api/warden/leaves
// @access  Warden
exports.getPendingLeaves = async (req, res) => {
  try {
    let filter = { status: 'Pending' };
    
    // Admin can see all leaves, Warden only sees their assigned students' leaves
    if (req.user.role !== 'admin') {
      const wardenSection = normalizeHostelSection(req.user.hostelSection);
      const studentIds = await getStudentIdsForSection(wardenSection);
      filter.studentId = { $in: studentIds };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('studentId', 'name email room department hostelSection building phone')
      .sort({ createdAt: -1 });

    const formatted = leaves.map(l => ({
      id: l._id,
      studentName: l.studentId?.name || 'Unknown',
      studentEmail: l.studentId?.email || '',
      studentRoom: l.studentId?.room || 'N/A',
      studentDepartment: l.studentId?.department || 'N/A',
      studentBuilding: l.studentId?.building || '',
      studentPhone: l.studentId?.phone || 'N/A',
      hostelSection: l.studentId?.hostelSection || '',
      reason: l.reason,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status,
      documentUrl: l.documentUrl,
      createdAt: l.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch pending leave requests' });
  }
};

// @desc    Get all leave requests with optional filters
// @route   GET /api/warden/leaves/all
// @access  Warden
exports.getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    // Admin can see all leaves, Warden only sees their assigned students' leaves
    if (req.user.role !== 'admin') {
      const wardenSection = normalizeHostelSection(req.user.hostelSection);
      const studentIds = await getStudentIdsForSection(wardenSection);
      filter.studentId = { $in: studentIds };
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('studentId', 'name email room department hostelSection building phone')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    const formatted = leaves.map(l => ({
      id: l._id,
      studentName: l.studentId?.name || 'Unknown',
      studentEmail: l.studentId?.email || '',
      studentRoom: l.studentId?.room || 'N/A',
      studentDepartment: l.studentId?.department || 'N/A',
      studentBuilding: l.studentId?.building || '',
      studentPhone: l.studentId?.phone || 'N/A',
      hostelSection: l.studentId?.hostelSection || '',
      reason: l.reason,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status,
      remarks: l.remarks,
      approvedByName: l.approvedBy?.name || '',
      approvedByRole: l.approvedBy?.role || '',
      approvedAt: l.approvedAt || null,
      documentUrl: l.documentUrl,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

// @desc    Approve a leave request
// @route   PUT /api/warden/leaves/:id/approve
// @access  Warden
exports.approveLeave = async (req, res) => {
  try {
    const { remarks } = req.body;

    const leave = await LeaveRequest.findById(req.params.id)
      .populate('studentId', 'hostelSection building');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be approved' });
    }

    // Verify warden section check, bypass for admin
    if (req.user.role !== 'admin') {
      const wardenSection = normalizeHostelSection(req.user.hostelSection);
      const wardenBuilding = normalizeBuilding(req.user.building);
      if (!canWardenAccessStudent(wardenSection, wardenBuilding, leave.studentId?.hostelSection, leave.studentId?.building)) {
        return res.status(403).json({ error: 'Access denied — student is not in your hostel section' });
      }
    }

    // Update leave status
    leave.status = 'Approved';
    leave.remarks = remarks || '';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

    // Integration: Create "On Leave" attendance records
    const recordsCreated = await createOnLeaveAttendanceRecords(
      leave.studentId._id,
      leave.startDate,
      leave.endDate
    );

    // Re-populate for response
    await leave.populate('studentId', 'name email room department hostelSection building phone');
    await leave.populate('approvedBy', 'name role');

    res.json({
      id: leave._id,
      studentName: leave.studentId?.name || 'Unknown',
      studentEmail: leave.studentId?.email || '',
      studentRoom: leave.studentId?.room || 'N/A',
      reason: leave.reason,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status,
      remarks: leave.remarks,
      approvedByName: leave.approvedBy?.name || '',
      approvedByRole: leave.approvedBy?.role || '',
      approvedAt: leave.approvedAt,
      createdAt: leave.createdAt,
      attendanceRecordsCreated: recordsCreated
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
};

// @desc    Reject a leave request
// @route   PUT /api/warden/leaves/:id/reject
// @access  Warden
exports.rejectLeave = async (req, res) => {
  try {
    const { remarks } = req.body;

    const leave = await LeaveRequest.findById(req.params.id)
      .populate('studentId', 'hostelSection building');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be rejected' });
    }

    // Verify warden section check, bypass for admin
    if (req.user.role !== 'admin') {
      const wardenSection = normalizeHostelSection(req.user.hostelSection);
      const wardenBuilding = normalizeBuilding(req.user.building);
      if (!canWardenAccessStudent(wardenSection, wardenBuilding, leave.studentId?.hostelSection, leave.studentId?.building)) {
        return res.status(403).json({ error: 'Access denied — student is not in your hostel section' });
      }
    }

    // Update leave status
    leave.status = 'Rejected';
    leave.remarks = remarks || '';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

    // Re-populate for response
    await leave.populate('studentId', 'name email room department hostelSection building phone');
    await leave.populate('approvedBy', 'name role');

    res.json({
      id: leave._id,
      studentName: leave.studentId?.name || 'Unknown',
      studentEmail: leave.studentId?.email || '',
      studentRoom: leave.studentId?.room || 'N/A',
      reason: leave.reason,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status,
      remarks: leave.remarks,
      approvedByName: leave.approvedBy?.name || '',
      approvedByRole: leave.approvedBy?.role || '',
      approvedAt: leave.approvedAt,
      createdAt: leave.createdAt
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
};

// ============================================================
// UTILITY: Expired leave cleanup (called on server startup)
// Removes future "On Leave" attendance records for leaves
// whose end date has passed — ensures no stale records remain
// ============================================================
exports.cleanupExpiredLeaves = async () => {
  try {
    const today = toDateStr(new Date());

    // Find approved leaves that ended before today — nothing to clean up
    // for attendance since those records are in the past and valid.
    // This function is a placeholder for any future cleanup logic
    // (e.g., sending notifications, updating student status, etc.)

    const expiredCount = await LeaveRequest.countDocuments({
      status: 'Approved',
      endDate: { $lt: new Date(today) }
    });

    if (expiredCount > 0) {
      console.log(`Leave system: ${expiredCount} approved leave(s) have ended.`);
    }
  } catch (error) {
    console.error('Leave cleanup error:', error);
  }
};

// @desc    Verify QR Code Pass (scanned by guard)
// @route   POST /api/guard/verify-qr
// @access  Private/Guard
exports.verifyQrCode = async (req, res) => {
  try {
    const { token } = req.body;
    const mongoose = require('mongoose');

    if (!token || !mongoose.Types.ObjectId.isValid(token)) {
      return res.status(400).json({ error: 'Invalid QR Code format' });
    }

    const leave = await LeaveRequest.findById(token)
      .populate('studentId', 'name email room department hostelSection building phone')
      .populate('approvedBy', 'name role');

    if (!leave) {
      return res.status(404).json({ error: 'QR Code invalid - No matching leave request found' });
    }

    if (leave.status !== 'Approved') {
      return res.status(400).json({ error: `QR Code invalid - Leave status is ${leave.status}` });
    }

    if (!leave.approvedAt) {
      return res.status(400).json({ error: 'QR Code invalid - Missing approval timestamp' });
    }

    // Check 3 hours expiry
    const approvedTime = new Date(leave.approvedAt).getTime();
    const expiresTime = approvedTime + (3 * 60 * 60 * 1000); // 3 hours in ms
    const currentTime = Date.now();

    if (currentTime > expiresTime) {
      const expiredByMin = Math.round((currentTime - expiresTime) / 60000);
      return res.status(400).json({ 
        error: `QR Code has expired!`,
        expired: true,
        details: {
          studentName: leave.studentId?.name || 'Unknown',
          approvedBy: leave.approvedBy?.name || 'Unknown',
          approvedByRole: leave.approvedBy?.role || 'N/A',
          approvedAt: leave.approvedAt,
          expiredByMinutes: expiredByMin
        }
      });
    }

    // QR is valid
    res.json({
      valid: true,
      studentName: leave.studentId?.name || 'Unknown',
      studentEmail: leave.studentId?.email || '',
      room: leave.studentId?.room || 'N/A',
      department: leave.studentId?.department || 'N/A',
      hostelSection: leave.studentId?.hostelSection || '',
      building: leave.studentId?.building || '',
      phone: leave.studentId?.phone || 'N/A',
      reason: leave.reason,
      startDate: leave.startDate,
      endDate: leave.endDate,
      approvedBy: leave.approvedBy?.name || 'Unknown',
      approvedByRole: leave.approvedBy?.role || 'N/A',
      approvedAt: leave.approvedAt,
      expiresAt: new Date(expiresTime)
    });

  } catch (error) {
    console.error('Verify QR error:', error);
    res.status(500).json({ error: 'Server error during QR verification' });
  }
};

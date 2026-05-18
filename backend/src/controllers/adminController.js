const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');

const normalizeHostelSection = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['boys', 'boy', 'male', 'm'].includes(normalized)) return 'boys';
  if (['girls', 'girl', 'female', 'f'].includes(normalized)) return 'girls';
  return '';
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = await User.countDocuments({ role: 'student' });
    const todayRecords = await Attendance.find({ date: today });

    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const lateToday = todayRecords.filter(r => r.status === 'Late').length;
    const absentToday = totalStudents - presentToday - lateToday;

    // Weekly chart data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = await Attendance.find({ date: dateStr });
      const dayPresent = dayRecords.filter(r => r.status === 'Present').length;
      const dayLate = dayRecords.filter(r => r.status === 'Late').length;
      const dayAbsent = totalStudents - dayPresent - dayLate;
      weeklyData.push({
        day: days[d.getDay()],
        present: dayPresent,
        absent: Math.max(0, dayAbsent),
        late: dayLate
      });
    }

    // Active vs total
    const activeStudents = await Attendance.distinct('userId', { date: today });

    // Pending complaints
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });

    // Calculate attendance rate
    const weekTotal = weeklyData.reduce((sum, d) => sum + d.present + d.late, 0);
    const weekPossible = totalStudents * 7 || 1;
    const attendanceRate = ((weekTotal / weekPossible) * 100).toFixed(1);

    res.json({
      totalStudents,
      presentToday,
      absentToday: Math.max(0, absentToday),
      lateToday,
      weeklyData,
      activeStudents: activeStudents.length,
      pendingComplaints,
      attendanceRate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ name: 1 });
    const today = new Date().toISOString().split('T')[0];

    const result = await Promise.all(students.map(async (student) => {
      // Get today's attendance
      const todayRecord = await Attendance.findOne({ userId: student._id, date: today });

      // Get total attendance stats
      const totalRecords = await Attendance.countDocuments({ userId: student._id });
      const presentRecords = await Attendance.countDocuments({
        userId: student._id,
        status: { $in: ['Present', 'Late'] }
      });
      const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        hostelSection: student.hostelSection || '',
        building: student.building || '',
        room: student.room || 'N/A',
        department: student.department || 'N/A',
        phone: student.phone,
        attendanceRate: `${rate}%`,
        status: todayRecord ? 'Inside' : 'Outside'
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// @desc    Get single student details
// @route   GET /api/admin/students/:id
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
      .populate('resolvedBy', 'name')
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
      const LeaveRequest = require('../models/LeaveRequest');
      leaveRequests = await LeaveRequest.find({ studentId: student._id })
        .sort({ createdAt: -1 })
        .limit(20);
    } catch (e) {
      // LeaveRequest model may not exist
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
        resolvedByName: c.resolvedBy?.name || '',
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
    console.error('Admin student details error:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

// @desc    Add a student
// @route   POST /api/admin/students
exports.addStudent = async (req, res) => {
  try {
    const { name, email, room, department, phone, password, hostelSection, building } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const normalizedSection = normalizeHostelSection(hostelSection);
    const normalizedBuilding = building || 'A';

    const student = await User.create({
      name,
      email,
      password: password || 'password123',
      role: 'student',
      hostelSection: normalizedSection,
      building: normalizedBuilding,
      room: room || '',
      department: department || '',
      phone: phone || ''
    });

    res.status(201).json({
      id: student._id,
      name: student.name,
      email: student.email,
      hostelSection: student.hostelSection || '',
      building: student.building || '',
      room: student.room,
      department: student.department,
      attendanceRate: '100%',
      status: 'Outside'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add student' });
  }
};

// @desc    Bulk import students from Excel file
// @route   POST /api/admin/students/bulk-import
exports.bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ error: 'Excel file is empty or has no valid data rows' });
    }

    // Normalize column headers (case-insensitive, trim spaces)
    const normalizedRows = rows.map(row => {
      const normalized = {};
      Object.keys(row).forEach(key => {
        normalized[key.trim().toLowerCase()] = String(row[key]).trim();
      });
      return normalized;
    });

    // Validate that required columns exist
    const firstRow = normalizedRows[0];
    if (!('name' in firstRow) || !('email' in firstRow)) {
      return res.status(400).json({
        error: 'Excel file must have "Name" and "Email" columns. Found columns: ' +
               Object.keys(rows[0]).join(', ')
      });
    }

    const results = { success: 0, failed: 0, errors: [], created: [] };

    for (let i = 0; i < normalizedRows.length; i++) {
      const row = normalizedRows[i];
      const rowNum = i + 2; // Excel row (1-indexed header + 1)
      const name = row.name;
      const email = row.email;

      if (!name || !email) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: 'Missing name or email' });
        continue;
      }

      // Basic email validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        results.failed++;
        results.errors.push({ row: rowNum, name, reason: `Invalid email: ${email}` });
        continue;
      }

      try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
          results.failed++;
          results.errors.push({ row: rowNum, name, reason: `Email already exists: ${email}` });
          continue;
        }

        const importedSection = normalizeHostelSection(row.hostelsection || row.section || row.gender);
        const importedBuilding = row.building || 'A';

        const student = await User.create({
          name,
          email: email.toLowerCase(),
          password: row.password || 'password123',
          role: 'student',
          hostelSection: importedSection,
          building: importedBuilding,
          room: row.room || '',
          department: row.department || '',
          phone: row.phone || '',
          parentPhone: row.parentphone || row['parent phone'] || '',
          address: row.address || ''
        });

        results.success++;
        results.created.push({
          id: student._id,
          name: student.name,
          email: student.email,
          room: student.room
        });
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, name, reason: err.message });
      }
    }

    res.status(200).json({
      message: `Import complete: ${results.success} added, ${results.failed} failed`,
      totalProcessed: normalizedRows.length,
      ...results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to process Excel file: ' + error.message });
  }
};

// @desc    Get attendance records (with filters)
// @route   GET /api/admin/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (status && status !== 'all') filter.status = status;

    const records = await Attendance.find(filter)
      .populate('userId', 'name room email department')
      .sort({ timestamp: -1 })
      .limit(200);

    const formatted = records.map(r => ({
      id: r._id,
      name: r.userId?.name || 'Unknown',
      room: r.userId?.room || 'N/A',
      email: r.userId?.email || '',
      date: r.date,
      time: r.time,
      status: r.status,
      location: r.location,
      latitude: r.latitude,
      longitude: r.longitude,
      distance: r.distance
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

// @desc    Get reports & analytics
// @route   GET /api/admin/reports
exports.getReports = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Monthly data (last 5 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();

      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endMonth = month + 2 > 12 ? 1 : month + 2;
      const endYear = month + 2 > 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

      const records = await Attendance.find({
        date: { $gte: startDate, $lt: endDate }
      });

      monthlyData.push({
        month: months[month],
        present: records.filter(r => r.status === 'Present').length,
        late: records.filter(r => r.status === 'Late').length,
        absent: records.filter(r => r.status === 'Absent').length
      });
    }

    // Weekly trend (last 5 weeks)
    const trendData = [];
    for (let i = 4; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      const records = await Attendance.find({
        date: { $gte: startStr, $lte: endStr }
      });

      const total = records.length || 1;
      const presentLate = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
      trendData.push({
        week: `W${5 - i}`,
        rate: Math.round((presentLate / total) * 100)
      });
    }

    // Pie data for current month
    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const currentRecords = await Attendance.find({ date: { $gte: currentMonthStart } });

    const pieData = [
      { name: 'Present', value: currentRecords.filter(r => r.status === 'Present').length },
      { name: 'Late', value: currentRecords.filter(r => r.status === 'Late').length },
      { name: 'Absent', value: currentRecords.filter(r => r.status === 'Absent').length }
    ];

    // Department-wise (aggregate by department)
    const departments = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const departmentData = await Promise.all(departments.map(async (dept) => {
      const deptName = dept._id || 'Unassigned';
      const deptStudents = await User.find({ role: 'student', department: dept._id });
      const deptUserIds = deptStudents.map(u => u._id);
      const deptAttendance = await Attendance.countDocuments({
        userId: { $in: deptUserIds },
        status: { $in: ['Present', 'Late'] }
      });
      const deptTotal = await Attendance.countDocuments({ userId: { $in: deptUserIds } });

      return {
        name: deptName,
        value: dept.count,
        present: deptAttendance,
        attendance: deptTotal > 0 ? parseFloat(((deptAttendance / deptTotal) * 100).toFixed(1)) : 0
      };
    }));

    // Overall stats
    const allRecords = await Attendance.countDocuments();
    const allPresent = await Attendance.countDocuments({ status: { $in: ['Present', 'Late'] } });
    const avgRate = allRecords > 0 ? ((allPresent / allRecords) * 100).toFixed(1) : '0';

    res.json({
      monthlyData,
      trendData,
      pieData,
      departmentData,
      totalStudents,
      avgAttendanceRate: `${avgRate}%`,
      totalPresentMonth: currentRecords.filter(r => r.status === 'Present' || r.status === 'Late').length,
      totalAbsentMonth: currentRecords.filter(r => r.status === 'Absent').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// @desc    Get all complaints
// @route   GET /api/admin/complaints
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'name room email')
      .sort({ createdAt: -1 });

    const formatted = complaints.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      studentEmail: c.userId?.email || '',
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

// @desc    Update complaint status
// @route   PUT /api/admin/complaints/:id
exports.updateComplaint = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse },
      { new: true }
    ).populate('userId', 'name room email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({
      id: complaint._id,
      studentName: complaint.userId?.name || 'Unknown',
      studentRoom: complaint.userId?.room || 'N/A',
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      adminResponse: complaint.adminResponse,
      date: complaint.createdAt.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
};

// @desc    Get all wardens with work stats
// @route   GET /api/admin/wardens
exports.getWardens = async (req, res) => {
  try {
    const wardens = await User.find({ role: 'warden' }).sort({ name: 1 });

    const result = await Promise.all(wardens.map(async (warden) => {
      // Count students in their hostel section
      const sectionFilter = warden.hostelSection ? { hostelSection: warden.hostelSection } : {};
      const studentCount = await User.countDocuments({ role: 'student', ...sectionFilter });

      // Count complaints resolved/handled by this warden
      const complaintsResolved = await Complaint.countDocuments({ resolvedBy: warden._id, status: 'Resolved' });
      const complaintsRejected = await Complaint.countDocuments({ resolvedBy: warden._id, status: 'Rejected' });
      const complaintsInProgress = await Complaint.countDocuments({ resolvedBy: warden._id, status: 'In Progress' });
      const totalHandled = complaintsResolved + complaintsRejected + complaintsInProgress;

      // Count section complaints (all complaints from students in their section)
      const sectionStudentIds = await User.find({ role: 'student', ...sectionFilter }).distinct('_id');
      const sectionComplaints = sectionStudentIds.length
        ? await Complaint.countDocuments({ userId: { $in: sectionStudentIds } })
        : 0;
      const sectionPendingComplaints = sectionStudentIds.length
        ? await Complaint.countDocuments({ userId: { $in: sectionStudentIds }, status: 'Pending' })
        : 0;

      // Count notices created by this warden
      const noticeCount = await Notice.countDocuments({ createdBy: warden._id });

      // Last activity — most recent complaint update by this warden
      const lastHandled = await Complaint.findOne({ resolvedBy: warden._id })
        .sort({ updatedAt: -1 })
        .select('updatedAt');

      // Determine buildings managed
      const buildings = warden.hostelSection ? ['A', 'B', 'C'] : [];

      // Per-building student counts (filtered by warden's section)
      const buildingCounts = {};
      for (const b of buildings) {
        buildingCounts[b] = await User.countDocuments({ role: 'student', building: b, ...sectionFilter });
      }

      return {
        id: warden._id,
        name: warden.name,
        email: warden.email,
        phone: warden.phone || 'N/A',
        hostelSection: warden.hostelSection || '',
        department: warden.department || '',
        joinedAt: warden.createdAt,
        buildings,
        buildingCounts,
        studentCount,
        complaintsResolved,
        complaintsRejected,
        complaintsInProgress,
        totalHandled,
        sectionComplaints,
        sectionPendingComplaints,
        noticeCount,
        lastActivity: lastHandled?.updatedAt || warden.updatedAt
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('Admin get wardens error:', error);
    res.status(500).json({ error: 'Failed to fetch wardens' });
  }
};

// @desc    Get single warden details with work history
// @route   GET /api/admin/wardens/:id
exports.getWardenDetails = async (req, res) => {
  try {
    const warden = await User.findById(req.params.id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ error: 'Warden not found' });
    }

    // Profile
    const profile = {
      id: warden._id,
      name: warden.name,
      email: warden.email,
      phone: warden.phone || 'N/A',
      hostelSection: warden.hostelSection || '',
      department: warden.department || '',
      address: warden.address || '',
      joinedAt: warden.createdAt
    };

    // Section stats
    const sectionFilter = warden.hostelSection ? { hostelSection: warden.hostelSection } : {};
    const studentCount = await User.countDocuments({ role: 'student', ...sectionFilter });
    const sectionStudentIds = await User.find({ role: 'student', ...sectionFilter }).distinct('_id');

    // Complaint stats
    const complaintsResolved = await Complaint.countDocuments({ resolvedBy: warden._id, status: 'Resolved' });
    const complaintsRejected = await Complaint.countDocuments({ resolvedBy: warden._id, status: 'Rejected' });
    const complaintsInProgress = await Complaint.countDocuments({ resolvedBy: warden._id, status: 'In Progress' });
    const totalHandled = complaintsResolved + complaintsRejected + complaintsInProgress;

    const sectionTotalComplaints = sectionStudentIds.length
      ? await Complaint.countDocuments({ userId: { $in: sectionStudentIds } })
      : 0;
    const sectionPendingComplaints = sectionStudentIds.length
      ? await Complaint.countDocuments({ userId: { $in: sectionStudentIds }, status: 'Pending' })
      : 0;

    const resolutionRate = sectionTotalComplaints > 0
      ? Math.round((complaintsResolved / sectionTotalComplaints) * 100)
      : 0;

    // Recent complaints handled by this warden (last 20)
    const recentComplaints = await Complaint.find({ resolvedBy: warden._id })
      .populate('userId', 'name room email hostelSection')
      .sort({ updatedAt: -1 })
      .limit(20);

    const formattedComplaints = recentComplaints.map(c => ({
      id: c._id,
      studentName: c.userId?.name || 'Unknown',
      studentRoom: c.userId?.room || 'N/A',
      category: c.category,
      description: c.description.substring(0, 120) + (c.description.length > 120 ? '...' : ''),
      status: c.status,
      wardenResponse: c.wardenResponse || '',
      date: c.createdAt.toISOString().split('T')[0],
      handledAt: c.updatedAt.toISOString().split('T')[0]
    }));

    // Notices created by this warden
    const notices = await Notice.find({ createdBy: warden._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedNotices = notices.map(n => ({
      id: n._id,
      title: n.title,
      category: n.category,
      priority: n.priority,
      isPinned: n.isPinned,
      date: n.createdAt.toISOString().split('T')[0]
    }));

    // Today's section attendance
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = await Attendance.find({ date: today, userId: { $in: sectionStudentIds } });
    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const lateToday = todayRecords.filter(r => r.status === 'Late').length;
    const absentToday = studentCount - presentToday - lateToday;

    res.json({
      profile,
      stats: {
        studentCount,
        complaintsResolved,
        complaintsRejected,
        complaintsInProgress,
        totalHandled,
        sectionTotalComplaints,
        sectionPendingComplaints,
        resolutionRate,
        noticeCount: notices.length,
        presentToday,
        lateToday,
        absentToday: Math.max(0, absentToday)
      },
      recentComplaints: formattedComplaints,
      notices: formattedNotices
    });
  } catch (error) {
    console.error('Warden details error:', error);
    res.status(500).json({ error: 'Failed to fetch warden details' });
  }
};


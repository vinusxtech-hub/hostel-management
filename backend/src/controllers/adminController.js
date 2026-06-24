const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Resolution = require('../models/Resolution');
const Notice = require('../models/Notice');
const Settings = require('../models/Settings');

const generateRandomPassword = (role) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const suffix = role === 'warden' ? 'W!' : role === 'guard' ? 'G!' : 'S!';
  return password + suffix;
};


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

const normalizeYear = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['1', '1st', 'first', '1st year', 'first year'].includes(normalized)) return '1st Year';
  if (['2', '2nd', 'second', '2nd year', 'second year'].includes(normalized)) return '2nd Year';
  if (['3', '3rd', 'third', '3rd year', 'third year'].includes(normalized)) return '3rd Year';
  if (['4', '4th', 'fourth', '4th year', 'fourth year'].includes(normalized)) return '4th Year';
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

    // Pending resolutions
    const pendingResolutions = await Resolution.countDocuments({ status: 'Pending' });

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
      pendingResolutions,
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
    // Get Wardens created by this Admin (and legacy wardens)
    const wardens = await User.find({
      role: 'warden',
      $or: [
        { createdBy: req.user._id },
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });
    const wardenIds = wardens.map(w => w._id);

    // Query students created by this admin, their wardens, or legacy students
    const students = await User.find({
      role: 'student',
      $or: [
        { createdBy: req.user._id },
        { createdBy: { $in: wardenIds } },
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    }).sort({ name: 1 });

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

      // Count monthly leaves (approved in last 30 days)
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      const LeaveRequest = require('../models/LeaveRequest');
      const monthlyLeaves = await LeaveRequest.countDocuments({
        studentId: student._id,
        status: 'Approved',
        startDate: { $gte: oneMonthAgo }
      });

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        hostelSection: student.hostelSection || '',
        building: student.building || '',
        room: student.room || 'N/A',
        department: student.department || 'N/A',
        phone: student.phone,
        year: student.year || '',
        attendanceRate: `${rate}%`,
        status: todayRecord ? 'Inside' : 'Outside',
        monthlyLeaves
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

    // Creator isolation verification
    const wardens = await User.find({
      role: 'warden',
      $or: [
        { createdBy: req.user._id },
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });
    const wardenIds = wardens.map(w => w._id.toString());
    const isCreator = student.createdBy?.toString() === req.user._id.toString();
    const isWardenCreator = student.createdBy && wardenIds.includes(student.createdBy.toString());
    const isLegacy = !student.createdBy;

    if (!isCreator && !isWardenCreator && !isLegacy) {
      return res.status(403).json({ error: 'Access denied: Student managed by another admin group' });
    }

    // Get attendance history (last 30 days)
    const attendanceHistory = await Attendance.find({ userId: student._id })
      .sort({ date: -1 })
      .limit(30);

    // Get all resolutions
    const resolutions = await Resolution.find({ userId: student._id })
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

    // Count monthly leaves (approved in last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const LeaveRequest = require('../models/LeaveRequest');
    const monthlyLeaves = await LeaveRequest.countDocuments({
      studentId: student._id,
      status: 'Approved',
      startDate: { $gte: oneMonthAgo }
    });

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
        year: student.year || '',
        createdAt: student.createdAt,
        todayStatus: todayRecord ? todayRecord.status : 'Absent',
        monthlyLeaves
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
    const { name, email, room, department, phone, hostelSection, building, year } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const normalizedSection = normalizeHostelSection(hostelSection);
    const normalizedBuilding = String(building || '').trim().toUpperCase();

    // Enforce building rules: boys -> A or B; girls -> C only
    if (normalizedSection === 'boys') {
      const allowed = ['A', 'B'];
      const pick = normalizedBuilding || 'A';
      if (!allowed.includes(pick)) {
        return res.status(400).json({ error: 'Boys hostel students must be assigned to Building A or B' });
      }
      // use validated building
      req.body.building = pick;
    }

    if (normalizedSection === 'girls') {
      const pick = normalizedBuilding || 'C';
      if (pick !== 'C') {
        return res.status(400).json({ error: 'Girls hostel students must be assigned to Building C' });
      }
      req.body.building = pick;
    }

    // Generate secure random password
    const plainPassword = generateRandomPassword('student');

    const student = await User.create({
      name,
      email: normalizedEmail,
      password: plainPassword,
      role: 'student',
      hostelSection: normalizedSection,
      building: req.body.building || '',
      room: room || '',
      department: department || '',
      phone: phone || '',
      year: normalizeYear(year),
      createdBy: req.user._id
    });

    // Send welcome email with credentials to their email asynchronously
    const emailService = require('../services/emailService');
    emailService.sendWelcomeEmail(student.email, student.name, student.email, plainPassword, 'student').catch(err => {
      console.error(`Welcome email send failed for ${student.email}:`, err.message);
    });

    res.status(201).json({
      id: student._id,
      name: student.name,
      email: student.email,
      hostelSection: student.hostelSection || '',
      building: student.building || '',
      room: student.room,
      department: student.department,
      year: student.year || '',
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
        let importedBuilding = String(row.building || '').trim().toUpperCase();
        const importedYear = normalizeYear(row.year || row['class year'] || row.class);

        // Validate building rules per section
        if (importedSection === 'boys') {
          if (!importedBuilding) importedBuilding = 'A';
          if (!['A', 'B'].includes(importedBuilding)) {
            results.failed++;
            results.errors.push({ row: rowNum, name, reason: `Invalid building for boys: ${importedBuilding}` });
            continue;
          }
        }
        if (importedSection === 'girls') {
          if (!importedBuilding) importedBuilding = 'C';
          if (importedBuilding !== 'C') {
            results.failed++;
            results.errors.push({ row: rowNum, name, reason: `Invalid building for girls: ${importedBuilding}` });
            continue;
          }
        }

        const importPassword = generateRandomPassword('student');

        const student = await User.create({
          name,
          email: email.toLowerCase(),
          password: importPassword,
          role: 'student',
          hostelSection: importedSection,
          building: importedBuilding,
          room: row.room || '',
          department: row.department || '',
          phone: row.phone || '',
          parentPhone: row.parentphone || row['parent phone'] || '',
          address: row.address || '',
          year: importedYear,
          createdBy: req.user._id
        });

        // Trigger welcome email asynchronously
        const emailService = require('../services/emailService');
        emailService.sendWelcomeEmail(student.email, student.name, student.email, importPassword, 'student').catch(err => {
          console.error(`Welcome email send failed during import for ${student.email}:`, err.message);
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

// @desc    Get all resolutions
// @route   GET /api/admin/resolutions
exports.getResolutions = async (req, res) => {
  try {
    const resolutions = await Resolution.find()
      .populate('userId', 'name room email')
      .sort({ createdAt: -1 });

    const formatted = resolutions.map(c => ({
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
    res.status(500).json({ error: 'Failed to fetch resolutions' });
  }
};

// Keep backward compatibility
exports.getResolutions = exports.getResolutions;

// @desc    Update resolution status
// @route   PUT /api/admin/resolutions/:id
exports.updateResolution = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const resolution = await Resolution.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse },
      { new: true }
    ).populate('userId', 'name room email');

    if (!resolution) {
      return res.status(404).json({ error: 'Resolution not found' });
    }

    res.json({
      id: resolution._id,
      studentName: resolution.userId?.name || 'Unknown',
      studentRoom: resolution.userId?.room || 'N/A',
      category: resolution.category,
      description: resolution.description,
      status: resolution.status,
      adminResponse: resolution.adminResponse,
      date: resolution.createdAt.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resolution' });
  }
};

// Keep backward compatibility
exports.updateResolution = exports.updateResolution;

// @desc    Get all wardens with work stats
// @route   GET /api/admin/wardens
// @access  Private/Admin
exports.getWardens = async (req, res) => {
  try {
    const wardens = await User.find({
      role: 'warden',
      $or: [
        { createdBy: req.user._id },
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    }).sort({ name: 1 });

    const result = await Promise.all(wardens.map(async (warden) => {
      const sectionFilter = warden.hostelSection ? { hostelSection: normalizeHostelSection(warden.hostelSection) } : {};
      const buildingFilter = normalizeBuilding(warden.building) ? { building: normalizeBuilding(warden.building) } : {};
      const studentFilter = { role: 'student', ...sectionFilter, ...buildingFilter };
      const studentCount = await User.countDocuments(studentFilter);

      // Count resolutions resolved/handled by this warden
      const resolutionsResolved = await Resolution.countDocuments({ resolvedBy: warden._id, status: 'Resolved' });
      const resolutionsRejected = await Resolution.countDocuments({ resolvedBy: warden._id, status: 'Rejected' });
      const resolutionsInProgress = await Resolution.countDocuments({ resolvedBy: warden._id, status: 'In Progress' });
      const totalHandled = resolutionsResolved + resolutionsRejected + resolutionsInProgress;

      // Count section resolutions (all resolutions from students in their section)
      const sectionStudentIds = await User.find(studentFilter).distinct('_id');
      const sectionResolutions = sectionStudentIds.length
        ? await Resolution.countDocuments({ userId: { $in: sectionStudentIds } })
        : 0;
      const sectionPendingResolutions = sectionStudentIds.length
        ? await Resolution.countDocuments({ userId: { $in: sectionStudentIds }, status: 'Pending' })
        : 0;

      // Count notices created by this warden
      const noticeCount = await Notice.countDocuments({ createdBy: warden._id });

      // Last activity — most recent resolution update by this warden
      const lastHandled = await Resolution.findOne({ resolvedBy: warden._id })
        .sort({ updatedAt: -1 })
        .select('updatedAt');

      // Determine buildings managed
      const buildings = warden.hostelSection ? ['A', 'B', 'C'] : [];
      const buildingCounts = {};
      for (const b of buildings) {
        buildingCounts[b] = await User.countDocuments({ role: 'student', building: b, ...sectionFilter, ...buildingFilter });
      }

      return {
        id: warden._id,
        name: warden.name,
        email: warden.email,
        phone: warden.phone || 'N/A',
        hostelSection: warden.hostelSection || '',
        building: normalizeBuilding(warden.building) || '',
        department: warden.department || '',
        joinedAt: warden.createdAt,
        buildings,
        buildingCounts,
        studentCount,
        resolutionsResolved: resolutionsResolved,
        resolutionsRejected: resolutionsRejected,
        resolutionsInProgress: resolutionsInProgress,
        totalHandled,
        sectionResolutions: sectionResolutions,
        sectionPendingResolutions: sectionPendingResolutions,
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

    if (warden.createdBy && warden.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied: Warden managed by another admin' });
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
    const buildingFilter = normalizeBuilding(warden.building) ? { building: normalizeBuilding(warden.building) } : {};
    const studentFilter = { role: 'student', ...sectionFilter, ...buildingFilter };
    const studentCount = await User.countDocuments(studentFilter);
    const sectionStudentIds = await User.find({ role: 'student', ...sectionFilter }).distinct('_id');

    // Resolution stats
    const resolutionsResolved = await Resolution.countDocuments({ resolvedBy: warden._id, status: 'Resolved' });
    const resolutionsRejected = await Resolution.countDocuments({ resolvedBy: warden._id, status: 'Rejected' });
    const resolutionsInProgress = await Resolution.countDocuments({ resolvedBy: warden._id, status: 'In Progress' });
    const totalHandled = resolutionsResolved + resolutionsRejected + resolutionsInProgress;

    const sectionTotalResolutions = sectionStudentIds.length
      ? await Resolution.countDocuments({ userId: { $in: sectionStudentIds } })
      : 0;
    const sectionPendingResolutions = sectionStudentIds.length
      ? await Resolution.countDocuments({ userId: { $in: sectionStudentIds }, status: 'Pending' })
      : 0;

    const resolutionRate = sectionTotalResolutions > 0
      ? Math.round((resolutionsResolved / sectionTotalResolutions) * 100)
      : 0;

    // Recent resolutions handled by this warden (last 20)
    const recentResolutions = await Resolution.find({ resolvedBy: warden._id })
      .populate('userId', 'name room email hostelSection')
      .sort({ updatedAt: -1 })
      .limit(20);

    const formattedResolutions = recentResolutions.map(c => ({
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

    // Count leaves approved by this warden
    const LeaveRequest = require('../models/LeaveRequest');
    const leavesApproved = await LeaveRequest.countDocuments({ approvedBy: warden._id, status: 'Approved' });

    res.json({
      profile,
      stats: {
        studentCount,
        resolutionsResolved: resolutionsResolved,
        resolutionsRejected: resolutionsRejected,
        resolutionsInProgress: resolutionsInProgress,
        totalHandled,
        sectionTotalResolutions: sectionTotalResolutions,
        sectionPendingResolutions: sectionPendingResolutions,
        resolutionRate,
        noticeCount: notices.length,
        leavesApproved,
        presentToday,
        lateToday,
        absentToday: Math.max(0, absentToday)
      },
      recentResolutions: formattedResolutions,
      notices: formattedNotices
    });
  } catch (error) {
    console.error('Warden details error:', error);
    res.status(500).json({ error: 'Failed to fetch warden details' });
  }
};

// @desc    Get attendance settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
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
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// @desc    Update attendance settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const { checkInTime, cutoffTime, geofenceRadius, campusLatitude, campusLongitude } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    if (checkInTime !== undefined) settings.checkInTime = checkInTime;
    if (cutoffTime !== undefined) settings.cutoffTime = cutoffTime;
    if (geofenceRadius !== undefined) settings.geofenceRadius = Number(geofenceRadius);
    if (campusLatitude !== undefined) settings.campusLatitude = Number(campusLatitude);
    if (campusLongitude !== undefined) settings.campusLongitude = Number(campusLongitude);

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// @desc    Add a new warden
// @route   POST /api/admin/wardens
// @access  Private/Admin
exports.addWarden = async (req, res) => {
  try {
    const { name, email, hostelSection, building, phone, department } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Generate secure random password
    const plainPassword = generateRandomPassword('warden');

    const warden = await User.create({
      name,
      email: normalizedEmail,
      password: plainPassword,
      role: 'warden',
      hostelSection: hostelSection || '',
      building: building || '',
      phone: phone || '',
      department: department || '',
      createdBy: req.user._id
    });

    // Send welcome email with credentials to their email asynchronously
    const emailService = require('../services/emailService');
    emailService.sendWelcomeEmail(warden.email, warden.name, warden.email, plainPassword, 'warden').catch(err => {
      console.error(`Warden welcome email failed for ${warden.email}:`, err.message);
    });

    res.status(201).json({
      id: warden._id,
      name: warden.name,
      email: warden.email,
      role: warden.role,
      hostelSection: warden.hostelSection,
      building: warden.building,
      phone: warden.phone,
      department: warden.department
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to add warden' });
  }
};

// @desc    Delete a warden
// @route   DELETE /api/admin/wardens/:id
// @access  Private/Admin
exports.deleteWarden = async (req, res) => {
  try {
    const warden = await User.findById(req.params.id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ error: 'Warden not found' });
    }
    if (warden.createdBy && warden.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied: Warden managed by another admin' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Warden removed successfully' });
  } catch (error) {
    console.error('Delete warden error:', error);
    res.status(500).json({ error: 'Failed to delete warden' });
  }
};

// @desc    Get all guards
// @route   GET /api/admin/guards
// @access  Private/Admin
exports.getGuards = async (req, res) => {
  try {
    const guards = await User.find({ role: 'guard' }).sort({ name: 1 });
    const formatted = guards.map(g => ({
      id: g._id,
      name: g.name,
      email: g.email,
      phone: g.phone || 'N/A',
      joinedAt: g.createdAt
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Get guards error:', error);
    res.status(500).json({ error: 'Failed to fetch guards' });
  }
};

// @desc    Add a new guard
// @route   POST /api/admin/guards
// @access  Private/Admin
exports.addGuard = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const plainPassword = generateRandomPassword('guard');

    const guard = await User.create({
      name,
      email: normalizedEmail,
      password: plainPassword,
      role: 'guard',
      phone: phone || ''
    });

    const emailService = require('../services/emailService');
    emailService.sendWelcomeEmail(guard.email, guard.name, guard.email, plainPassword, 'guard').catch(err => {
      console.error(`Guard welcome email failed for ${guard.email}:`, err.message);
    });

    res.status(201).json({
      id: guard._id,
      name: guard.name,
      email: guard.email,
      role: guard.role,
      phone: guard.phone
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to add guard' });
  }
};

// @desc    Delete a guard
// @route   DELETE /api/admin/guards/:id
// @access  Private/Admin
exports.deleteGuard = async (req, res) => {
  try {
    const guard = await User.findById(req.params.id);
    if (!guard || guard.role !== 'guard') {
      return res.status(404).json({ error: 'Guard not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guard removed successfully' });
  } catch (error) {
    console.error('Delete guard error:', error);
    res.status(500).json({ error: 'Failed to delete guard' });
  }
};

// @desc    Bulk import guards from Excel file
// @route   POST /api/admin/guards/bulk-import
// @access  Private/Admin
exports.bulkImportGuards = async (req, res) => {
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
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const normalizedRows = rows.map(row => {
      const normalized = {};
      Object.keys(row).forEach(key => {
        normalized[key.trim().toLowerCase()] = String(row[key]).trim();
      });
      return normalized;
    });

    const firstRow = normalizedRows[0];
    if (!('name' in firstRow) || !('email' in firstRow)) {
      return res.status(400).json({
        error: 'Excel file must have "Name" and "Email" columns. Found columns: ' + Object.keys(rows[0]).join(', ')
      });
    }

    const results = { success: 0, failed: 0, errors: [], created: [] };

    for (let i = 0; i < normalizedRows.length; i++) {
      const row = normalizedRows[i];
      const rowNum = i + 2;
      const name = row.name;
      const email = row.email;

      if (!name || !email) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: 'Missing name or email' });
        continue;
      }

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

        const importPassword = generateRandomPassword('guard');

        const guard = await User.create({
          name,
          email: email.toLowerCase(),
          password: importPassword,
          role: 'guard',
          phone: row.phone || ''
        });

        const emailService = require('../services/emailService');
        emailService.sendWelcomeEmail(guard.email, guard.name, guard.email, importPassword, 'guard').catch(err => {
          console.error(`Guard welcome email failed during import for ${guard.email}:`, err.message);
        });

        results.success++;
        results.created.push({
          id: guard._id,
          name: guard.name,
          email: guard.email
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
    console.error('Bulk import guards error:', error);
    res.status(500).json({ error: 'Failed to process Excel file: ' + error.message });
  }
};

// @desc    Send attendance reminders to all students who have not marked attendance today
// @route   POST /api/admin/attendance/remind
// @access  Admin/Warden
exports.sendAttendanceReminders = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = await User.find({ role: 'student' });
    const todayRecords = await Attendance.find({ date: today });
    const markedUserIds = new Set(todayRecords.map(r => r.userId.toString()));

    const unmarkedStudents = totalStudents.filter(s => !markedUserIds.has(s._id.toString()));

    if (unmarkedStudents.length === 0) {
      return res.json({ success: true, count: 0, message: 'All students have marked attendance today.' });
    }

    // Distribute in background
    const Notification = require('../models/Notification');
    const emailService = require('../services/emailService');

    (async () => {
      for (const student of unmarkedStudents) {
        try {
          await Notification.create({
            recipient: student._id,
            sender: req.user._id,
            title: `⏰ Attendance Reminder`,
            message: `Please mark your attendance for today. Make sure you are inside the campus to check in.`,
            type: 'attendance'
          });
          // Only send in-app notification, no emails for reminders
        } catch (err) {
          console.error(`Failed to send attendance reminder to student ${student.name}:`, err);
        }
      }
    })();

    res.json({
      success: true,
      count: unmarkedStudents.length,
      message: `Reminders are being sent to ${unmarkedStudents.length} students.`
    });
  } catch (error) {
    console.error('Send attendance reminders error:', error);
    res.status(500).json({ error: 'Failed to send attendance reminders' });
  }
};



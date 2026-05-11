require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Auto-seed function for empty databases (in-memory or fresh install)
const autoSeed = async () => {
  const User = require('./models/User');
  const Attendance = require('./models/Attendance');
  const Complaint = require('./models/Complaint');
  const Notice = require('./models/Notice');

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users. Skipping seed.`);
    return;
  }

  console.log('Empty database detected. Auto-seeding...');

  // Create admin
  const admin = await User.create({
    name: 'Admin Manager',
    email: 'admin@test.com',
    password: 'password',
    role: 'admin'
  });

  // Create students
  const studentsData = [
    { name: 'Ankit Kumar', email: 'student@test.com', password: 'password', room: 'A-101', phone: '+91-7972302340', parentPhone: '+91-7884521069', address: '123 College Ave, University Town', department: 'Computer Science' },
    { name: 'Kunal Raj', email: 'kunal@test.com', password: 'password', room: 'B-205', phone: '+91-9876543210', department: 'Computer Science' },
    { name: 'Rahul Kumar', email: 'rahul@test.com', password: 'password', room: 'C-110', phone: '+91-9988776655', department: 'AIDS' },
    { name: 'Shikha Kumari', email: 'shikha@test.com', password: 'password', room: 'A-105', phone: '+91-8877665544', department: 'ECE/EX' },
    { name: 'Priya Sharma', email: 'priya@test.com', password: 'password', room: 'B-302', phone: '+91-7766554433', department: 'Civil/Mechanical' },
    { name: 'Amit Singh', email: 'amit@test.com', password: 'password', room: 'D-201', phone: '+91-6655443322', department: 'Pharmacy' },
    { name: 'Neha Gupta', email: 'neha@test.com', password: 'password', room: 'A-203', phone: '+91-5544332211', department: 'Computer Science' },
    { name: 'Vikram Patel', email: 'vikram@test.com', password: 'password', room: 'C-301', phone: '+91-4433221100', department: 'AIDS' },
  ];

  const students = await User.create(studentsData.map(s => ({ ...s, role: 'student' })));

  // Create attendance records (last 30 days)
  const hostelLat = parseFloat(process.env.HOSTEL_LAT) || 28.6139;
  const hostelLng = parseFloat(process.env.HOSTEL_LNG) || 77.2090;
  const attendanceRecords = [];

  for (const student of students) {
    for (let i = 30; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const rand = Math.random();
      if (rand < 0.05) continue;
      const isLate = rand > 0.90;
      const hours = isLate ? 22 + Math.floor(Math.random() * 2) : 19 + Math.floor(Math.random() * 3);
      const mins = Math.floor(Math.random() * 60);
      attendanceRecords.push({
        userId: student._id,
        date: dateStr,
        timestamp: d,
        time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
        latitude: hostelLat + (Math.random() - 0.5) * 0.001,
        longitude: hostelLng + (Math.random() - 0.5) * 0.001,
        distance: Math.random() * 0.15,
        status: isLate ? 'Late' : 'Present',
        location: 'Inside'
      });
    }
  }
  await Attendance.insertMany(attendanceRecords);

  // Create complaints
  await Complaint.create([
    { userId: students[0]._id, category: 'Maintenance', description: 'Fan is not working in room A-101', status: 'Pending' },
    { userId: students[0]._id, category: 'Cleanliness', description: 'Washroom needs cleaning on 2nd floor', status: 'Resolved' },
    { userId: students[1]._id, category: 'Internet/Wi-Fi', description: 'Wi-Fi signal very weak in B block', status: 'In Progress' },
    { userId: students[2]._id, category: 'Electrical', description: 'Power socket not working near bed', status: 'Pending' },
    { userId: students[3]._id, category: 'Mess Food', description: 'Food quality has degraded this week', status: 'Pending' },
    { userId: students[4]._id, category: 'Plumbing', description: 'Water leakage in bathroom', status: 'Resolved' },
  ]);

  console.log(`Seeded: 1 admin, ${students.length} students, ${attendanceRecords.length} attendance records, 6 complaints`);

    // Seed notices
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    await Notice.create([
      {
        title: 'Hostel Curfew Timings Updated',
        content: 'Please note that effective immediately, the hostel curfew time has been updated to 10:00 PM on weekdays and 11:00 PM on weekends. All students must ensure they are inside the hostel premises before the curfew time. Late entries will be recorded and reported to the warden.',
        category: 'General',
        priority: 'High',
        isPinned: true,
        createdBy: admin._id
      },
      {
        title: 'Water Supply Maintenance — Block B',
        content: 'The water supply in Block B will be temporarily disrupted on May 15th from 9:00 AM to 2:00 PM due to scheduled pipeline maintenance. Students are advised to store sufficient water beforehand. We apologize for the inconvenience.',
        category: 'Maintenance',
        priority: 'Medium',
        isPinned: false,
        expiresAt: futureDate,
        createdBy: admin._id
      },
      {
        title: 'Annual Cultural Fest — Participate Now!',
        content: 'The Annual Cultural Fest "Utsav 2026" is scheduled for May 20-22. Events include dance, music, drama, and art competitions. Registration is open until May 18th. Visit the notice board near the mess hall for registration forms or contact your floor representative.',
        category: 'Event',
        priority: 'Medium',
        isPinned: true,
        expiresAt: futureDate,
        createdBy: admin._id
      },
      {
        title: '🚨 Fire Drill Scheduled — Mandatory Attendance',
        content: 'A fire safety drill will be conducted on May 14th at 4:00 PM. All residents MUST participate. Assembly point: Main ground near Gate 2. Floor wardens will guide evacuation. This is mandatory for all hostel residents without exception.',
        category: 'Emergency',
        priority: 'Urgent',
        isPinned: true,
        createdBy: admin._id
      },
      {
        title: 'Semester Exam Schedule Released',
        content: 'The end-semester examination schedule for May-June 2026 has been released. Students can check their individual timetables on the university portal. Exam hall allocations will be shared 3 days before the first exam. Contact your department HOD for any clashes.',
        category: 'Academic',
        priority: 'High',
        isPinned: false,
        createdBy: admin._id
      },
      {
        title: 'Wi-Fi Upgrade Notice',
        content: 'We are upgrading the hostel Wi-Fi infrastructure to support higher speeds. The new system will provide up to 100 Mbps per user. During the transition period (May 12-13), intermittent connectivity issues may occur. Thank you for your patience.',
        category: 'General',
        priority: 'Low',
        isPinned: false,
        createdBy: admin._id
      }
    ]);

    console.log('Seeded: 6 notices');
  console.log('Admin: admin@test.com / password');
  console.log('Student: student@test.com / password');
};

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();
  await autoSeed();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

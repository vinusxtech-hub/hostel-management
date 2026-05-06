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

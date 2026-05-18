require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Complaint = require('./models/Complaint');

const seedDB = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Complaint.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'Admin Manager',
      email: 'admin@test.com',
      password: 'password',
      role: 'admin'
    });
    console.log('Admin created:', admin.email);

    await User.create([
      {
        name: 'Rajesh Sharma',
        email: 'warden.boys@test.com',
        password: 'password',
        role: 'warden',
        hostelSection: 'boys',
        phone: '+91-9876000111'
      },
      {
        name: 'Kavita Singh',
        email: 'warden.girls@test.com',
        password: 'password',
        role: 'warden',
        hostelSection: 'girls',
        phone: '+91-9876000222'
      }
    ]);
    console.log('Wardens created: warden.boys@test.com, warden.girls@test.com');

    // Create students
    const studentsData = [
      { name: 'Ankit Kumar', email: 'student@test.com', password: 'password', hostelSection: 'boys', room: 'A-101', phone: '+91-7972302340', parentPhone: '+91-7884521069', address: '123 College Ave, University Town', department: 'Computer Science' },
      { name: 'Kunal Raj', email: 'kunal@test.com', password: 'password', hostelSection: 'boys', room: 'B-205', phone: '+91-9876543210', department: 'Computer Science' },
      { name: 'Rahul Kumar', email: 'rahul@test.com', password: 'password', hostelSection: 'boys', room: 'C-110', phone: '+91-9988776655', department: 'AIDS' },
      { name: 'Shikha Kumari', email: 'shikha@test.com', password: 'password', hostelSection: 'girls', room: 'A-105', phone: '+91-8877665544', department: 'ECE/EX' },
      { name: 'Priya Sharma', email: 'priya@test.com', password: 'password', hostelSection: 'girls', room: 'B-302', phone: '+91-7766554433', department: 'Civil/Mechanical' },
      { name: 'Amit Singh', email: 'amit@test.com', password: 'password', hostelSection: 'boys', room: 'D-201', phone: '+91-6655443322', department: 'Pharmacy' },
      { name: 'Neha Gupta', email: 'neha@test.com', password: 'password', hostelSection: 'girls', room: 'A-203', phone: '+91-5544332211', department: 'Computer Science' },
      { name: 'Vikram Patel', email: 'vikram@test.com', password: 'password', hostelSection: 'boys', room: 'C-301', phone: '+91-4433221100', department: 'AIDS' },
    ];

    const students = await User.create(studentsData.map(s => ({ ...s, role: 'student' })));
    console.log(`${students.length} students created`);

    // Create attendance records (last 30 days)
    const attendanceRecords = [];
    const hostelLat = parseFloat(process.env.HOSTEL_LAT) || 28.6139;
    const hostelLng = parseFloat(process.env.HOSTEL_LNG) || 77.2090;

    for (const student of students) {
      for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Random attendance (85% present, 10% late, 5% absent)
        const rand = Math.random();
        if (rand < 0.05) continue; // Skip = absent for that day

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
    console.log(`${attendanceRecords.length} attendance records created`);

    // Create complaints
    const complaintsData = [
      { userId: students[0]._id, category: 'Maintenance', description: 'Fan is not working in room A-101', status: 'Pending' },
      { userId: students[0]._id, category: 'Cleanliness', description: 'Washroom needs cleaning on 2nd floor', status: 'Resolved' },
      { userId: students[1]._id, category: 'Internet/Wi-Fi', description: 'Wi-Fi signal very weak in B block', status: 'In Progress' },
      { userId: students[2]._id, category: 'Electrical', description: 'Power socket not working near bed', status: 'Pending' },
      { userId: students[3]._id, category: 'Mess Food', description: 'Food quality has degraded this week', status: 'Pending' },
      { userId: students[4]._id, category: 'Plumbing', description: 'Water leakage in bathroom', status: 'Resolved' },
    ];

    await Complaint.create(complaintsData);
    console.log(`${complaintsData.length} complaints created`);

    console.log('\n--- Seed Complete ---');
    console.log('Admin login: admin@test.com / password');
    console.log('Boys warden login: warden.boys@test.com / password');
    console.log('Girls warden login: warden.girls@test.com / password');
    console.log('Student login: student@test.com / password');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDB();

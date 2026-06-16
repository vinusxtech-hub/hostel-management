const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Resolution = require('./models/Resolution');

const seedDB = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Resolution.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'Admin Manager',
      email: 'admin@test.com',
      password: 'password',
      role: 'admin'
    });
    console.log('Admin created:', admin.email);

    console.log('\n--- Seed Complete ---');
    console.log('Admin login: admin@test.com / password');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDB();

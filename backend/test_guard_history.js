const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./src/models/User');
const LeaveRequest = require('./src/models/LeaveRequest');

const test = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // 1. Get or create a guard
    let guard = await User.findOne({ role: 'guard' });
    if (!guard) {
      console.log('No guard found. Creating temporary guard...');
      guard = await User.create({
        name: 'Test Guard',
        email: 'test.guard@example.com',
        password: 'password123',
        role: 'guard'
      });
    }
    console.log(`Guard: ${guard.name} (${guard.email})`);

    // 2. Get or create a student in a specific year
    let student = await User.findOne({ email: 'test.student.history@example.com' });
    if (student) {
      await User.deleteOne({ _id: student._id });
    }
    console.log('Creating test student in 3rd Year...');
    student = await User.create({
      name: 'Test History Student',
      email: 'test.student.history@example.com',
      password: 'password123',
      role: 'student',
      year: '3rd Year',
      hostelSection: 'boys',
      building: 'A',
      room: 'A-303',
      department: 'CSE'
    });
    console.log(`Student year is: "${student.year}"`);

    // 3. Create a leave request scanned by this guard
    console.log('Creating a leave request and marking it as scanned by this guard...');
    const leave = await LeaveRequest.create({
      studentId: student._id,
      reason: 'Home Visit for Festival',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // tomorrow
      status: 'Approved',
      approvedBy: guard._id, // mock approval
      approvedAt: new Date(),
      scannedBy: guard._id,
      scannedAt: new Date()
    });
    console.log(`Leave Request created: ${leave._id}`);

    // 4. Generate Guard Token
    const token = jwt.sign({ id: guard._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // 5. Query /api/guard/history
    const url = 'http://localhost:5000/api/guard/history';
    console.log(`Fetching guard history from ${url}...`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    
    // 6. Validate results
    console.log('Response Items Count:', data.length);
    const targetScan = data.find(item => item.id === String(leave._id));
    if (targetScan) {
      console.log('--- FOUND SCANNED RECORD ---');
      console.log('Student Name:', targetScan.studentName);
      console.log('Student Year:', targetScan.studentYear);
      console.log('Reason:', targetScan.reason);
      console.log('Scanned At:', targetScan.scannedAt);
      
      if (targetScan.studentYear === '3rd Year') {
        console.log('✅ TEST PASSED: Student year matches and history is correctly retrieved!');
      } else {
        console.error('❌ TEST FAILED: Student year did not match, found:', targetScan.studentYear);
      }
    } else {
      console.error('❌ TEST FAILED: Newly scanned leave request not found in history response.');
    }

    // Cleanup test data
    await LeaveRequest.deleteOne({ _id: leave._id });
    await User.deleteOne({ _id: student._id });
    console.log('Cleanup completed.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during verification test:', err);
  }
};

test();

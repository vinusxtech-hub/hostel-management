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

    // 1. Cleanup existing test accounts/records
    await User.deleteMany({
      email: {
        $in: [
          'test.admin.a@example.com',
          'test.admin.b@example.com',
          'test.warden.w@example.com',
          'test.student.s@example.com',
          'test.student.s2@example.com',
          'test.guard.g@example.com'
        ]
      }
    });
    console.log('Cleaned up previous test users.');

    // 2. Create Admin A & Admin B
    const adminA = await User.create({
      name: 'Admin A',
      email: 'test.admin.a@example.com',
      password: 'password123',
      role: 'admin'
    });
    const adminB = await User.create({
      name: 'Admin B',
      email: 'test.admin.b@example.com',
      password: 'password123',
      role: 'admin'
    });

    // 3. Create Warden W (created by Admin A, manages 'boys' section)
    const wardenW = await User.create({
      name: 'Warden W',
      email: 'test.warden.w@example.com',
      password: 'password123',
      role: 'warden',
      hostelSection: 'boys',
      building: 'A',
      createdBy: adminA._id
    });

    // 4. Create Student S (created by Warden W, section 'boys')
    const studentS = await User.create({
      name: 'Student S Boys',
      email: 'test.student.s@example.com',
      password: 'password123',
      role: 'student',
      hostelSection: 'boys',
      building: 'A',
      room: 'A-101',
      year: '1st Year',
      createdBy: wardenW._id
    });

    // 5. Create Student S2 (created by Admin A, section 'girls')
    const studentS2 = await User.create({
      name: 'Student S2 Girls',
      email: 'test.student.s2@example.com',
      password: 'password123',
      role: 'student',
      hostelSection: 'girls',
      building: 'B',
      room: 'B-101',
      year: '2nd Year',
      createdBy: adminA._id
    });

    // 6. Create Guard
    const guardG = await User.create({
      name: 'Guard G',
      email: 'test.guard.g@example.com',
      password: 'password123',
      role: 'guard'
    });

    // 7. Create Scanned Leave Requests
    const leaveS = await LeaveRequest.create({
      studentId: studentS._id,
      reason: 'Weekend Outing',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      status: 'Approved',
      approvedBy: wardenW._id,
      approvedAt: new Date(),
      scannedBy: guardG._id,
      scannedAt: new Date()
    });

    const leaveS2 = await LeaveRequest.create({
      studentId: studentS2._id,
      reason: 'Home Visit',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      status: 'Approved',
      approvedBy: adminA._id,
      approvedAt: new Date(),
      scannedBy: guardG._id,
      scannedAt: new Date()
    });

    console.log('Test data setup completed.');

    // Helper to generate token
    const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const adminAToken = tokenFor(adminA);
    const adminBToken = tokenFor(adminB);
    const wardenWToken = tokenFor(wardenW);

    let failed = false;

    // --- TEST 1: Admin A visibility ---
    console.log('\n--- Running Test 1: Admin A view wardens & students ---');
    const resWardensA = await fetch('http://localhost:5000/api/admin/wardens', {
      headers: { 'Authorization': `Bearer ${adminAToken}` }
    });
    const wardensA = await resWardensA.json();
    const foundWardenA = wardensA.some(w => w.id === String(wardenW._id));
    console.log('Admin A wardens count:', wardensA.length);
    if (foundWardenA) {
      console.log('✅ PASS: Admin A sees Warden W.');
    } else {
      console.error('❌ FAIL: Admin A does not see Warden W.');
      failed = true;
    }

    const resStudentsA = await fetch('http://localhost:5000/api/admin/students', {
      headers: { 'Authorization': `Bearer ${adminAToken}` }
    });
    const studentsA = await resStudentsA.json();
    const foundSA = studentsA.some(s => s.id === String(studentS._id));
    const foundS2A = studentsA.some(s => s.id === String(studentS2._id));
    console.log('Admin A students count:', studentsA.length);
    if (foundSA && foundS2A) {
      console.log('✅ PASS: Admin A sees Student S and Student S2.');
    } else {
      console.error('❌ FAIL: Admin A misses students. S:', foundSA, 'S2:', foundS2A);
      failed = true;
    }

    // --- TEST 2: Admin B Creator Isolation ---
    console.log('\n--- Running Test 2: Admin B Creator Isolation ---');
    const resWardensB = await fetch('http://localhost:5000/api/admin/wardens', {
      headers: { 'Authorization': `Bearer ${adminBToken}` }
    });
    const wardensB = await resWardensB.json();
    const foundWardenB = wardensB.some(w => w.id === String(wardenW._id));
    console.log('Admin B wardens count:', wardensB.length);
    if (!foundWardenB) {
      console.log('✅ PASS: Admin B does NOT see Warden W.');
    } else {
      console.error('❌ FAIL: Admin B sees Warden W (Creator isolation broken).');
      failed = true;
    }

    const resStudentsB = await fetch('http://localhost:5000/api/admin/students', {
      headers: { 'Authorization': `Bearer ${adminBToken}` }
    });
    const studentsB = await resStudentsB.json();
    const foundSB = studentsB.some(s => s.id === String(studentS._id));
    const foundS2B = studentsB.some(s => s.id === String(studentS2._id));
    console.log('Admin B students count:', studentsB.length);
    if (!foundSB && !foundS2B) {
      console.log('✅ PASS: Admin B does NOT see Student S or Student S2.');
    } else {
      console.error('❌ FAIL: Admin B sees students. S:', foundSB, 'S2:', foundS2B);
      failed = true;
    }

    // --- TEST 3: Warden Gender Scoping ---
    console.log('\n--- Running Test 3: Warden Gender Scoping ---');
    const resStudentsW = await fetch('http://localhost:5000/api/warden/students', {
      headers: { 'Authorization': `Bearer ${wardenWToken}` }
    });
    const studentsW = await resStudentsW.json();
    const foundSW = studentsW.some(s => s.id === String(studentS._id));
    const foundS2W = studentsW.some(s => s.id === String(studentS2._id));
    console.log('Warden W students count:', studentsW.length);
    if (foundSW && !foundS2W) {
      console.log('✅ PASS: Warden W (Boys) sees Student S (Boys) but NOT Student S2 (Girls).');
    } else {
      console.error('❌ FAIL: Warden W scoping incorrect. S:', foundSW, 'S2:', foundS2W);
      failed = true;
    }

    // --- TEST 4: Central Scan History Scoping ---
    console.log('\n--- Running Test 4: Scan History Scoping ---');
    // Admin A Scan History (should see all scans)
    const resScanA = await fetch('http://localhost:5000/api/admin/scan-history', {
      headers: { 'Authorization': `Bearer ${adminAToken}` }
    });
    const scansA = await resScanA.json();
    const foundScanSA = scansA.some(s => s.id === String(leaveS._id));
    const foundScanS2A = scansA.some(s => s.id === String(leaveS2._id));
    if (foundScanSA && foundScanS2A) {
      console.log('✅ PASS: Admin A sees all scan history (Student S & Student S2).');
    } else {
      console.error('❌ FAIL: Admin A scan history missing records.');
      failed = true;
    }

    // Warden W Scan History (should only see Student S's scan since Student S is 'boys')
    const resScanW = await fetch('http://localhost:5000/api/warden/scan-history', {
      headers: { 'Authorization': `Bearer ${wardenWToken}` }
    });
    const scansW = await resScanW.json();
    const foundScanSW = scansW.some(s => s.id === String(leaveS._id));
    const foundScanS2W = scansW.some(s => s.id === String(leaveS2._id));
    if (foundScanSW && !foundScanS2W) {
      console.log('✅ PASS: Warden W (Boys) only sees scan history for Student S (Boys) and NOT Student S2 (Girls).');
    } else {
      console.error('❌ FAIL: Warden W scan history scoping broken. SW:', foundScanSW, 'S2W:', foundScanS2W);
      failed = true;
    }

    // --- Cleanup test data ---
    console.log('\nCleaning up test data...');
    await LeaveRequest.deleteMany({ _id: { $in: [leaveS._id, leaveS2._id] } });
    await User.deleteMany({
      _id: { $in: [adminA._id, adminB._id, wardenW._id, studentS._id, studentS2._id, guardG._id] }
    });
    console.log('Cleanup completed.');

    await mongoose.disconnect();

    if (failed) {
      console.error('\n❌ SOME TESTS FAILED.');
      process.exit(1);
    } else {
      console.log('\n✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error during integration tests:', err);
    process.exit(1);
  }
};

test();

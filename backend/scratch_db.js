const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const test = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected to DB successfully!');
    
    // Find all users
    const users = await User.find({});
    console.log('All Users in DB:');
    users.forEach(u => {
      console.log(`- ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Section: ${u.hostelSection || 'N/A'}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};
test();

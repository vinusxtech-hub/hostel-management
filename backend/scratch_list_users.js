const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./src/models/User');

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const users = await User.find({}, 'name email role hostelSection password').select('+password');
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Section: ${u.hostelSection || 'none'}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const test = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel';
    await mongoose.connect(uri);
    
    const email = 'sambhavlmgroup@gmail.com';
    const password = 'password123';
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found!');
    } else {
      const isMatch = await user.comparePassword(password);
      console.log(`Password comparison for ${email} with "${password}":`, isMatch);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};
test();

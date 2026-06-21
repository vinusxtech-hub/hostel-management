const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const reset = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected to DB successfully!');
    
    const email = 'sambhavlmgroup@gmail.com';
    const newPassword = 'password123';
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} not found!`);
    } else {
      user.password = newPassword;
      await user.save();
      console.log(`Successfully updated password for ${email} to "${newPassword}"`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};
reset();

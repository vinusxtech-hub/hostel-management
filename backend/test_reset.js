const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const test = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel';
    await mongoose.connect(uri);
    console.log('Connected to DB successfully!');

    // Find our test user admin@test.com
    const user = await User.findOne({ email: 'admin@test.com' }).select('+password');
    if (!user) {
      console.log('User admin@test.com not found!');
      await mongoose.disconnect();
      return;
    }

    console.log('Original hashed password in DB:', user.password);

    // Set new password (e.g. 'newpassword123')
    const newPlaintext = 'newpassword123';
    user.password = newPlaintext;
    
    console.log('Is password modified before save?', user.isModified('password'));
    await user.save();
    console.log('Saved successfully!');

    // Fetch user fresh from DB to check new hash
    const freshUser = await User.findOne({ email: 'admin@test.com' }).select('+password');
    console.log('New hashed password in DB:', freshUser.password);

    const isMatch = await freshUser.comparePassword(newPlaintext);
    console.log('Does comparePassword match new plaintext?', isMatch);

    // Let's restore the original password ('password') so we don't break their login
    freshUser.password = 'password';
    await freshUser.save();
    console.log('Restored original password successfully.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};
test();

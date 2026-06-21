const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const checkWarden = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    const email = 'sambhavmehra07@gmail.com';
    const passwordAttempt = 'GCxxRkW7W!';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`User ${email} NOT found in database!`);
      
      // Let's print all users to see who is actually in the DB
      const allUsers = await User.find({});
      console.log('\nAll users in DB currently:');
      allUsers.forEach(u => {
        console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
      });
    } else {
      console.log('User found:');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Hashed Password in DB: ${user.password}`);
      
      const isMatch = await user.comparePassword(passwordAttempt);
      console.log(`Does password "${passwordAttempt}" match? ${isMatch}`);
      
      // Let's also check if the comparePassword works or has issues
      const bcrypt = require('bcryptjs');
      const directMatch = await bcrypt.compare(passwordAttempt, user.password);
      console.log(`Direct bcrypt compare: ${directMatch}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkWarden();

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const createAdmin = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('Error: MONGO_URI is not defined in the environment variables.');
      process.exit(1);
    }
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected to DB successfully.');

    const adminEmail = 'sambhav@admin.com';
    const adminPassword = 'sambhav';
    
    // Check if user already exists
    let user = await User.findOne({ email: adminEmail });
    if (user) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      console.log('Updating password to: ' + adminPassword);
      user.password = adminPassword;
      user.role = 'admin';
      await user.save();
      console.log('Admin user updated successfully.');
    } else {
      user = await User.create({
        name: 'Sambhav Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log(`Successfully created new admin user:`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password: ${adminPassword}`);
    }

    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();

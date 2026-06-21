const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const test = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Find any admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found in database!');
      await mongoose.disconnect();
      return;
    }
    console.log(`Found admin user: ${admin.name} (${admin.email})`);

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
    console.log('Generated local JWT token.');

    const url = 'http://localhost:5000/api/admin/guards';
    console.log(`Sending GET request to ${url} with Authorization header...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    const data = await response.json().catch(() => ({}));
    console.log('Response Body:', JSON.stringify(data, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during test:', err);
  }
};

test();

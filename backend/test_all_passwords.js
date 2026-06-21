const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'sambhavmehra07@gmail.com' }).select('+password');
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    console.log('User Hash:', user.password);

    const testPassword = async (pwd) => {
      const match = await bcrypt.compare(pwd, user.password);
      console.log(`Password: "${pwd}" | Match: ${match}`);
    };

    await testPassword('GCxxRkW7W!');
    await testPassword('vnEaaOJNW!');
    await testPassword('dHHTDo5RW!');
    await testPassword('sambhav');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};
check();

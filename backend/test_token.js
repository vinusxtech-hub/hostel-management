const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('./src/models/User');

const test = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel';
    await mongoose.connect(uri);
    console.log('Connected to DB successfully!');

    // Find a test user (e.g. admin@test.com)
    const user = await User.findOne({ email: 'admin@test.com' }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      console.log('User admin@test.com not found!');
      await mongoose.disconnect();
      return;
    }

    // Generate token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.log('\nToken generated:', resetToken);
    console.log('Hashed token in memory:', user.resetPasswordToken);
    console.log('Expires in memory:', user.resetPasswordExpires);

    // Let's query from DB using the same logic as the resetPassword controller
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    console.log('Hashed token for query:', hashedToken);
    console.log('Current Date (new Date()):', new Date());

    const foundUser = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (foundUser) {
      console.log('SUCCESS: User was found in DB!');
      console.log('Found User Name:', foundUser.name);
      console.log('Found User Expires:', foundUser.resetPasswordExpires);
    } else {
      console.log('FAILURE: User was NOT found in DB!');
      
      // Let's find without date condition to see if it is a token mismatch or date mismatch
      const foundUserWithoutDate = await User.findOne({ resetPasswordToken: hashedToken });
      if (foundUserWithoutDate) {
        console.log('Token matches, but Date check failed!');
        console.log('DB Expires:', foundUserWithoutDate.resetPasswordExpires);
      } else {
        console.log('Token mismatch! The token in DB is different.');
        
        // Fetch current user from DB to see what is stored
        const freshUser = await User.findOne({ email: 'admin@test.com' }).select('+resetPasswordToken +resetPasswordExpires');
        console.log('Stored resetPasswordToken:', freshUser.resetPasswordToken);
        console.log('Stored resetPasswordExpires:', freshUser.resetPasswordExpires);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};
test();

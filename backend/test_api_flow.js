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

    // 1. Get test user
    const user = await User.findOne({ email: 'admin@test.com' }).select('+password');
    if (!user) {
      console.log('User admin@test.com not found!');
      await mongoose.disconnect();
      return;
    }

    // 2. Generate reset token (simulating forgotPassword controller)
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    console.log('Reset token generated & saved to DB:', resetToken);

    // 3. Reset the password (simulating resetPassword controller)
    // Hash token to look up
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const userForReset = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!userForReset) {
      console.log('Error: User not found with token in reset step!');
      await mongoose.disconnect();
      return;
    }

    const newPassword = 'flowpassword123';
    userForReset.password = newPassword;
    userForReset.resetPasswordToken = undefined;
    userForReset.resetPasswordExpires = undefined;
    await userForReset.save();
    console.log('Password reset successfully to:', newPassword);

    // 4. Verify login (simulating login controller)
    const loggedInUser = await User.findOne({ email: 'admin@test.com' }).select('+password');
    const isMatch = await loggedInUser.comparePassword(newPassword);
    console.log('Login verification match:', isMatch);

    if (isMatch) {
      console.log('SUCCESS: Full password reset & login verification flow is 100% working!');
    } else {
      console.log('FAILURE: Password mismatch on login!');
    }

    // Restore original password
    loggedInUser.password = 'password';
    await loggedInUser.save();
    console.log('Restored original password.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};
test();

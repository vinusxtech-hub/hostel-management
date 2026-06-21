const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeHostelSection = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['boys', 'boy', 'male', 'm'].includes(normalized)) return 'boys';
  if (['girls', 'girl', 'female', 'f'].includes(normalized)) return 'girls';
  return '';
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Format user response (strip sensitive fields)
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  hostelSection: user.hostelSection,
  room: user.room,
  phone: user.phone,
  parentPhone: user.parentPhone,
  address: user.address,
  department: user.department
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, room, phone, department, hostelSection } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create user (role defaults to 'student')
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      hostelSection: normalizeHostelSection(hostelSection),
      room: room || '',
      phone: phone || '',
      department: department || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUser(user)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AuthLogin] Login attempt for email: "${email}"`);
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.json({
        message: 'If an account exists for this email, a password reset link has been prepared.'
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'If an account exists for this email, a password reset link has been prepared.',
      previewToken: resetToken,
      expiresInMinutes: 15
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while requesting password reset' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Please provide a new password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successful. You can now sign in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while resetting password' });
  }
};

// @desc    Update profile (name, email, phone, address, department, password) — works for all roles
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, parentPhone, address, department, room,
            currentPassword, newPassword, confirmNewPassword } = req.body;

    // Fetch user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    let passwordChanged = false;

    // --- Handle password change ---
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: 'New passwords do not match' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      user.password = newPassword; // Will be hashed by pre-save hook
      passwordChanged = true;
    }

    // --- Handle email change ---
    const currentPersonalEmail = user.personalEmail || user.email;
    if (email && email.toLowerCase().trim() !== currentPersonalEmail) {
      const normalizedNewEmail = email.toLowerCase().trim();
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(normalizedNewEmail)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      const existing = await User.findOne({
        $or: [{ email: normalizedNewEmail }, { personalEmail: normalizedNewEmail }]
      });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(400).json({ error: 'This email is already in use by another account' });
      }
      user.personalEmail = normalizedNewEmail;
    }

    // --- Handle allowed profile fields ---
    if (name !== undefined && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (parentPhone !== undefined) user.parentPhone = parentPhone.trim();
    if (address !== undefined) user.address = address.trim();
    if (department !== undefined) user.department = department.trim();
    if (room !== undefined) user.room = room.trim();

    await user.save();

    // Send password-changed notification email
    if (passwordChanged) {
      const emailService = require('../services/emailService');
      emailService.sendPasswordChangedEmail(user.email, user.name).catch(err => {
        console.error(`Password change notification failed for ${user.email}:`, err.message);
      });
    }

    res.json({
      message: passwordChanged ? 'Profile and password updated successfully' : 'Profile updated successfully',
      user: formatUser(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};


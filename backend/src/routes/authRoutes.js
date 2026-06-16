const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// router.post('/register', register); // Disabled - users can only be created by Admin/Warden
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

// Universal profile update — works for all roles (student, warden, guard, admin)
// Supports: name, email, phone, parentPhone, address, department, room, password change
router.put('/profile', protect, updateProfile);

module.exports = router;

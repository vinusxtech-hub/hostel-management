const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const studentController = require('../controllers/studentController');
const settingsController = require('../controllers/settingsController');

// All student routes require authentication
router.use(protect);

router.get('/attendance', studentController.getAttendanceHistory);
router.post('/attendance', studentController.markAttendance);
router.get('/reports', studentController.getReports);
router.get('/complaints', studentController.getComplaints);
router.post('/complaints', studentController.submitComplaint);
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/settings', settingsController.getAttendanceSettings);

module.exports = router;

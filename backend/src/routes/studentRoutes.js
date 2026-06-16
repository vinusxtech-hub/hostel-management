const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const studentController = require('../controllers/studentController');
const settingsController = require('../controllers/settingsController');
const noticeController = require('../controllers/noticeController');
const leaveController = require('../controllers/leaveController');  // Integration: Leave Management System

// All student routes require authentication
router.use(protect);

router.get('/attendance', studentController.getAttendanceHistory);
router.post('/attendance', studentController.markAttendance);
router.get('/reports', studentController.getReports);
router.get('/resolutions', studentController.getResolutions);
router.post('/resolutions', studentController.submitResolution);
// Backward compatibility
router.get('/resolutions', studentController.getResolutions);
router.post('/resolutions', studentController.submitResolution);
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/settings', settingsController.getAttendanceSettings);
router.get('/notices', noticeController.getActiveNotices);

// Leave Management routes
router.post('/leaves', leaveController.createLeaveRequest);
router.get('/leaves', leaveController.getMyLeaves);
router.put('/leaves/:id/cancel', leaveController.cancelLeaveRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

router.get('/stats', adminController.getDashboardStats);
router.get('/students', adminController.getStudents);
router.post('/students', adminController.addStudent);
router.get('/attendance', adminController.getAttendance);
router.get('/reports', adminController.getReports);
router.get('/complaints', adminController.getComplaints);
router.put('/complaints/:id', adminController.updateComplaint);

module.exports = router;

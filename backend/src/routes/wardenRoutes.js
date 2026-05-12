const express = require('express');
const router = express.Router();
const { protect, wardenOnly } = require('../middleware/auth');
const wardenController = require('../controllers/wardenController');
const noticeController = require('../controllers/noticeController');

// All warden routes require authentication + warden role
router.use(protect);
router.use(wardenOnly);

router.get('/stats', wardenController.getDashboardStats);
router.get('/students', wardenController.getStudents);
router.get('/students/:id', wardenController.getStudentDetails);
router.get('/complaints', wardenController.getComplaints);
router.put('/complaints/:id', wardenController.updateComplaint);

// Notice routes (same CRUD as admin)
router.get('/notices', noticeController.getAllNotices);
router.post('/notices', noticeController.createNotice);
router.put('/notices/:id', noticeController.updateNotice);
router.delete('/notices/:id', noticeController.deleteNotice);

module.exports = router;

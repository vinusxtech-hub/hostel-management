const express = require('express');
const router = express.Router();
const { protect, wardenOnly } = require('../middleware/auth');
const wardenController = require('../controllers/wardenController');
const noticeController = require('../controllers/noticeController');
const leaveController = require('../controllers/leaveController');  // Integration: Leave Management System
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// All warden routes require authentication + warden role
router.use(protect);
router.use(wardenOnly);

router.get('/stats', wardenController.getDashboardStats);
router.get('/students', wardenController.getStudents);
router.post('/students', wardenController.addStudent);
router.post('/students/bulk-import', upload.single('file'), wardenController.bulkImportStudents);
router.get('/students/:id', wardenController.getStudentDetails);
router.get('/resolutions', wardenController.getResolutions);
router.put('/resolutions/:id', wardenController.updateResolution);
// Backward compatibility
router.get('/resolutions', wardenController.getResolutions);
router.put('/resolutions/:id', wardenController.updateResolution);

// Leave Management routes
router.get('/leaves', leaveController.getPendingLeaves);
router.get('/leaves/all', leaveController.getAllLeaves);
router.put('/leaves/:id/approve', leaveController.approveLeave);
router.put('/leaves/:id/reject', leaveController.rejectLeave);

// Notice routes (same CRUD as admin)
router.get('/notices', noticeController.getAllNotices);
router.post('/notices', noticeController.createNotice);
router.put('/notices/:id', noticeController.updateNotice);
router.delete('/notices/:id', noticeController.deleteNotice);

module.exports = router;

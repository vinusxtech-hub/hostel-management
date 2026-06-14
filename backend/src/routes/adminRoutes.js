const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const { protect, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const noticeController = require('../controllers/noticeController');

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

router.get('/stats', adminController.getDashboardStats);
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentDetails);
router.post('/students', adminController.addStudent);
router.post('/students/bulk-import', upload.single('file'), adminController.bulkImportStudents);
router.get('/attendance', adminController.getAttendance);
router.get('/reports', adminController.getReports);
router.get('/resolutions', adminController.getResolutions);
router.put('/resolutions/:id', adminController.updateResolution);
// Backward compatibility
router.get('/resolutions', adminController.getResolutions);
router.put('/resolutions/:id', adminController.updateResolution);

// Notice routes
router.get('/notices', noticeController.getAllNotices);
router.post('/notices', noticeController.createNotice);
router.put('/notices/:id', noticeController.updateNotice);
router.delete('/notices/:id', noticeController.deleteNotice);

// Settings routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Warden management routes
router.get('/wardens', adminController.getWardens);
router.get('/wardens/:id', adminController.getWardenDetails);

module.exports = router;

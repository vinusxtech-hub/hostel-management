const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { storeDeviceInfo, getUserDeviceInfo, getAllDeviceInfo } = require('../controllers/deviceController');

// Any authenticated user can store their device info
router.post('/info', protect, storeDeviceInfo);

// Admin can view all device info or per-user device info
router.get('/info', protect, adminOnly, getAllDeviceInfo);
router.get('/info/:userId', protect, adminOnly, getUserDeviceInfo);

module.exports = router;

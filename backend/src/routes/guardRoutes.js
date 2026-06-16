const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const leaveController = require('../controllers/leaveController');

// Guard check middleware (allows guards and admins)
const guardOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'guard' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied — guard only' });
  }
};

// All guard routes require authentication + guard/admin role
router.use(protect);
router.use(guardOnly);

router.post('/verify-qr', leaveController.verifyQrCode);

module.exports = router;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized — user not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized — invalid token' });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied — admin only' });
  }
};

// Warden only middleware
const wardenOnly = (req, res, next) => {
  if (req.user && req.user.role === 'warden') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied — warden only' });
  }
};

module.exports = { protect, adminOnly, wardenOnly };

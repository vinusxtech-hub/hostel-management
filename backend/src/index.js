const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const guardRoutes = require('./routes/guardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/guard', guardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
    dbHost: mongoose.connection.host || 'none',
    dbName: mongoose.connection.name || 'none',
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Auto-seed function for empty databases (in-memory or fresh install)
const autoSeed = async () => {
  const User = require('./models/User');

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users. Skipping seed.`);
    return;
  }

  console.log('Empty database detected. Auto-seeding admin user...');

  // Create admin
  const admin = await User.create({
    name: 'Admin Manager',
    email: 'admin@test.com',
    password: 'password',
    role: 'admin'
  });

  console.log('Seeded admin: admin@test.com / password');
};


// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();
  await autoSeed();

  // Integration: Leave Management System — cleanup expired leaves on startup
  const { cleanupExpiredLeaves } = require('./controllers/leaveController');
  await cleanupExpiredLeaves();

  console.log('Database connected and ready.');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

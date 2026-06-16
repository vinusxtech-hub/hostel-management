const DeviceInfo = require('../models/DeviceInfo');

// @desc    Store device information
// @route   POST /api/device/info
// @access  Private (any authenticated user)
exports.storeDeviceInfo = async (req, res) => {
  try {
    const { deviceModel, deviceType, osName, osVersion } = req.body;

    if (!deviceModel && !deviceType && !osName && !osVersion) {
      return res.status(400).json({ error: 'At least one device field is required' });
    }

    const deviceInfo = await DeviceInfo.create({
      userId: req.user._id,
      deviceModel: deviceModel || 'Unknown',
      deviceType: deviceType || 'Unknown',
      osName: osName || 'Unknown',
      osVersion: osVersion || 'Unknown'
    });

    res.status(201).json({
      message: 'Device info stored successfully',
      deviceInfo: {
        id: deviceInfo._id,
        userId: deviceInfo.userId,
        deviceModel: deviceInfo.deviceModel,
        deviceType: deviceInfo.deviceType,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        createdAt: deviceInfo.createdAt
      }
    });
  } catch (error) {
    console.error('Store device info error:', error);
    res.status(500).json({ error: 'Failed to store device information' });
  }
};

// @desc    Get device info for a user (admin only)
// @route   GET /api/device/info/:userId
// @access  Private (admin)
exports.getUserDeviceInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const devices = await DeviceInfo.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(devices.map(d => ({
      id: d._id,
      deviceModel: d.deviceModel,
      deviceType: d.deviceType,
      osName: d.osName,
      osVersion: d.osVersion,
      createdAt: d.createdAt
    })));
  } catch (error) {
    console.error('Get device info error:', error);
    res.status(500).json({ error: 'Failed to fetch device information' });
  }
};

// @desc    Get all device info entries (admin overview)
// @route   GET /api/device/info
// @access  Private (admin)
exports.getAllDeviceInfo = async (req, res) => {
  try {
    const devices = await DeviceInfo.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(devices.map(d => ({
      id: d._id,
      userId: d.userId?._id,
      userName: d.userId?.name || 'Unknown',
      userEmail: d.userId?.email || '',
      userRole: d.userId?.role || '',
      deviceModel: d.deviceModel,
      deviceType: d.deviceType,
      osName: d.osName,
      osVersion: d.osVersion,
      createdAt: d.createdAt
    })));
  } catch (error) {
    console.error('Get all device info error:', error);
    res.status(500).json({ error: 'Failed to fetch device information' });
  }
};

const Notice = require('../models/Notice');

// ──────────────────────────────────────────────
// ADMIN ENDPOINTS
// ──────────────────────────────────────────────

// @desc    Get all notices (admin view — includes expired)
// @route   GET /api/admin/notices
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('createdBy', 'name email')
      .sort({ isPinned: -1, createdAt: -1 });

    const formatted = notices.map(n => ({
      id: n._id,
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      isPinned: n.isPinned,
      expiresAt: n.expiresAt,
      createdBy: n.createdBy?.name || 'Admin',
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      isExpired: n.expiresAt ? new Date(n.expiresAt) < new Date() : false
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

// @desc    Create a notice
// @route   POST /api/admin/notices
exports.createNotice = async (req, res) => {
  try {
    const { title, content, category, priority, isPinned, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const notice = await Notice.create({
      title,
      content,
      category: category || 'General',
      priority: priority || 'Medium',
      isPinned: isPinned || false,
      expiresAt: expiresAt || null,
      createdBy: req.user._id
    });

    // Create notifications and send emails to all students in the background
    try {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      const emailService = require('../services/emailService');

      const students = await User.find({ role: 'student' });
      
      // Send notices asynchronously
      (async () => {
        for (const student of students) {
          try {
            await Notification.create({
              recipient: student._id,
              sender: req.user._id,
              title: `New Notice: ${notice.title}`,
              message: `A new announcement has been posted under category "${notice.category}".`,
              type: 'notice',
              relatedId: notice._id
            });

            if (student.email) {
              await emailService.sendNoticeEmail(student.email, student.name, notice.title, notice.content);
            }
          } catch (err) {
            console.error(`Failed to distribute notice notification to student:`, err);
          }
        }
      })();
    } catch (notifErr) {
      console.error('Failed to trigger notice notifications:', notifErr);
    }

    res.status(201).json({
      id: notice._id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isPinned: notice.isPinned,
      expiresAt: notice.expiresAt,
      createdBy: req.user.name,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      isExpired: false
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

// @desc    Update a notice
// @route   PUT /api/admin/notices/:id
exports.updateNotice = async (req, res) => {
  try {
    const { title, content, category, priority, isPinned, expiresAt } = req.body;

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, content, category, priority, isPinned, expiresAt },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json({
      id: notice._id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isPinned: notice.isPinned,
      expiresAt: notice.expiresAt,
      createdBy: notice.createdBy?.name || 'Admin',
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      isExpired: notice.expiresAt ? new Date(notice.expiresAt) < new Date() : false
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notice' });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/admin/notices/:id
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notice' });
  }
};

// ──────────────────────────────────────────────
// STUDENT ENDPOINT
// ──────────────────────────────────────────────

// @desc    Get active (non-expired) notices for students
// @route   GET /api/student/notices
exports.getActiveNotices = async (req, res) => {
  try {
    const now = new Date();

    const notices = await Notice.find({
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    })
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 });

    const formatted = notices.map(n => ({
      id: n._id,
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      isPinned: n.isPinned,
      createdBy: n.createdBy?.name || 'Admin',
      createdAt: n.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

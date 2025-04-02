const express = require('express');
const router = express.Router();
const { AdminLog } = require('./clubs');
const { adminAuth } = require('./admin');

// Get admin logs with pagination
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const logs = await AdminLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('admin', 'name email');

    const totalLogs = await AdminLog.countDocuments();
    const totalPages = Math.ceil(totalLogs / limit);

    res.json({
      logs,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// Get user activity
router.get('/user-activity/:type/:id', adminAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let activity;
    if (type === 'student') {
      activity = await AdminLog.find({ 
        targetType: 'student',
        target: id 
      }).sort({ timestamp: -1 });
    } else if (type === 'club') {
      activity = await AdminLog.find({ 
        targetType: 'club',
        target: id 
      }).sort({ timestamp: -1 });
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity' });
  }
});

module.exports = router;
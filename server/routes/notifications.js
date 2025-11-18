const express = require('express');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for the logged-in user (most recent first)
router.get('/', optionalAuth, async (req, res) => {
  try {
    // If no user is authenticated, return empty notifications
    if (!req.user) {
      return res.json({ success: true, data: { notifications: [] } });
    }
    
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('from', 'name avatar username')
      .populate('post', 'content media')
      .limit(50); // Limit to prevent too many notifications
    res.json({ success: true, data: { notifications } });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Mark a notification as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    // Validate notification ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }
    
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Мэдэгдэл олдсонгүй' });
    }
    
    res.json({ success: true, data: { notification } });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    
    // Clean up old notifications (keep only last 100)
    const totalNotifications = await Notification.countDocuments({ user: req.user._id });
    if (totalNotifications > 100) {
      const notificationsToDelete = await Notification.find({ user: req.user._id })
        .sort({ createdAt: 1 })
        .limit(totalNotifications - 100)
        .select('_id');
      
      if (notificationsToDelete.length > 0) {
        await Notification.deleteMany({ 
          _id: { $in: notificationsToDelete.map(n => n._id) } 
        });
      }
    }
    
    res.json({ success: true, message: 'Бүх мэдэгдэл уншсан боллоо' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Мэдэгдэл олдсонгүй' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

module.exports = router; 
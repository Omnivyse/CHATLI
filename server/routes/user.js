const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User routes are working',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/user/privacy-settings
// @desc    Get user privacy settings
// @access  Private
router.get('/privacy-settings', auth, async (req, res) => {
  console.log('GET /privacy-settings called');
  try {
    const user = await User.findById(req.user._id).select('privacySettings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    console.log('Privacy settings found:', user.privacySettings);
    res.json({
      success: true,
      data: user.privacySettings || {}
    });

  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   PUT /api/user/privacy-settings
// @desc    Update user privacy settings
// @access  Private
router.put('/privacy-settings', auth, async (req, res) => {
  console.log('PUT /privacy-settings called with body:', req.body);
  try {
    const {
      isPrivateAccount,
      showProfileInSearch,
      allowMessagesFromStrangers,
      showOnlineStatus,
      showLastSeen,
      allowProfileViews,
      allowPostComments,
      allowEventInvites
    } = req.body;

    const updateData = {};
    
    if (typeof isPrivateAccount === 'boolean') {
      updateData['privacySettings.isPrivateAccount'] = isPrivateAccount;
    }
    if (typeof showProfileInSearch === 'boolean') {
      updateData['privacySettings.showProfileInSearch'] = showProfileInSearch;
    }
    if (typeof allowMessagesFromStrangers === 'boolean') {
      updateData['privacySettings.allowMessagesFromStrangers'] = allowMessagesFromStrangers;
    }
    if (typeof showOnlineStatus === 'boolean') {
      updateData['privacySettings.showOnlineStatus'] = showOnlineStatus;
    }
    if (typeof showLastSeen === 'boolean') {
      updateData['privacySettings.showLastSeen'] = showLastSeen;
    }
    if (typeof allowProfileViews === 'boolean') {
      updateData['privacySettings.allowProfileViews'] = allowProfileViews;
    }
    if (typeof allowPostComments === 'boolean') {
      updateData['privacySettings.allowPostComments'] = allowPostComments;
    }
    if (typeof allowEventInvites === 'boolean') {
      updateData['privacySettings.allowEventInvites'] = allowEventInvites;
    }

    console.log('Update data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('privacySettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    console.log('Updated privacy settings:', user.privacySettings);

    res.json({
      success: true,
      message: 'Нууцлалын тохиргоо амжилттай шинэчлэгдлээ',
      data: user.privacySettings
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

module.exports = router; 
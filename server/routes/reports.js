const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const Report = require('../models/Report');

// Submit a report
router.post('/submit', auth, async (req, res) => {
  try {
    console.log('Report submission request:', {
      body: req.body,
      user: req.user ? { id: req.user.id, email: req.user.email } : 'No user'
    });

    const { category, description, userEmail } = req.body;
    
    if (!category || !description || description.trim().length < 10) {
      console.log('Validation failed:', { category, descriptionLength: description?.length });
      return res.status(400).json({
        success: false,
        message: 'Ангилал болон дэлгэрэнгүй тайлбар шаардлагатай'
      });
    }

    // Validate category against allowed values
    const allowedCategories = ['bug', 'inappropriate_content', 'spam', 'harassment', 'fake_account', 'other'];
    if (!allowedCategories.includes(category)) {
      console.log('Invalid category:', category);
      return res.status(400).json({
        success: false,
        message: 'Буруу ангилал'
      });
    }

    const report = new Report({
      reporterId: req.user.id,
      userName: req.user.name,
      userEmail: userEmail || req.user.email,
      category,
      description: description.trim(),
      priority: category === 'inappropriate_content' ? 'high' : 'normal'
    });

    console.log('Saving report:', {
      reporterId: report.reporterId,
      category: report.category,
      descriptionLength: report.description.length
    });

    await report.save();

    console.log('New report saved successfully:', {
      id: report._id,
      category: report.category,
      user: report.userName
    });

    res.json({
      success: true,
      message: 'Таны мэдээллийг хүлээн авлаа',
      data: {
        reportId: report._id
      }
    });

  } catch (error) {
    console.error('Report submission error:', error);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Мэдээллийн формат буруу байна'
      });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ижил мэдээлэл давхардсан байна'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа'
    });
  }
});

// Get all reports (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    // Add admin check here
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Access denied' });
    // }

    const reports = await Report.find()
      .populate('reporterId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reports
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа'
    });
  }
});

// Update report status (admin only)
router.patch('/:reportId/status', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    ).populate('reporterId', 'username email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Мэдээлэл олдсонгүй'
      });
    }

    res.json({
      success: true,
      message: 'Төлөв шинэчлэгдлээ',
      data: { report }
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа'
    });
  }
});

module.exports = router; 
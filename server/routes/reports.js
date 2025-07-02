const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory storage for now (you should use a database)
const reports = [];

// Submit a report
router.post('/submit', auth, async (req, res) => {
  try {
    const { category, description, userEmail } = req.body;
    
    if (!category || !description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Ангилал болон дэлгэрэнгүй тайлбар шаардлагатай'
      });
    }

    const report = {
      id: Date.now().toString(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: userEmail || req.user.email,
      category,
      description: description.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending', // pending, reviewed, resolved
      priority: category === 'inappropriate_content' ? 'high' : 'normal'
    };

    // Store report (replace with database save)
    reports.push(report);

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification to admins
    // 3. Log the report for monitoring

    console.log('New report received:', {
      id: report.id,
      category: report.category,
      user: report.userName,
      timestamp: report.createdAt
    });

    res.json({
      success: true,
      message: 'Таны мэдээллийг хүлээн авлаа',
      data: {
        reportId: report.id
      }
    });

  } catch (error) {
    console.error('Report submission error:', error);
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

    res.json({
      success: true,
      data: {
        reports: reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

    const report = reports.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Мэдээлэл олдсонгүй'
      });
    }

    report.status = status;
    report.updatedAt = new Date().toISOString();

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
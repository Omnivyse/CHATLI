const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('author', 'name username avatar')
      .populate('joinedUsers', 'name username avatar')
      .populate('likes', 'name username')
      .populate('comments.author', 'name username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа'
    });
  }
});

// Create new event
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, userNumber } = req.body;

    if (!name || !description || !userNumber) {
      return res.status(400).json({
        success: false,
        message: 'Бүх талбарыг бөглөнө үү'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Event-ийн зургийг оруулна уу'
      });
    }

    const userNum = parseInt(userNumber);
    if (userNum < 5) {
      return res.status(400).json({
        success: false,
        message: 'Хамгийн багадаа 5 хүн байх ёстой'
      });
    }

    const event = new Event({
      name: name.trim(),
      description: description.trim(),
      image: req.file.path,
      userNumber: userNum,
      author: req.user._id,
      joinedUsers: [],
      likes: [],
      comments: []
    });

    await event.save();

    // Populate author for response
    await event.populate('author', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Event амжилттай үүслээ',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Event үүсгэхэд алдаа гарлаа'
    });
  }
});

// Join event
router.post('/:eventId/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event олдсонгүй'
      });
    }

    // Check if user is already joined
    if (event.joinedUsers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Та энэ event-д аль хэдийн нэгдсэн байна'
      });
    }

    // Check if event is full
    if (event.joinedUsers.length >= event.userNumber) {
      return res.status(400).json({
        success: false,
        message: 'Event-ийн хүний тоо хязгаарт хүрлээ'
      });
    }

    event.joinedUsers.push(req.user._id);
    await event.save();

    // Populate joined users for response
    await event.populate('joinedUsers', 'name username avatar');

    res.json({
      success: true,
      message: 'Event-д амжилттай нэгдлээ',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Event-д нэгдэхэд алдаа гарлаа'
    });
  }
});

// Like/Unlike event
router.post('/:eventId/like', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event олдсонгүй'
      });
    }

    // Check if user has joined the event
    if (!event.joinedUsers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Event-д нэгдсний дараа лайк хийх боломжтой'
      });
    }

    const isLiked = event.likes.includes(req.user._id);
    
    if (isLiked) {
      // Unlike
      event.likes = event.likes.filter(userId => !userId.equals(req.user._id));
    } else {
      // Like
      event.likes.push(req.user._id);
    }

    await event.save();

    res.json({
      success: true,
      message: isLiked ? 'Лайк хаслаа' : 'Лайк хийгдлээ',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Like event error:', error);
    res.status(500).json({
      success: false,
      message: 'Лайк хийхэд алдаа гарлаа'
    });
  }
});

// Comment on event
router.post('/:eventId/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Сэтгэгдэл бичнэ үү'
      });
    }

    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event олдсонгүй'
      });
    }

    // Check if user has joined the event
    if (!event.joinedUsers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Event-д нэгдсний дараа сэтгэгдэл бичих боломжтой'
      });
    }

    const comment = {
      content: content.trim(),
      author: req.user._id,
      createdAt: new Date()
    };

    event.comments.push(comment);
    await event.save();

    // Populate comment author for response
    await event.populate('comments.author', 'name username avatar');

    res.json({
      success: true,
      message: 'Сэтгэгдэл нэмэгдлээ',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Comment event error:', error);
    res.status(500).json({
      success: false,
      message: 'Сэтгэгдэл бичихэд алдаа гарлаа'
    });
  }
});

// Get event by ID
router.get('/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('author', 'name username avatar')
      .populate('joinedUsers', 'name username avatar')
      .populate('likes', 'name username')
      .populate('comments.author', 'name username avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event олдсонгүй'
      });
    }

    res.json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Event авахад алдаа гарлаа'
    });
  }
});

// Delete event (only by author)
router.delete('/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event олдсонгүй'
      });
    }

    // Check if user is the author
    if (!event.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Event устгах эрх байхгүй'
      });
    }

    await Event.findByIdAndDelete(req.params.eventId);

    res.json({
      success: true,
      message: 'Event устгагдлаа'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Event устгахад алдаа гарлаа'
    });
  }
});

module.exports = router; 
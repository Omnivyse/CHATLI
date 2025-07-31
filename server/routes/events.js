const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
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

// Create new event with image upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, userNumber, isPrivate, password } = req.body;

    if (!name || !description || !userNumber) {
      return res.status(400).json({
        success: false,
        message: 'Бүх талбарыг бөглөнө үү'
      });
    }

    const userNum = parseInt(userNumber);
    if (userNum < 5) {
      return res.status(400).json({
        success: false,
        message: 'Хамгийн багадаа 5 хүн байх ёстой'
      });
    }

    // Validate password for private events
    const isPrivateEvent = isPrivate === 'true' || isPrivate === true;
    if (isPrivateEvent && (!password || password.length !== 4 || !/^\d{4}$/.test(password))) {
      return res.status(400).json({
        success: false,
        message: 'Хувийн event-д 4 оронтой нууц үг оруулна уу'
      });
    }

    // Handle image upload
    let imageUrl = 'https://via.placeholder.com/400x200?text=Event+Image';
    if (req.file) {
      // Use the Cloudinary URL from the uploaded file
      imageUrl = req.file.path;
    }

    const event = new Event({
      name: name.trim(),
      description: description.trim(),
      image: imageUrl,
      userNumber: userNum,
      isPrivate: isPrivateEvent,
      password: isPrivateEvent ? password : null,
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
    const { password } = req.body;
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

    // Check password for private events
    if (event.isPrivate) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Хувийн event-д нууц үг оруулна уу'
        });
      }
      if (password !== event.password) {
        return res.status(400).json({
          success: false,
          message: 'Нууц үг буруу байна'
        });
      }
    }

    // Add user to joined users
    event.joinedUsers.push(req.user._id);
    await event.save();

    // Populate author for response
    await event.populate('author', 'name username avatar');

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

// Leave event
router.post('/:eventId/leave', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event олдсонгүй'
      });
    }

    // Check if user is joined
    if (!event.joinedUsers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Та энэ event-д нэгдээгүй байна'
      });
    }

    // Remove user from joined users
    event.joinedUsers = event.joinedUsers.filter(userId => !userId.equals(req.user._id));
    
    // Also remove user's likes and comments
    event.likes = event.likes.filter(userId => !userId.equals(req.user._id));
    event.comments = event.comments.filter(comment => !comment.author.equals(req.user._id));
    
    await event.save();

    // Populate author for response
    await event.populate('author', 'name username avatar');

    res.json({
      success: true,
      message: 'Event-ээс амжилттай гарлаа',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({
      success: false,
      message: 'Event-ээс гарахад алдаа гарлаа'
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
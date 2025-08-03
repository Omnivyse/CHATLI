const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

// Get event chat messages
router.get('/:eventId/messages', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const event = await Event.findById(eventId)
      .populate('chat')
      .populate('joinedUsers', 'name username avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user has joined the event
    const isJoined = event.joinedUsers.some(user => user._id.toString() === req.user._id.toString());
    if (!isJoined) {
      return res.status(403).json({
        success: false,
        message: 'You must join the event to access the chat'
      });
    }

    if (!event.chat) {
      return res.json({
        success: true,
        data: {
          messages: [],
          hasMore: false
        }
      });
    }

    const skip = (page - 1) * limit;
    const messages = await Message.find({ 
      chat: event.chat._id,
      isDeleted: false 
    })
    .populate('sender', 'name username avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit) + 1);

    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

    res.json({
      success: true,
      data: {
        messages: messagesToReturn.reverse(),
        hasMore
      }
    });
  } catch (error) {
    console.error('Get event chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Send message to event chat
router.post('/:eventId/messages', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const event = await Event.findById(eventId)
      .populate('chat')
      .populate('joinedUsers', 'name username avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user has joined the event
    const isJoined = event.joinedUsers.some(user => user._id.toString() === req.user._id.toString());
    if (!isJoined) {
      return res.status(403).json({
        success: false,
        message: 'You must join the event to send messages'
      });
    }

    // Create chat if it doesn't exist
    let chat = event.chat;
    if (!chat) {
      chat = new Chat({
        type: 'group',
        name: `${event.name} Chat`,
        participants: event.joinedUsers.map(user => user._id),
        admins: [event.author]
      });
      await chat.save();

      // Update event with chat reference
      event.chat = chat._id;
      await event.save();
    }

    // Create message
    const message = new Message({
      chat: chat._id,
      sender: req.user._id,
      type,
      content: {
        text: content.trim()
      }
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = {
      id: message._id,
      text: content.trim(),
      sender: req.user._id,
      timestamp: new Date(),
      isRead: false
    };

    // Update unread counts for all participants except sender
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        chat.updateUnreadCount(participantId, true);
      }
    });

    await chat.save();

    // Populate message for response
    await message.populate('sender', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message
      }
    });
  } catch (error) {
    console.error('Send event chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark event chat messages as read
router.put('/:eventId/messages/read', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('chat');
    if (!event || !event.chat) {
      return res.status(404).json({
        success: false,
        message: 'Event or chat not found'
      });
    }

    // Check if user has joined the event
    const isJoined = event.joinedUsers.some(user => user._id.toString() === req.user._id.toString());
    if (!isJoined) {
      return res.status(403).json({
        success: false,
        message: 'You must join the event to access the chat'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      { 
        chat: event.chat._id,
        'readBy.user': { $ne: req.user._id },
        isDeleted: false
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    // Reset unread count for this user
    event.chat.updateUnreadCount(req.user._id, false);
    await event.chat.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark event chat messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 
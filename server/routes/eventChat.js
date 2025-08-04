const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

    console.log('Send message request:', { eventId, content, type, userId: req.user._id });

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findById(eventId)
      .populate('chat')
      .populate('joinedUsers', 'name username avatar');

    console.log('Found event:', event ? { 
      id: event._id, 
      name: event.name, 
      joinedUsers: event.joinedUsers?.length,
      hasChat: !!event.chat 
    } : 'Not found');

    if (!event) {
      console.log('Event not found for ID:', eventId);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user has joined the event
    const isJoined = event.joinedUsers.some(user => user._id.toString() === req.user._id.toString());
    console.log('Join check:', { 
      userId: req.user._id, 
      joinedUsers: event.joinedUsers.map(u => u._id), 
      isJoined 
    });

    // Check if user is event creator
    const isEventCreator = event.author.toString() === req.user._id.toString();
    console.log('Creator check:', { 
      eventAuthor: event.author, 
      userId: req.user._id, 
      isEventCreator 
    });

    // Allow if joined OR if event creator
    if (!isJoined && !isEventCreator) {
      return res.status(403).json({
        success: false,
        message: 'You must join the event to send messages'
      });
    }

    // Create chat if it doesn't exist
    let chat = event.chat;
    if (!chat) {
      console.log('Creating new chat for event');
      try {
        chat = new Chat({
          type: 'group',
          name: `${event.name} Chat`,
          image: event.image, // Use event image as chat image
          participants: event.joinedUsers.map(user => user._id),
          admins: [event.author]
        });
        await chat.save();
        console.log('Chat created successfully:', chat._id);

        // Update event with chat reference
        event.chat = chat._id;
        await event.save();
        console.log('Chat linked to event successfully');
      } catch (chatError) {
        console.error('Error creating chat:', chatError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create event chat'
        });
      }
    }

    // Create message
    let message;
    try {
      message = new Message({
        chat: chat._id,
        sender: req.user._id,
        type,
        content: {
          text: content.trim()
        }
      });

      await message.save();
      console.log('Message saved:', message._id);
    } catch (messageError) {
      console.error('Error creating message:', messageError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create message'
      });
    }

    // Update chat's last message
    chat.lastMessage = {
      id: message._id,
      text: content.trim(),
      sender: req.user._id,
      timestamp: new Date(),
      isRead: false
    };

    // Update unread counts for all participants except sender
    try {
      const updatePromises = chat.participants.map(participantId => {
        if (participantId.toString() !== req.user._id.toString()) {
          return chat.updateUnreadCount(participantId, true);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      console.log('Unread counts updated successfully');
    } catch (unreadError) {
      console.error('Error updating unread counts:', unreadError);
      // Don't fail the entire request for unread count errors
    }

    // Save chat updates
    try {
      await chat.save();
      console.log('Chat updated successfully');
    } catch (chatSaveError) {
      console.error('Error saving chat:', chatSaveError);
      // Don't fail the entire request for chat save errors
    }

    // Populate message for response
    try {
      await message.populate('sender', 'name username avatar');
    } catch (populateError) {
      console.error('Error populating message:', populateError);
      // Don't fail the entire request for populate errors
    }

    console.log('Message sent successfully');
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
    await event.chat.updateUnreadCount(req.user._id, false);

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
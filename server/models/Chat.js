const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    required: function() { return this.type === 'group'; },
    trim: true,
    maxlength: [100, 'Группийн нэр 100 тэмдэгтээс бага байх ёстой']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    text: {
      type: String,
      maxlength: [500, 'Мессеж 500 тэмдэгтээс бага байх ёстой']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    readReceipts: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ participants: 1, type: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for getting unread count for a specific user
chatSchema.virtual('getUnreadCount').get(function(userId) {
  const unreadData = this.unreadCounts.find(item => 
    item.user.toString() === userId.toString()
  );
  return unreadData ? unreadData.count : 0;
});

// Method to update unread count
chatSchema.methods.updateUnreadCount = function(userId, increment = true) {
  const unreadIndex = this.unreadCounts.findIndex(item => 
    item.user.toString() === userId.toString()
  );
  
  if (unreadIndex > -1) {
    this.unreadCounts[unreadIndex].count += increment ? 1 : -1;
    if (this.unreadCounts[unreadIndex].count < 0) {
      this.unreadCounts[unreadIndex].count = 0;
    }
  } else if (increment) {
    this.unreadCounts.push({ user: userId, count: 1 });
  }
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
  const unreadIndex = this.unreadCounts.findIndex(item => 
    item.user.toString() === userId.toString()
  );
  
  if (unreadIndex > -1) {
    this.unreadCounts[unreadIndex].count = 0;
    return this.save();
  }
  
  return this;
};

module.exports = mongoose.model('Chat', chatSchema); 
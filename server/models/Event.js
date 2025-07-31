const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: true
  },
  userNumber: {
    type: Number,
    required: true,
    min: 5,
    default: 5
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      maxlength: 200
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    default: 'event'
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ author: 1, createdAt: -1 });
eventSchema.index({ joinedUsers: 1 });
eventSchema.index({ likes: 1 });

module.exports = mongoose.model('Event', eventSchema); 
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  media: [
    {
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String // Cloudinary public ID for deletion
      },
      width: Number,
      height: Number,
      format: String,
      size: Number
    }
  ],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  // Secret post fields
  isSecret: {
    type: Boolean,
    default: false
  },
  secretPassword: {
    type: String,
    minlength: [4, 'Password must be at least 4 digits'],
    maxlength: [4, 'Password must be exactly 4 digits']
  },
  // Track users who have successfully entered the password
  passwordVerifiedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema); 
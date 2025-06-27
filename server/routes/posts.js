const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// Create a post
router.post('/', auth, [
  body('content').trim().notEmpty().withMessage('Постын агуулга шаардлагатай'),
  body('image').optional().isString(),
  body('video').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Оролтын алдаа', errors: errors.array() });
    }
    const { content, image, video } = req.body;
    const post = new Post({
      author: req.user._id,
      content,
      image,
      video
    });
    await post.save();
    await post.populate('author', 'name avatar');
    res.status(201).json({ success: true, message: 'Пост үүслээ', data: { post } });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Get all posts (feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');
    res.json({ success: true, data: { posts } });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Get a single post
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    res.json({ success: true, data: { post } });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Add a comment to a post
router.post('/:id/comment', auth, [
  body('content').trim().notEmpty().withMessage('Сэтгэгдэл шаардлагатай')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Оролтын алдаа', errors: errors.array() });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    const comment = {
      author: req.user._id,
      content: req.body.content
    };
    post.comments.push(comment);
    await post.save();
    await post.populate('comments.author', 'name avatar');
    // Create notification for post author (if not self)
    if (String(post.author) !== String(req.user._id)) {
      await Notification.create({
        user: post.author,
        type: 'comment',
        post: post._id,
        from: req.user._id,
        message: `${req.user.name} таны пост дээр сэтгэгдэл үлдээлээ.`
      });
    }
    res.json({ success: true, message: 'Сэтгэгдэл нэмэгдлээ', data: { comments: post.comments } });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Like/unlike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    const userId = req.user._id;
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      // Create notification for post author (if not self)
      if (String(post.author) !== String(userId)) {
        await Notification.create({
          user: post.author,
          type: 'like',
          post: post._id,
          from: userId,
          message: `${req.user.name} таны постыг лайк дарлаа.`
        });
      }
    }
    await post.save();
    res.json({ success: true, message: liked ? 'Лайк устлаа' : 'Лайк нэмэгдлээ', data: { likes: post.likes } });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Delete a post (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Та зөвшөөрөлгүй байна' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Пост устгагдлаа' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Delete all comments on a post (owner only)
router.delete('/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Та зөвшөөрөлгүй байна' });
    }
    post.comments = [];
    await post.save();
    res.json({ success: true, message: 'Бүх сэтгэгдэл устгагдлаа' });
  } catch (error) {
    console.error('Delete all comments error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Delete a single comment (comment owner or post owner)
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Сэтгэгдэл олдсонгүй' });
    if (String(comment.author) !== String(req.user._id) && String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Та зөвшөөрөлгүй байна' });
    }
    // Remove the comment from the array
    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();
    res.json({ success: true, message: 'Сэтгэгдэл устгагдлаа' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   GET /user/:userId
// @desc    Get all posts by a user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');
    res.json({ success: true, data: { posts } });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

module.exports = router; 
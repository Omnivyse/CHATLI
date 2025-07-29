const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { deleteMultipleFiles } = require('../config/cloudinary');

const router = express.Router();

// Create a post
router.post('/', auth, [
  body('content').trim().notEmpty().withMessage('Постын агуулга шаардлагатай'),
  body('media').optional().isArray(),
  body('media.*.type').optional().isIn(['image', 'video']),
  body('media.*.url').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Оролтын алдаа', errors: errors.array() });
    }
    const { content, media } = req.body;
    const post = new Post({
      author: req.user._id,
      content,
      media: Array.isArray(media) ? media : []
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
    let posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar privateProfile followers');
    
    // Filter out posts from deleted users and private users
    posts = posts.filter(post => {
      const author = post.author;
      
      // Skip posts from deleted users
      if (!author) {
        console.log('Found post with deleted author, skipping:', post._id);
        return false;
      }
      
      // Skip private posts unless requester is a follower or the user themselves
      if (author.privateProfile) {
        if (String(author._id) === String(req.user._id)) return true;
        if (Array.isArray(author.followers) && author.followers.map(id => String(id)).includes(String(req.user._id))) return true;
        return false;
      }
      
      return true;
    });
    
    // Populate comments.author for filtered posts, but handle deleted users
    try {
      await Post.populate(posts, { 
        path: 'comments.author', 
        select: 'name avatar',
        // Handle cases where comment author might be deleted
        transform: (doc) => {
          if (!doc) return null;
          return doc;
        }
      });
    } catch (populateError) {
      console.error('Error populating comments:', populateError);
      // Continue without comments if there's an error
    }
    
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

    // Extract media URLs for Cloudinary deletion
    const mediaUrls = [];
    if (post.media && Array.isArray(post.media)) {
      post.media.forEach(mediaItem => {
        if (mediaItem.url && typeof mediaItem.url === 'string') {
          mediaUrls.push(mediaItem.url);
        }
      });
    }

    // Delete media files from Cloudinary
    let cloudinaryDeletionResults = [];
    if (mediaUrls.length > 0) {
      console.log(`Deleting ${mediaUrls.length} media files from Cloudinary for post ${post._id}`);
      cloudinaryDeletionResults = await deleteMultipleFiles(mediaUrls);
      
      // Log deletion results
      const successfulDeletions = cloudinaryDeletionResults.filter(result => result.success);
      const failedDeletions = cloudinaryDeletionResults.filter(result => !result.success);
      
      if (successfulDeletions.length > 0) {
        console.log(`Successfully deleted ${successfulDeletions.length} files from Cloudinary`);
      }
      
      if (failedDeletions.length > 0) {
        console.log(`Failed to delete ${failedDeletions.length} files from Cloudinary:`, failedDeletions);
      }
    }

    // Delete the post from database
    await post.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Пост устгагдлаа',
      data: {
        cloudinaryDeletionResults: {
          total: mediaUrls.length,
          successful: cloudinaryDeletionResults.filter(result => result.success).length,
          failed: cloudinaryDeletionResults.filter(result => !result.success).length
        }
      }
    });
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
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    if (user.privateProfile && !user._id.equals(req.user._id) && !user.followers.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Энэ профайл хувийн байна' });
    }
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

// Edit a post (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Та зөвшөөрөлгүй байна' });
    }
    
    const { content, media } = req.body;
    let cloudinaryDeletionResults = [];
    
    // Handle media changes and deletion
    if (Array.isArray(media)) {
      // Find media files that are being removed
      const currentMediaUrls = post.media ? post.media.map(item => item.url).filter(Boolean) : [];
      const newMediaUrls = media.map(item => item.url).filter(Boolean);
      
      // Find URLs that exist in current media but not in new media (removed files)
      const removedMediaUrls = currentMediaUrls.filter(url => !newMediaUrls.includes(url));
      
      // Delete removed media files from Cloudinary
      if (removedMediaUrls.length > 0) {
        console.log(`Deleting ${removedMediaUrls.length} removed media files from Cloudinary for post ${post._id}`);
        cloudinaryDeletionResults = await deleteMultipleFiles(removedMediaUrls);
        
        // Log deletion results
        const successfulDeletions = cloudinaryDeletionResults.filter(result => result.success);
        const failedDeletions = cloudinaryDeletionResults.filter(result => !result.success);
        
        if (successfulDeletions.length > 0) {
          console.log(`Successfully deleted ${successfulDeletions.length} removed files from Cloudinary`);
        }
        
        if (failedDeletions.length > 0) {
          console.log(`Failed to delete ${failedDeletions.length} removed files from Cloudinary:`, failedDeletions);
        }
      }
      
      // Update post media
      post.media = media;
    }
    
    // Update content if provided
    if (typeof content === 'string') post.content = content;
    
    await post.save();
    await post.populate('author', 'name avatar');
    
    res.json({ 
      success: true, 
      message: 'Пост амжилттай засагдлаа', 
      data: { 
        post,
        cloudinaryDeletionResults: {
          total: cloudinaryDeletionResults.length,
          successful: cloudinaryDeletionResults.filter(result => result.success).length,
          failed: cloudinaryDeletionResults.filter(result => !result.success).length
        }
      }
    });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

module.exports = router; 
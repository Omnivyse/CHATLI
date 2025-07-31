const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const PrivacySettings = require('../models/PrivacySettings');
const { auth, optionalAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { deleteMultipleFiles } = require('../config/cloudinary');
const pushNotificationService = require('../services/pushNotificationService');

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
    await post.populate('author', 'name avatar isVerified');
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
      .populate('author', 'name avatar isVerified');
    
    // Filter out posts with null authors first
    posts = posts.filter(post => {
      if (!post.author) {
        console.log('Found post with null author, skipping:', post._id);
        return false;
      }
      return true;
    });
    
    // Get privacy settings for all post authors (only for posts with valid authors)
    const authorIds = [...new Set(posts.map(post => post.author._id))];
    const privacySettings = await PrivacySettings.find({ userId: { $in: authorIds } });
    const privacyMap = new Map(privacySettings.map(ps => [ps.userId.toString(), ps]));
    
    // Get current user's following list
    const currentUser = await User.findById(req.user._id).select('following');
    const followingIds = currentUser ? currentUser.following.map(id => id.toString()) : [];
    
    // Filter out posts from private users
    posts = posts.filter(post => {
      const author = post.author;
      
      // Check privacy settings for the author
      const authorPrivacy = privacyMap.get(author._id.toString());
      if (authorPrivacy && authorPrivacy.isPrivateAccount) {
        // If author has private account, only show to themselves or followers
        if (String(author._id) === String(req.user._id)) return true;
        
        // Check if current user is following the author
        if (followingIds.includes(author._id.toString())) {
          return true;
        }
        
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
      .populate('author', 'name avatar isVerified')
      .populate('comments.author', 'name avatar isVerified');
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    // Check if post has a valid author
    if (!post.author) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    // Check if post author has private profile
    const authorPrivacy = await PrivacySettings.findOne({ userId: post.author._id });
    if (authorPrivacy && authorPrivacy.isPrivateAccount) {
      // If author has private account, only allow access to themselves or followers
      if (String(post.author._id) === String(req.user._id)) {
        // Post author can always see their own posts
        return res.json({ success: true, data: { post } });
      }
      
      // Check if current user is following the author
      const currentUser = await User.findById(req.user._id).select('following');
      if (currentUser && currentUser.following && currentUser.following.includes(post.author._id)) {
        return res.json({ success: true, data: { post } });
      }
      
      // User is not following and post is private
      return res.status(403).json({ 
        success: false, 
        message: 'Энэ хэрэглэгчийн постуудыг харахын тулд дагах шаардлагатай' 
      });
    }
    
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
    
    const post = await Post.findById(req.params.id).populate('author', 'name avatar isVerified');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    // Check if post has a valid author
    if (!post.author) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    // Check if post author has private profile and commenter is not following
    const authorPrivacy = await PrivacySettings.findOne({ userId: post.author._id });
    if (authorPrivacy && authorPrivacy.isPrivateAccount) {
      // If author has private account, only followers can comment
      if (String(post.author._id) === String(req.user._id)) {
        // Post author can always comment on their own posts
      } else {
        // Check if current user is following the author
        const currentUser = await User.findById(req.user._id).select('following');
        if (!currentUser || !currentUser.following || !currentUser.following.includes(post.author._id)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Энэ хэрэглэгчийн пост дээр сэтгэгдэл бичихийн тулд дагах шаардлагатай' 
          });
        }
      }
    }
    
    const comment = {
      author: req.user._id,
      content: req.body.content
    };
    post.comments.push(comment);
    await post.save();
    await post.populate('comments.author', 'name avatar isVerified');
    
    // Create notification for post author (if not self)
    if (String(post.author._id) !== String(req.user._id)) {
      await Notification.create({
        user: post.author._id,
        type: 'comment',
        post: post._id,
        from: req.user._id,
        message: `${req.user.name} таны пост дээр сэтгэгдэл үлдээлээ.`
      });

      // Send push notification
      try {
        const postAuthor = await User.findById(post.author._id);
        if (postAuthor && postAuthor.pushToken) {
          await pushNotificationService.sendCommentNotification(
            postAuthor.pushToken,
            req.user.name,
            post._id.toString(),
            req.body.content,
            post.content
          );
        }
      } catch (pushError) {
        console.error('Push notification error for comment:', pushError);
      }
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
    const post = await Post.findById(req.params.id).populate('author', 'name avatar isVerified');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    // Check if post has a valid author
    if (!post.author) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    // Check if post author has private profile and liker is not following
    const authorPrivacy = await PrivacySettings.findOne({ userId: post.author._id });
    if (authorPrivacy && authorPrivacy.isPrivateAccount) {
      // If author has private account, only followers can like
      if (String(post.author._id) === String(req.user._id)) {
        // Post author can always like their own posts
      } else {
        // Check if current user is following the author
        const currentUser = await User.findById(req.user._id).select('following');
        if (!currentUser || !currentUser.following || !currentUser.following.includes(post.author._id)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Энэ хэрэглэгчийн пост дээр лайк хийхийн тулд дагах шаардлагатай' 
          });
        }
      }
    }
    
    const userId = req.user._id;
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    
    // Create notification for post author (if not self and liking)
    if (!liked && String(post.author._id) !== String(req.user._id)) {
      await Notification.create({
        user: post.author._id,
        type: 'like',
        post: post._id,
        from: req.user._id,
        message: `${req.user.name} таны пост дээр лайк хийлээ.`
      });

      // Send push notification
      try {
        const postAuthor = await User.findById(post.author._id);
        if (postAuthor && postAuthor.pushToken) {
          await pushNotificationService.sendLikeNotification(
            postAuthor.pushToken,
            req.user.name,
            post._id.toString(),
            post.content
          );
        }
      } catch (pushError) {
        console.error('Push notification error for like:', pushError);
      }
    }
    
    res.json({ 
      success: true, 
      message: liked ? 'Лайк хаслаа' : 'Лайк хийлээ', 
      data: { likes: post.likes, liked: !liked } 
    });
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
    if (!user) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    
    // Check privacy settings for the user
    const userPrivacy = await PrivacySettings.findOne({ userId: req.params.userId });
    if (userPrivacy && userPrivacy.isPrivateAccount) {
      // If user has private account, only allow access to themselves or followers
      if (String(user._id) === String(req.user._id)) {
        // User can always see their own posts
      } else {
        // Check if current user is following the user
        const currentUser = await User.findById(req.user._id).select('following');
        if (!currentUser || !currentUser.following || !currentUser.following.includes(user._id)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Энэ хэрэглэгчийн постуудыг харахын тулд дагах шаардлагатай' 
          });
        }
      }
    }
    
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar isVerified')
      .populate('comments.author', 'name avatar isVerified');
    
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
    await post.populate('author', 'name avatar isVerified');
    
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
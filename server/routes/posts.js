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
  body('content').optional().isString().isLength({ max: 2000 }),
  body('media').optional().isArray(),
  body('media.*.type').optional().isIn(['image', 'video']),
  body('media.*.url').optional().isString(),
  body('isSecret').optional().isBoolean(),
  body('secretPassword').optional().isLength({ min: 4, max: 4 }).withMessage('Password must be exactly 4 digits'),
  body('showDescription').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Оролтын алдаа', errors: errors.array() });
    }
    
    const { content, media, spotifyTrack, isSecret, secretPassword, showDescription } = req.body;
    
    console.log('📥 Received post creation request:', {
      contentLength: content?.length || 0,
      mediaCount: Array.isArray(media) ? media.length : 0,
      hasSpotifyTrack: !!spotifyTrack,
      isSecret,
      showDescription,
      showDescriptionType: typeof showDescription,
      hasPassword: !!secretPassword
    });

    // At least one of content, media, or spotifyTrack is required
    const hasContent = typeof content === 'string' && content.trim().length > 0;
    const hasMedia = Array.isArray(media) && media.length > 0;
    const hasSpotify = !!spotifyTrack;
    if (!hasContent && !hasMedia && !hasSpotify) {
      return res.status(400).json({
        success: false,
        message: 'Постод агуулга, медиа эсвэл хөгжим заавал байх ёстой.'
      });
    }
    
    // Check if user has private account and trying to create secret post
    if (isSecret) {
      // Get user's privacy settings
      const userPrivacySettings = await PrivacySettings.findOne({ userId: req.user._id });
      
      if (userPrivacySettings && userPrivacySettings.isPrivateAccount) {
        return res.status(403).json({ 
          success: false, 
          message: 'Private accounts cannot create secret posts. Only public accounts can create secret posts.' 
        });
      }
      
      // Validate secret post requirements
      if (!secretPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Secret post requires a 4-digit password' 
        });
      }
      
      if (!/^\d{4}$/.test(secretPassword)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be exactly 4 digits' 
        });
      }
    }
    
    const post = new Post({
      author: req.user._id,
      content: hasContent ? content : '',
      media: hasMedia ? media : [],
      spotifyTrack: hasSpotify ? spotifyTrack : null,
      isSecret: isSecret || false,
      secretPassword: isSecret ? secretPassword : undefined,
      showDescription: isSecret ? Boolean(showDescription) : false
    });
    
    console.log('💾 Saving post to database:', {
      isSecret: post.isSecret,
      showDescription: post.showDescription,
      showDescriptionType: typeof post.showDescription,
      contentLength: (post.content || '').length
    });
    
    await post.save();
    
    // Log what was actually saved
    console.log('💾 Post saved successfully. Retrieved from database:', {
      isSecret: post.isSecret,
      showDescription: post.showDescription,
      showDescriptionType: typeof post.showDescription,
      contentLength: (post.content || '').length
    });
    
    // Also log the raw document to see all fields
    console.log('💾 Raw post document after save:', JSON.stringify(post.toObject(), null, 2));
    
    await post.populate('author', 'name avatar isVerified');
    
    res.status(201).json({ 
      success: true, 
      message: isSecret ? 'Secret post created successfully' : 'Пост үүслээ', 
      data: { post } 
    });
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
    
    // Filter out posts from private users and handle secret posts
    const originalCount = posts.length;
    posts = posts.filter(post => {
      const author = post.author;
      
      // Handle secret posts
      if (post.isSecret) {
        // Authors can always see their own secret posts
        if (String(author._id) === String(req.user._id)) {
          return true;
        }
        
        // Check if user has verified this secret post
        console.log(`🔒 Secret post ${post._id} - passwordVerifiedUsers:`, post.passwordVerifiedUsers, 'user:', req.user._id);
        if (post.passwordVerifiedUsers && post.passwordVerifiedUsers.includes(req.user._id)) {
          console.log(`✅ User ${req.user._id} already verified for post ${post._id}`);
          return true;
        }
        
        // For secret posts, handle content visibility based on showDescription setting
        console.log(`🔒 Secret post ${post._id} - showDescription: ${post.showDescription}, showDescription type: ${typeof post.showDescription}, original content length: ${post.content.length}`);
        
        // Convert showDescription to boolean to handle different data types
        const shouldShowDescription = Boolean(post.showDescription);
        console.log(`🔍 Converted showDescription to boolean: ${shouldShowDescription}`);
        console.log(`🔍 Post data before modification:`, {
          _id: post._id,
          content: post.content.substring(0, 100) + '...',
          mediaCount: post.media?.length || 0,
          showDescription: post.showDescription,
          shouldShowDescription
        });
        
        if (shouldShowDescription) {
          // If showDescription is true, keep the original content visible
          // Only hide the media
          console.log(`✅ Keeping content visible for post ${post._id} (showDescription: ${post.showDescription} -> ${shouldShowDescription})`);
          post.media = []; // Hide media for unverified users
        } else {
          // If showDescription is false, hide both content and media
          console.log(`❌ Hiding content for post ${post._id} (showDescription: ${post.showDescription} -> ${shouldShowDescription})`);
          post.content = '🔒 This is a secret post. Enter the password to view content.';
          post.media = []; // Hide media for unverified users
        }
        
        console.log(`🔍 Post data after modification:`, {
          _id: post._id,
          content: post.content.substring(0, 100) + '...',
          mediaCount: post.media?.length || 0,
          showDescription: post.showDescription,
          shouldShowDescription
        });
        
        // Ensure passwordVerifiedUsers array is preserved for frontend verification checks
        if (!post.passwordVerifiedUsers) {
          post.passwordVerifiedUsers = [];
        }
        return true; // Show the post but with hidden content/media based on showDescription
      }
      
      // Check if post is hidden by author
      if (post.isHidden) {
        // Only show hidden posts to the author themselves
        if (String(author._id) === String(req.user._id)) {
          console.log(`👁️ Hidden post ${post._id} shown to author ${author._id} (main feed)`);
          return true;
        }
        console.log(`🚫 Hidden post ${post._id} filtered out for user ${req.user._id} (author: ${author._id}, main feed)`);
        return false;
      }
      
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
    
    // Log filtering results
    const filteredCount = posts.length;
    if (originalCount !== filteredCount) {
      console.log(`🚫 Main feed: Filtered out ${originalCount - filteredCount} posts (${originalCount} -> ${filteredCount})`);
    }
    
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

// Get top posts from current week (for Top Feeds)
router.get('/top-weekly', auth, async (req, res) => {
  try {
    // Calculate the start of the current week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate the end of the current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log('📅 Top posts query period:', {
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
      currentTime: now.toISOString()
    });

    // Get posts from current week, sorted by likes count (descending)
    let posts = await Post.find({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    })
    .sort({ 'likes.length': -1, createdAt: -1 })
    .limit(10) // Get top 10 posts
    .populate('author', 'name avatar isVerified');
    
    // Filter out posts with null authors
    posts = posts.filter(post => {
      if (!post.author) {
        console.log('Found post with null author in top posts, skipping:', post._id);
        return false;
      }
      return true;
    });
    
    // Get privacy settings for all post authors
    const authorIds = [...new Set(posts.map(post => post.author._id))];
    const privacySettings = await PrivacySettings.find({ userId: { $in: authorIds } });
    const privacyMap = new Map(privacySettings.map(ps => [ps.userId.toString(), ps]));
    
    // Get current user's following list
    const currentUser = await User.findById(req.user._id).select('following');
    const followingIds = currentUser ? currentUser.following.map(id => id.toString()) : [];
    
    // Filter out posts from private users and hidden posts
    const originalCount = posts.length;
    posts = posts.filter(post => {
      const author = post.author;
      
      // Check if post is hidden by author
      if (post.isHidden) {
        // Only show hidden posts to the author themselves
        if (String(author._id) === String(req.user._id)) {
          console.log(`👁️ Hidden post ${post._id} shown to author ${author._id} (top weekly)`);
          return true;
        }
        console.log(`🚫 Hidden post ${post._id} filtered out for user ${req.user._id} (author: ${author._id}, top weekly)`);
        return false;
      }
      
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
    
    // Log filtering results
    const filteredCount = posts.length;
    if (originalCount !== filteredCount) {
      console.log(`🚫 Top weekly: Filtered out ${originalCount - filteredCount} posts (${originalCount} -> ${filteredCount})`);
    }
    
    // Populate comments.author for filtered posts
    try {
      await Post.populate(posts, { 
        path: 'comments.author', 
        select: 'name avatar',
        transform: (doc) => {
          if (!doc) return null;
          return doc;
        }
      });
    } catch (populateError) {
      console.error('Error populating comments for top posts:', populateError);
    }
    
    console.log(`✅ Top posts fetched: ${posts.length} posts from current week`);
    
    res.json({
      success: true,
      message: 'Top posts fetched successfully',
      data: {
        posts,
        weekInfo: {
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString(),
          currentTime: now.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get top weekly posts error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Verify secret post password
router.post('/:id/verify-password', auth, [
  body('password').isLength({ min: 4, max: 4 }).withMessage('Password must be exactly 4 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Оролтын алдаа', errors: errors.array() });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    if (!post.isSecret) {
      return res.status(400).json({ success: false, message: 'This post is not a secret post' });
    }
    
    // Check if user is the author (authors can always view their own secret posts)
    if (String(post.author) === String(req.user._id)) {
      return res.json({ 
        success: true, 
        message: 'Author access granted',
        data: { post }
      });
    }
    
    // Check if user has already verified this post
    if (post.passwordVerifiedUsers.includes(req.user._id)) {
      return res.json({ 
        success: true, 
        message: 'Already verified',
        data: { post }
      });
    }
    
    // Check for rate limiting on failed attempts
    const userKey = `secret_post_attempts_${req.user._id}`;
    const currentAttempts = req.app.locals[userKey] || { count: 0, lastAttempt: 0, lockedUntil: 0 };
    const now = Date.now();
    
    // Clean up old attempt data (older than 1 hour)
    if (currentAttempts.lastAttempt && (now - currentAttempts.lastAttempt) > (60 * 60 * 1000)) {
      delete req.app.locals[userKey];
      currentAttempts.count = 0;
      currentAttempts.lastAttempt = 0;
      currentAttempts.lockedUntil = 0;
    }
    
    // Check if user is currently locked out
    if (currentAttempts.lockedUntil > now) {
      const remainingTime = Math.ceil((currentAttempts.lockedUntil - now) / (1000 * 60));
      return res.status(429).json({ 
        success: false, 
        message: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
        retryAfter: remainingTime * 60
      });
    }
    
    // Verify password
    if (post.secretPassword !== req.body.password) {
      // Increment failed attempts
      currentAttempts.count++;
      currentAttempts.lastAttempt = now;
      
      // Lock user out after 5 failed attempts for 8 minutes
      if (currentAttempts.count >= 5) {
        currentAttempts.lockedUntil = now + (8 * 60 * 1000); // 8 minutes
        currentAttempts.count = 0; // Reset counter
        req.app.locals[userKey] = currentAttempts;
        
        return res.status(429).json({ 
          success: false, 
          message: 'Too many incorrect passwords. Please try again in 8 minutes.',
          retryAfter: 8 * 60
        });
      }
      
      // Store attempt data
      req.app.locals[userKey] = currentAttempts;
      
      const attemptsRemaining = 5 - currentAttempts.count;
      return res.status(401).json({ 
        success: false, 
        message: `Incorrect password. ${attemptsRemaining} attempts remaining.`,
        attemptsRemaining
      });
    }
    
    // Password is correct - reset failed attempts
    delete req.app.locals[userKey];
    
    // Add user to verified users list
    console.log(`🔐 Adding user ${req.user._id} to passwordVerifiedUsers for post ${post._id}`);
    post.passwordVerifiedUsers.push(req.user._id);
    await post.save();
    console.log(`✅ Post ${post._id} passwordVerifiedUsers after save:`, post.passwordVerifiedUsers);
    
    await post.populate('author', 'name avatar isVerified');
    
    res.json({ 
      success: true, 
      message: 'Password verified successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Verify password error:', error);
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
        message: `${req.user.name} liked your post.`
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
    
    let posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar isVerified')
      .populate('comments.author', 'name avatar isVerified');
    
    // Filter out hidden posts for non-authors
    if (String(user._id) !== String(req.user._id)) {
      const originalCount = posts.length;
      posts = posts.filter(post => !post.isHidden);
      const filteredCount = posts.length;
      if (originalCount !== filteredCount) {
        console.log(`🚫 Filtered out ${originalCount - filteredCount} hidden posts for user ${req.user._id} viewing ${user._id}'s posts`);
      }
    }
    
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

// Hide/Unhide a post (owner only)
router.patch('/:id/hide', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Пост олдсонгүй' });
    }
    
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Та зөвшөөрөлгүй байна' });
    }
    
    const { isHidden } = req.body;
    
    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isHidden field must be a boolean' });
    }
    
         post.isHidden = isHidden;
     post.hiddenReason = isHidden ? 'manual' : null;
     await post.save();
    
    res.json({ 
      success: true, 
      message: isHidden ? 'Пост амжилттай нуулаа' : 'Пост амжилттай харагдана',
      data: { post }
    });
  } catch (error) {
    console.error('Hide post error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

module.exports = router; 
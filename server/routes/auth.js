const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PrivacySettings = require('../models/PrivacySettings');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');
const mongoose = require('mongoose');
const pushNotificationService = require('../services/pushNotificationService');
const emailService = require('../services/emailService');

const router = express.Router();

// Test endpoint to verify auth routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Utility to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// @route   GET /users/search
// @desc    Search users by name or username
// @access  Private
router.get('/users/search', auth, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ success: true, data: { users: [] } });
    const safeQ = escapeRegex(q);
    const regex = new RegExp(`^${safeQ}$`, 'i'); // exact match for uniqueness
    console.log('[UserSearch] Query:', q, '| safeQ:', safeQ, '| regex:', regex);

    // Try to find by username first (unique)
    let user = await User.findOne({ username: regex }).select('_id name username avatar privateProfile');
    console.log('[UserSearch] Username match:', user);
    if (user) {
      return res.json({ success: true, data: { users: [user] } });
    }

    // Then try to find by name (should be unique if enforced)
    let usersByName = await User.find({ name: regex }).select('_id name username avatar privateProfile');
    console.log('[UserSearch] Name match:', usersByName);
    if (usersByName.length === 1) {
      return res.json({ success: true, data: { users: usersByName } });
    } else if (usersByName.length > 1) {
      // Legacy data: multiple users with same name
      return res.status(409).json({
        success: false,
        message: 'Олдсон нэр давхцаж байна. Админд хандана уу.',
        data: { users: usersByName }
      });
    }

    // If not found, fallback to partial search (for suggestions)
    const partialRegex = new RegExp(safeQ, 'i');
    const or = [
      { name: partialRegex },
      { username: partialRegex }
    ];
    if (mongoose.Types.ObjectId.isValid(q)) {
      or.push({ _id: q });
    }
    console.log('[UserSearch] Partial search $or:', or);
    const suggestions = await User.find({ $or: or }).select('_id name username avatar privateProfile').limit(10);
    console.log('[UserSearch] Suggestions:', suggestions);
    return res.json({ success: true, data: { users: suggestions } });
  } catch (error) {
    console.error('[UserSearch] Error:', error.stack || error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    let userObj = user.toObject();
    
    // Get privacy settings for this user
    const privacySettings = await PrivacySettings.findOne({ userId: user._id });
    const isPrivateAccount = privacySettings ? privacySettings.isPrivateAccount : false;
    userObj.isPrivateAccount = isPrivateAccount;
    
    // Only include followRequests if viewing own profile
    if (user._id.equals(req.user._id)) {
      userObj.followRequests = user.followRequests;
    } else {
      delete userObj.followRequests;
      // Check if current user has sent a follow request to this user
      userObj.hasFollowRequestFromCurrentUser = user.followRequests.includes(req.user._id);
    }
    
    res.json({ success: true, data: { user: userObj } });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Нэр 2-50 тэмдэгт байх ёстой'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Хэрэглэгчийн нэр зөвхөн үсэг, тоо, _ агуулж болно'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Зөв имэйл оруулна уу'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Оролтын алдаа',
        errors: errors.array()
      });
    }

    const { name, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Энэ хэрэглэгчийн нэр аль хэдийн ашиглагдаж байна'
        });
      }
    }

    // Generate verification code
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Create new user (not verified yet)
    const user = new User({
      name,
      username,
      email,
      password,
      emailVerified: false,
      verificationCode,
      verificationExpires
    });

    await user.save();

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, name, verificationCode);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration, just log the error
    }

    // Generate JWT token for the new user
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Бүртгэл амжилттай үүслээ. Имэйл хаягаа шалгаж баталгаажуулна уу.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          coverImage: user.coverImage,
          bio: user.bio,
          isVerified: user.isVerified,
          followers: user.followers,
          following: user.following,
          posts: user.posts,
          createdAt: user.createdAt
        },
        token,
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Зөв имэйл оруулна уу'),
  body('password')
    .notEmpty()
    .withMessage('Нууц үг оруулна уу')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Оролтын алдаа',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Имэйл эсвэл нууц үг буруу байна'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Имэйл эсвэл нууц үг буруу байна'
      });
    }

    // Check if email is verified
    // For existing users who registered before email verification system, auto-verify them
    if (user.emailVerified === false) {
      // Check if this is an existing user (registered before email verification system)
      const isExistingUser = user.createdAt < new Date('2024-01-01'); // Adjust date as needed
      
      if (isExistingUser) {
        // Auto-verify existing users
        user.emailVerified = true;
        await user.save();
        console.log(`Auto-verified existing user: ${user.email}`);
      } else {
        // Allow unverified users to login but they need to verify
        console.log(`Unverified user logging in: ${user.email}`);
        // Continue with login but user will need to verify
      }
    }
    
    // If emailVerified is undefined (old users), set it to true and continue
    if (user.emailVerified === undefined) {
      user.emailVerified = true;
      await user.save();
      console.log(`Auto-verified existing user: ${user.email}`);
    }

    // Update last seen and status
    user.lastSeen = new Date();
    user.status = 'online';
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Амжилттай нэвтэрлээ',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Нэр 2-50 тэмдэгт байх ёстой'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Био 500 тэмдэгтээс бага байх ёстой'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Зураг буруу байна'),
  body('coverImage')
    .optional()
    .isString()
    .withMessage('Ковер зураг буруу байна'),
  body('privateProfile')
    .optional()
    .isBoolean()
    .withMessage('Хувийн профайл утга буруу байна')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Оролтын алдаа',
        errors: errors.array()
      });
    }

    const { name, bio, avatar, coverImage, privateProfile } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar) updateFields.avatar = avatar;
    if (coverImage) updateFields.coverImage = coverImage;
    if (privateProfile !== undefined) updateFields.privateProfile = privateProfile;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Профайл амжилттай шинэчлэгдлээ',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update user status to offline
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastSeen: new Date()
    });

    res.json({
      success: true,
      message: 'Амжилттай гарлаа'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/users/:id/follow', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    if (userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ success: false, message: 'Өөрийгөө дагах боломжгүй' });
    }
    if (userToFollow.followers.includes(currentUser._id)) {
      return res.status(400).json({ success: false, message: 'Та аль хэдийн дагасан байна' });
    }

    // Check privacy settings
    const privacySettings = await PrivacySettings.findOne({ userId: userToFollow._id });
    const isPrivateAccount = privacySettings ? privacySettings.isPrivateAccount : false;

    if (isPrivateAccount) {
      if (userToFollow.followRequests.includes(currentUser._id)) {
        return res.status(400).json({ success: false, message: 'Дагах хүсэлт илгээсэн байна' });
      }
      userToFollow.followRequests.push(currentUser._id);
      await userToFollow.save();

      // Create follow request notification
      try {
        await Notification.create({
          user: userToFollow._id,
          type: 'follow_request',
          from: [currentUser._id],
          message: `${currentUser.name} танд дагах хүсэлт илгээлээ`
        });
      } catch (notificationError) {
        console.error('Follow request notification creation error:', notificationError);
      }

      return res.json({ success: true, message: 'Дагах хүсэлт илгээгдлээ', data: { followRequests: userToFollow.followRequests } });
    }

    userToFollow.followers.push(currentUser._id);
    currentUser.following.push(userToFollow._id);
    await userToFollow.save();
    await currentUser.save();

    // Send push notification for follow
    try {
      if (userToFollow.pushToken) {
        await pushNotificationService.sendFollowNotification(
          userToFollow.pushToken,
          currentUser.name,
          currentUser._id.toString()
        );
      }
    } catch (pushError) {
      console.error('Push notification error for follow:', pushError);
    }

    res.json({ success: true, message: 'Дагах амжилттай', data: { followers: userToFollow.followers, following: currentUser.following } });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   POST /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.post('/users/:id/unfollow', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    if (!userToUnfollow) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    if (userToUnfollow._id.equals(currentUser._id)) {
      return res.status(400).json({ success: false, message: 'Өөрийгөө дагах боломжгүй' });
    }
    userToUnfollow.followers = userToUnfollow.followers.filter(f => !f.equals(currentUser._id));
    currentUser.following = currentUser.following.filter(f => !f.equals(userToUnfollow._id));
    await userToUnfollow.save();
    await currentUser.save();

    // Delete any follow request notifications from the unfollowed user to the current user
    try {
      await Notification.deleteMany({
        user: userToUnfollow._id,
        type: 'follow_request',
        from: currentUser._id
      });
    } catch (notificationError) {
      console.error('Delete follow request notification error:', notificationError);
    }

    res.json({ success: true, message: 'Дагахаа болилоо', data: { followers: userToUnfollow.followers, following: currentUser.following } });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   POST /api/auth/users/:id/accept-follow-request
// @desc    Accept a follow request
// @access  Private
router.post('/users/:id/accept-follow-request', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const requesterId = req.params.id;
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({ success: false, message: 'Дагах хүсэлт олдсонгүй' });
    }
    // Remove from followRequests, add to followers
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
    currentUser.followers.push(requesterId);
    await currentUser.save();
    // Also add to requester's following
    const requester = await User.findById(requesterId);
    if (requester) {
      requester.following.push(currentUser._id);
      await requester.save();
    }

    // Delete the follow request notification
    try {
      await Notification.deleteMany({
        user: currentUser._id,
        type: 'follow_request',
        from: requesterId
      });
    } catch (notificationError) {
      console.error('Delete follow request notification error:', notificationError);
    }

    res.json({ success: true, message: 'Дагах хүсэлт зөвшөөрөгдлөө', data: { followers: currentUser.followers } });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   POST /api/auth/users/:id/reject-follow-request
// @desc    Reject a follow request
// @access  Private
router.post('/users/:id/reject-follow-request', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const requesterId = req.params.id;
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({ success: false, message: 'Дагах хүсэлт олдсонгүй' });
    }
    // Remove from followRequests
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
    await currentUser.save();

    // Delete the follow request notification
    try {
      await Notification.deleteMany({
        user: currentUser._id,
        type: 'follow_request',
        from: requesterId
      });
    } catch (notificationError) {
      console.error('Delete follow request notification error:', notificationError);
    }

    res.json({ success: true, message: 'Дагах хүсэлт цуцлагдлаа', data: { followRequests: currentUser.followRequests } });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   POST /api/users/:id/cancel-follow-request
// @desc    Cancel a follow request
// @access  Private
router.post('/users/:id/cancel-follow-request', auth, async (req, res) => {
  try {
    const userToCancel = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    if (!userToCancel) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }
    // Remove from followRequests
    userToCancel.followRequests = userToCancel.followRequests.filter(id => id.toString() !== currentUser._id.toString());
    await userToCancel.save();
    res.json({ success: true, message: 'Дагах хүсэлт цуцлагдлаа', data: { followRequests: userToCancel.followRequests } });
  } catch (error) {
    console.error('Cancel follow request error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// @route   GET /api/auth/following
// @desc    Get user's following list
// @access  Private
router.get('/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'name username avatar status lastSeen')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }

    res.json({ 
      success: true, 
      data: { following: user.following } 
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

// Delete account endpoint
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Нууц үг шаардлагатай' 
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Хэрэглэгч олдсонгүй' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Нууц үг буруу байна' 
      });
    }

    // Delete user's posts and associated media
    const Post = require('../models/Post');
    const Chat = require('../models/Chat');
    const Notification = require('../models/Notification');
    const { deleteMultipleFiles, extractPublicIdFromUrl } = require('../config/cloudinary');

    // Delete user's posts and their media from Cloudinary
    const userPosts = await Post.find({ author: user._id });
    const mediaUrls = [];
    
    // Extract all media URLs from user's posts
    userPosts.forEach(post => {
      if (post.media && Array.isArray(post.media)) {
        post.media.forEach(mediaItem => {
          if (mediaItem.url && typeof mediaItem.url === 'string') {
            mediaUrls.push(mediaItem.url);
          }
        });
      }
    });

    // Delete media files from Cloudinary if any exist
    let cloudinaryDeletionResults = [];
    if (mediaUrls.length > 0) {
      console.log(`Deleting ${mediaUrls.length} media files from Cloudinary for user ${user._id}`);
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
    
    // Delete all user's posts
    await Post.deleteMany({ author: user._id });

    // Remove user from all chats
    await Chat.updateMany(
      { participants: user._id },
      { $pull: { participants: user._id } }
    );

    // Delete empty chats (chats with less than 2 participants)
    await Chat.deleteMany({ 
      $expr: { $lt: [{ $size: '$participants' }, 2] } 
    });

    // Delete notifications related to this user
    await Notification.deleteMany({
      $or: [
        { from: user._id },
        { to: user._id }
      ]
    });

    // Delete user's avatar and cover image from Cloudinary
    const profileImageUrls = [];
    if (user.avatar) {
      profileImageUrls.push(user.avatar);
    }
    if (user.coverImage) {
      profileImageUrls.push(user.coverImage);
    }

    if (profileImageUrls.length > 0) {
      console.log(`Deleting ${profileImageUrls.length} profile images from Cloudinary for user ${user._id}`);
      const profileImageDeletionResults = await deleteMultipleFiles(profileImageUrls);
      
      // Log deletion results
      const successfulProfileDeletions = profileImageDeletionResults.filter(result => result.success);
      const failedProfileDeletions = profileImageDeletionResults.filter(result => !result.success);
      
      if (successfulProfileDeletions.length > 0) {
        console.log(`Successfully deleted ${successfulProfileDeletions.length} profile images from Cloudinary`);
      }
      
      if (failedProfileDeletions.length > 0) {
        console.log(`Failed to delete ${failedProfileDeletions.length} profile images from Cloudinary:`, failedProfileDeletions);
      }
    }

    // Finally, delete the user
    await User.findByIdAndDelete(user._id);

    res.json({ 
      success: true, 
      message: 'Акаунт амжилттай устгагдлаа' 
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Серверийн алдаа' 
    });
  }
});

// Update push token
router.post('/push-token', auth, async (req, res) => {
  try {
    const { pushToken } = req.body;
    
    if (!pushToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Push token is required' 
      });
    }

    // Update user's push token
    await User.findByIdAndUpdate(req.user._id, { pushToken });
    
    console.log(`Push token updated for user ${req.user._id}: ${pushToken}`);
    
    res.json({ 
      success: true, 
      message: 'Push token updated successfully' 
    });
  } catch (error) {
    console.error('Update push token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update push token' 
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with code
// @access  Public
router.post('/verify-email', [
  body('code')
    .isLength({ min: 5, max: 5 })
    .isNumeric()
    .withMessage('5 оронтой код оруулна уу'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Зөв имэйл оруулна уу')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Оролтын алдаа',
        errors: errors.array()
      });
    }

    const { code, email } = req.body;

    // Find user with this verification code
    const user = await User.findOne({
      email: email,
      verificationCode: code,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Баталгаажуулах код буруу эсвэл хугацаа дууссан байна'
      });
    }

    // Verify the user
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    await user.save();

    // Generate token for automatic login
    const loginToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Имэйл хаяг амжилттай баталгаажлаа',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified
        },
        token: loginToken
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Зөв имэйл оруулна уу')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Оролтын алдаа',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Энэ имэйл хаягтай хэрэглэгч олдсонгүй'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Имэйл хаяг аль хэдийн баталгаажсан байна'
      });
    }

    // Generate new verification code
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Update user with new code
    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, user.name, verificationCode);
    
    if (!emailResult.success) {
      console.error('Failed to resend verification email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
      });
    }

    res.json({
      success: true,
      message: 'Баталгаажуулах имэйл дахин илгээгдлээ'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send forgot password verification code
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Хүчинтэй имэйл хаяг оруулна уу')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Энэ имэйл хаягтай хэрэглэгч олдсонгүй'
      });
    }

    // Generate 5-digit verification code
    const verificationCode = emailService.generateVerificationCode();
    
    // Store verification code in user document with expiration (10 minutes)
    user.passwordResetCode = verificationCode;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, user.name, verificationCode);
      
      res.json({
        success: true,
        message: 'Нууц үг сэргээх код имэйл хаяг руу илгээгдлээ',
        data: {
          email: email
        }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clear the reset code if email fails
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      res.status(500).json({
        success: false,
        message: 'Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify reset code and allow password reset
// @access  Public
router.post('/verify-reset-code', [
  body('email').isEmail().withMessage('Хүчинтэй имэйл хаяг оруулна уу'),
  body('code').isLength({ min: 5, max: 5 }).withMessage('5 оронтой код оруулна уу')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { email, code } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Энэ имэйл хаягтай хэрэглэгч олдсонгүй'
      });
    }

    // Check if reset code exists and is not expired
    if (!user.passwordResetCode || !user.passwordResetExpires) {
      return res.status(400).json({
        success: false,
        message: 'Нууц үг сэргээх код олдсонгүй'
      });
    }

    if (new Date() > user.passwordResetExpires) {
      // Clear expired code
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Нууц үг сэргээх код хүчингүй болсон'
      });
    }

    // Verify code
    if (user.passwordResetCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Буруу код оруулсан'
      });
    }

    // Code is valid - generate temporary token for password reset
    const resetToken = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Код зөв байна',
      data: {
        resetToken: resetToken,
        email: email
      }
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with new password
// @access  Public (with reset token)
router.post('/reset-password', [
  body('resetToken').notEmpty().withMessage('Reset token шаардлагатай'),
  body('newPassword').isLength({ min: 6 }).withMessage('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { resetToken, newPassword } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({
        success: false,
        message: 'Хүчингүй reset token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    // Check if reset code still exists (additional security)
    if (!user.passwordResetCode) {
      return res.status(400).json({
        success: false,
        message: 'Нууц үг сэргээх код хүчингүй болсон'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('🔄 Password reset - New password hashed successfully');

    // Update password and clear reset code using updateOne to avoid pre-save hook
    await User.updateOne(
      { _id: user._id },
      { 
        password: hashedPassword,
        passwordResetCode: undefined,
        passwordResetExpires: undefined
      }
    );
    console.log('✅ Password reset - User updated successfully');

    // Fetch updated user
    const updatedUser = await User.findById(user._id);
    console.log('✅ Password reset - Updated user fetched');

    // Generate new JWT token for automatic login
    const token = generateToken(updatedUser._id);

    res.json({
      success: true,
      message: 'Нууц үг амжилттай сэргээгдлээ',
      data: {
        token: token,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          isVerified: updatedUser.isVerified,
          emailVerified: updatedUser.emailVerified
        }
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Одоогийн нууц үг оруулна уу'),
  body('newPassword').isLength({ min: 6 }).withMessage('Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой')
], async (req, res) => {
  try {
    console.log('🔄 Change password request received for user:', req.user._id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { currentPassword, newPassword } = req.body;
    console.log('🔄 Password change request - current password length:', currentPassword.length);
    console.log('🔄 Password change request - new password length:', newPassword.length);

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('❌ User not found:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    console.log('✅ User found:', user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    console.log('🔄 Current password validation result:', isCurrentPasswordValid);
    
    if (!isCurrentPasswordValid) {
      console.log('❌ Current password is invalid');
      return res.status(400).json({
        success: false,
        message: 'Одоогийн нууц үг буруу байна'
      });
    }

    // Check if new password is same as current
    const isNewPasswordSame = await user.comparePassword(newPassword);
    console.log('🔄 New password same as current check:', isNewPasswordSame);
    
    if (isNewPasswordSame) {
      console.log('❌ New password is same as current password');
      return res.status(400).json({
        success: false,
        message: 'Шинэ нууц үг нь одоогийн нууц үгтэй адил байж болохгүй'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('✅ New password hashed successfully');

    // Update password
    user.password = hashedPassword;
    await user.save();
    console.log('✅ Password updated successfully in database');

    res.json({
      success: true,
      message: 'Нууц үг амжилттай солигдлоо'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   GET /api/auth/privacy-settings
// @desc    Get user privacy settings
// @access  Private
router.get('/privacy-settings', auth, async (req, res) => {
  console.log('GET /privacy-settings called');
  try {
    // Find or create privacy settings for the user
    let privacySettings = await PrivacySettings.findOne({ userId: req.user._id });
    
    if (!privacySettings) {
      // Create default privacy settings if none exist
      privacySettings = new PrivacySettings({
        userId: req.user._id,
        isPrivateAccount: false,
        showProfileInSearch: true,
        allowMessagesFromStrangers: true,
        showOnlineStatus: true,
        showLastSeen: true,
        allowProfileViews: true,
        allowPostComments: true,
        allowEventInvites: true
      });
      await privacySettings.save();
    }

    console.log('Privacy settings found:', privacySettings);
    res.json({
      success: true,
      data: {
        isPrivateAccount: privacySettings.isPrivateAccount,
        showProfileInSearch: privacySettings.showProfileInSearch,
        allowMessagesFromStrangers: privacySettings.allowMessagesFromStrangers,
        showOnlineStatus: privacySettings.showOnlineStatus,
        showLastSeen: privacySettings.showLastSeen,
        allowProfileViews: privacySettings.allowProfileViews,
        allowPostComments: privacySettings.allowPostComments,
        allowEventInvites: privacySettings.allowEventInvites
      }
    });

  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

// @route   PUT /api/auth/privacy-settings
// @desc    Update user privacy settings
// @access  Private
router.put('/privacy-settings', auth, async (req, res) => {
  console.log('PUT /privacy-settings called with body:', req.body);
  try {
    const {
      isPrivateAccount,
      showProfileInSearch,
      allowMessagesFromStrangers,
      showOnlineStatus,
      showLastSeen,
      allowProfileViews,
      allowPostComments,
      allowEventInvites
    } = req.body;

    // Find or create privacy settings
    let privacySettings = await PrivacySettings.findOne({ userId: req.user._id });
    
    if (!privacySettings) {
      privacySettings = new PrivacySettings({ userId: req.user._id });
    }

    // Update only the fields that are provided
    if (typeof isPrivateAccount === 'boolean') {
      privacySettings.isPrivateAccount = isPrivateAccount;
    }
    if (typeof showProfileInSearch === 'boolean') {
      privacySettings.showProfileInSearch = showProfileInSearch;
    }
    if (typeof allowMessagesFromStrangers === 'boolean') {
      privacySettings.allowMessagesFromStrangers = allowMessagesFromStrangers;
    }
    if (typeof showOnlineStatus === 'boolean') {
      privacySettings.showOnlineStatus = showOnlineStatus;
    }
    if (typeof showLastSeen === 'boolean') {
      privacySettings.showLastSeen = showLastSeen;
    }
    if (typeof allowProfileViews === 'boolean') {
      privacySettings.allowProfileViews = allowProfileViews;
    }
    if (typeof allowPostComments === 'boolean') {
      privacySettings.allowPostComments = allowPostComments;
    }
    if (typeof allowEventInvites === 'boolean') {
      privacySettings.allowEventInvites = allowEventInvites;
    }

    await privacySettings.save();

    console.log('Updated privacy settings:', privacySettings);

    res.json({
      success: true,
      message: 'Нууцлалын тохиргоо амжилттай шинэчлэгдлээ',
      data: {
        isPrivateAccount: privacySettings.isPrivateAccount,
        showProfileInSearch: privacySettings.showProfileInSearch,
        allowMessagesFromStrangers: privacySettings.allowMessagesFromStrangers,
        showOnlineStatus: privacySettings.showOnlineStatus,
        showLastSeen: privacySettings.showLastSeen,
        allowProfileViews: privacySettings.allowProfileViews,
        allowPostComments: privacySettings.allowPostComments,
        allowEventInvites: privacySettings.allowEventInvites
      }
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
});

module.exports = router; 
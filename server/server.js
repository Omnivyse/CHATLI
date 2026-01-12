const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

// Import security middleware
const { 
  sanitizeInput, 
  securityLogger, 
  authLimiter, 
  sensitiveOperationLimiter, 
  fileUploadLimiter, 
  apiLimiter,
  cspMiddleware 
} = require('./middleware/security');

// Debug environment loading
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'Not Railway');
console.log('RAILWAY_DOMAIN:', process.env.RAILWAY_DOMAIN || 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (hidden for security)' : 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ Not set');

// Warn if email is not configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️ WARNING: Email service is not configured!');
  console.warn('⚠️ Email verification and password reset will not work.');
  console.warn('⚠️ For Railway: Set EMAIL_USER and EMAIL_PASS as environment variables in Railway dashboard');
  console.warn('⚠️ For local: Set EMAIL_USER and EMAIL_PASS in config.env file');
}

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const eventRoutes = require('./routes/events');
const eventChatRoutes = require('./routes/eventChat');
const appRoutes = require('./routes/app');

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification');

const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO configuration with security
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, 'https://chatli.vercel.app', 'https://chatli-mobile.vercel.app', 'https://www.chatli.mn', 'https://chatli.mn'].filter(Boolean)
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:19006"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Device-Fingerprint"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // Reduced from 1e8 to 1MB for security
  allowRequest: (req, callback) => {
    try {
      // Enhanced request validation with better error handling
      const origin = req.headers.origin;
      const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://chatli.vercel.app', 'https://chatli-mobile.vercel.app', 'https://www.chatli.mn', 'https://chatli.mn'].filter(Boolean)
        : ["http://localhost:3000", "http://localhost:3001", "http://localhost:19006"];
      
      // Always allow requests with no origin (mobile apps, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log blocked origins for debugging
      console.log(`🚫 Socket.IO blocked origin: ${origin}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
      
      // Block the request
      return callback(new Error('Origin not allowed'), false);
    } catch (error) {
      console.error('Socket.IO allowRequest error:', error);
      // In case of error, allow the request to prevent crashes
      return callback(null, true);
    }
  }
});

app.set('io', io);

// Enhanced Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Apply security middleware early
app.use(securityLogger);
app.use(cspMiddleware);

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.chatli.mn',
      'https://chatli.mn',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('🚫 CORS blocked origin:', origin);
        console.log('✅ Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'), false);
      }
    } else {
      // Allow all origins in development
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Fingerprint', 'X-CSRF-Token'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Apply input sanitization to all routes
app.use(sanitizeInput);

// Enhanced rate limiting with different limits for different operations
app.use('/api/', apiLimiter);

// Stricter rate limiting for sensitive endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', sensitiveOperationLimiter);
app.use('/api/auth/reset-password', sensitiveOperationLimiter);
app.use('/api/admin/login', sensitiveOperationLimiter);
app.use('/api/upload', fileUploadLimiter);

// Performance monitoring middleware
const performanceLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests (> 1 second)
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
};

app.use(performanceLogger);

// Cleanup old secret post attempt records to prevent memory leaks
const cleanupSecretPostAttempts = () => {
  try {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    if (app.locals) {
      const keysToRemove = [];
      Object.keys(app.locals).forEach(key => {
        if (key.startsWith('secret_post_attempts_')) {
          const attempts = app.locals[key];
          if (attempts && attempts.lastAttempt && attempts.lastAttempt < oneHourAgo) {
            keysToRemove.push(key);
          }
        }
      });
      
      keysToRemove.forEach(key => {
        delete app.locals[key];
      });
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old secret post attempt records`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up secret post attempts:', error);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupSecretPostAttempts, 30 * 60 * 1000);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' })); // Reduced from 20mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with enhanced security
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/event-chats', eventChatRoutes);
app.use('/api/app', appRoutes);

// Health check with security
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    socketConnections: connectionCount,
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// WebSocket health check with security
app.get('/api/socket-health', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket server is running',
    timestamp: new Date().toISOString(),
    socketConnections: connectionCount,
    connectedUsers: Array.from(connectedUsers.keys()).length, // Don't expose actual user IDs
    environment: process.env.NODE_ENV,
    railway: !!process.env.RAILWAY_ENVIRONMENT
  });
});

// Simple WebSocket test endpoint
app.get('/api/socket-test', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket test endpoint',
    socketUrl: process.env.NODE_ENV === 'production' 
      ? 'https://chatli-production.up.railway.app'
      : 'http://localhost:5000',
    instructions: 'Use this URL to test WebSocket connection in your mobile app'
  });
});

// Socket.IO connection handling with enhanced security
const connectedUsers = new Map();
let connectionCount = 0;

// Add error handling for Socket.IO server
io.on('error', (error) => {
  console.error('🚨 Socket.IO server error:', error);
});

io.on('connect_error', (error) => {
  console.error('🚨 Socket.IO connection error:', error);
});

io.engine.on('connection_error', (error) => {
  console.error('🚨 Engine.IO connection error:', error);
});

io.on('connection', (socket) => {
  try {
    connectionCount++;
    console.log(`🔌 User connected: ${socket.id} (Total: ${connectionCount})`);
    console.log(`🚂 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not Railway'}`);
    
    // Log memory usage every 50 connections
    if (connectionCount % 50 === 0) {
      const memUsage = process.memoryUsage();
      console.log(`📊 Memory usage with ${connectionCount} connections:`, {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      });
    }

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      connectionCount--;
      console.log(`🔌 User disconnected: ${socket.id} (Reason: ${reason}, Total: ${connectionCount})`);
      
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Update user status to offline
        User.findByIdAndUpdate(socket.userId, {
          status: 'offline',
          lastSeen: new Date()
        }).catch(err => console.error('Error updating user status:', err));
        
        // Notify other users about offline status
        socket.broadcast.emit('user_status_change', {
          userId: socket.userId,
          status: 'offline'
        });
      }
    });

    // Enhanced user authentication with security checks
    socket.on('authenticate', async (token) => {
      try {
        const jwt = require('jsonwebtoken');
        
        // Validate token structure first
        if (!token || typeof token !== 'string' || !token.includes('.')) {
          console.warn(`🚫 Invalid token format from socket ${socket.id}`);
          socket.emit('authentication_failed', { message: 'Invalid token format' });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Enhanced token validation
        if (!decoded.userId || !decoded.jti || !decoded.aud || !decoded.iss) {
          console.warn(`🚫 Token missing required claims from socket ${socket.id}`);
          socket.emit('authentication_failed', { message: 'Invalid token claims' });
          return;
        }

        if (decoded.aud !== 'chatli-app' || decoded.iss !== 'chatli-server') {
          console.warn(`🚫 Invalid token audience/issuer from socket ${socket.id}`);
          socket.emit('authentication_failed', { message: 'Invalid token' });
          return;
        }

        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && !user.deletedAt && user.status !== 'banned' && user.status !== 'suspended') {
          socket.userId = user._id.toString();
          socket.user = user;
          socket.tokenId = decoded.jti;
          connectedUsers.set(user._id.toString(), socket.id);
          
          // Update user status to online
          await User.findByIdAndUpdate(user._id, {
            status: 'online',
            lastSeen: new Date()
          });

          // Join user to their personal room
          socket.join(`user_${user._id}`);
          
          // Notify other users about online status
          socket.broadcast.emit('user_status_change', {
            userId: user._id,
            status: 'online'
          });

          // Emit authentication success
          socket.emit('authenticated', { 
            userId: user._id, 
            username: user.username,
            tokenId: decoded.jti 
          });

          console.log(`🔐 Socket authenticated: ${user.name} (${user._id}) - Token: ${decoded.jti}`);
        } else {
          console.warn(`🚫 User not found or restricted: ${decoded.userId}`);
          socket.emit('authentication_failed', { message: 'User not found or restricted' });
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authentication_failed', { message: 'Authentication failed' });
      }
    });

    // Enhanced chat room joining with authorization
    socket.on('join_chat', async (chatId) => {
      try {
        if (!socket.userId) {
          console.warn(`🚫 Unauthenticated socket ${socket.id} trying to join chat`);
          return;
        }

        // Validate chatId format
        if (!chatId || typeof chatId !== 'string' || !require('mongoose').Types.ObjectId.isValid(chatId)) {
          console.warn(`🚫 Invalid chat ID format: ${chatId}`);
          return;
        }

        // TODO: Add authorization check here to verify user can access this chat
        // For now, we'll just join the room
        socket.join(`chat_${chatId}`);
        console.log(`🎯 User joined chat: ${chatId}`);
        
        // Send confirmation back to the user
        socket.emit('chat_joined', {
          chatId,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
        
        // Notify other users in the chat that someone joined
        socket.to(`chat_${chatId}`).emit('user_joined_chat', {
          chatId,
          userId: socket.userId,
          userName: socket.user?.name,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

  // Test chat join event with validation
  socket.on('test_chat_join', (data) => {
    if (!socket.userId) {
      console.warn(`🚫 Unauthenticated socket ${socket.id} trying to test chat join`);
      return;
    }

    console.log('🧪 Test chat join received:', data);
    const { chatId, userId } = data;
    
    // Validate data
    if (!chatId || !userId || userId !== socket.userId) {
      console.warn(`🚫 Invalid test chat join data from socket ${socket.id}`);
      return;
    }
    
    // Send test response back
    socket.emit('test_chat_join_response', {
      success: true,
      chatId,
      userId,
      message: 'Chat join test successful',
      timestamp: new Date().toISOString()
    });
    
    // Notify other users in the chat that someone joined
    socket.to(`chat_${chatId}`).emit('user_joined_chat', {
      chatId,
      userId: socket.userId,
      userName: socket.user?.name,
      timestamp: new Date().toISOString()
    });
  });

  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    if (!socket.userId) return;
    
    socket.leave(`chat_${chatId}`);
    console.log(`User left chat: ${chatId}`);
  });

  // Enhanced message sending with validation
  socket.on('send_message', async (data) => {
    try {
      if (!socket.userId) {
        console.warn(`🚫 Unauthenticated socket ${socket.id} trying to send message`);
        return;
      }

      const { chatId, message } = data;
      
      // Validate data
      if (!chatId || !message || typeof message !== 'object') {
        console.warn(`🚫 Invalid message data from socket ${socket.id}`);
        return;
      }

      // Validate chatId format
      if (!require('mongoose').Types.ObjectId.isValid(chatId)) {
        console.warn(`🚫 Invalid chat ID format: ${chatId}`);
        return;
      }

      // TODO: Add authorization check here to verify user can send to this chat
      
      // Broadcast message to chat room
      socket.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message
      });
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Typing indicator with validation
  socket.on('typing_start', (chatId) => {
    if (!socket.userId || !chatId) return;
    
    socket.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (chatId) => {
    if (!socket.userId || !chatId) return;
    
    socket.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: socket.userId,
      isTyping: false
    });
  });

  // Enhanced reaction handling with validation
  socket.on('add_reaction', (data) => {
    try {
      if (!socket.userId) {
        console.warn(`🚫 Unauthenticated socket ${socket.id} trying to add reaction`);
        return;
      }

      const { chatId, messageId, userId, emoji, userName } = data;
      
      // Validate data
      if (!chatId || !messageId || !userId || !emoji || userId !== socket.userId) {
        console.warn(`🚫 Invalid reaction data from socket ${socket.id}`);
        return;
      }

      console.log(`🔥 REACTION ADDED: ${emoji} to message ${messageId} in chat ${chatId} by user ${userName} (${userId})`);
      
      // Get the number of users in the chat room
      const chatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
      const userCount = chatRoom ? chatRoom.size : 0;
      
      // Broadcast reaction to ALL users in the chat room
      io.to(`chat_${chatId}`).emit('reaction_added', {
        chatId,
        messageId,
        userId,
        emoji,
        userName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Reaction broadcasted successfully to ${userCount} users`);
      
      // Send acknowledgment to sender
      socket.emit('reaction_added_ack', {
        success: true,
        messageId,
        emoji,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Add reaction error:', error);
      socket.emit('reaction_added_ack', {
        success: false,
        error: error.message
      });
    }
  });

  // Remove reaction with validation
  socket.on('remove_reaction', (data) => {
    try {
      if (!socket.userId) {
        console.warn(`🚫 Unauthenticated socket ${socket.id} trying to remove reaction`);
        return;
      }

      const { chatId, messageId, userId, emoji } = data;
      
      // Validate data
      if (!chatId || !messageId || !userId || !emoji || userId !== socket.userId) {
        console.warn(`🚫 Invalid reaction removal data from socket ${socket.id}`);
        return;
      }

      console.log(`🗑️ REACTION REMOVED: ${emoji} from message ${messageId} in chat ${chatId} by user ${userId}`);
      
      // Get the number of users in the chat room
      const chatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
      const userCount = chatRoom ? chatRoom.size : 0;
      
      // Broadcast reaction removal to ALL users in the chat room
      io.to(`chat_${chatId}`).emit('reaction_removed', {
        chatId,
        messageId,
        userId,
        emoji,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Reaction removal broadcasted successfully to ${userCount} users`);
      
      // Send acknowledgment to sender
      socket.emit('reaction_removed_ack', {
        success: true,
        messageId,
        emoji,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Remove reaction error:', error);
      socket.emit('reaction_removed_ack', {
        success: false,
        error: error.message
      });
    }
  });

  // Delete message with validation
  socket.on('delete_message', (data) => {
    try {
      if (!socket.userId) {
        console.warn(`🚫 Unauthenticated socket ${socket.id} trying to delete message`);
        return;
      }

      const { chatId, messageId, userId } = data;
      
      // Validate data
      if (!chatId || !messageId || !userId || userId !== socket.userId) {
        console.warn(`🚫 Invalid message deletion data from socket ${socket.id}`);
        return;
      }

      console.log(`🗑️ MESSAGE DELETED: message ${messageId} in chat ${chatId} by user ${userId}`);
      
      // Get the number of users in the chat room
      const chatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
      const userCount = chatRoom ? chatRoom.size : 0;
      
      // Broadcast message deletion to ALL users in the chat room
      io.to(`chat_${chatId}`).emit('message_deleted', {
        chatId,
        messageId,
        userId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Message deletion broadcasted successfully to ${userCount} users`);
      
      // Send acknowledgment to sender
      socket.emit('message_deleted_ack', {
        success: true,
        messageId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Delete message error:', error);
      socket.emit('message_deleted_ack', {
        success: false,
        error: error.message
      });
    }
  });

  // Test reaction event with validation
  socket.on('test_reaction', (data) => {
    if (!socket.userId) {
      console.warn(`🚫 Unauthenticated socket ${socket.id} trying to test reaction`);
      return;
    }

    console.log(`🧪 TEST REACTION EVENT RECEIVED:`, data);
    socket.to(`chat_${data.chatId}`).emit('test_reaction_received', {
      message: 'Test reaction event received and broadcasted',
      timestamp: new Date().toISOString(),
      data
    });
  });

  // Real-time notification for like post with validation
  socket.on('like_post', async (data) => {
    if (!socket.userId) {
      console.warn(`🚫 Unauthenticated socket ${socket.id} trying to like post`);
      return;
    }

    const { postId, likedBy, postOwner } = data;
    
    // Validate data
    if (!postId || !likedBy || !postOwner || likedBy !== socket.userId) {
      console.warn(`🚫 Invalid like post data from socket ${socket.id}`);
      return;
    }

    try {
      // Don't send notification if user is liking their own post
      if (likedBy === postOwner) {
        console.log(`🔔 Skipping like notification - user liking their own post`);
        return;
      }
      
      // Check if notification already exists (within last 5 minutes)
      const existingNotification = await Notification.findOne({
        user: postOwner,
        type: 'like',
        from: likedBy,
        post: postId,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });
      
      if (existingNotification) {
        console.log(`🔔 Like notification already exists for user_${postOwner}, skipping duplicate`);
        return;
      }
      
      // Create notification in DB
      const notification = await Notification.create({
        user: postOwner,
        type: 'like',
        from: likedBy,
        post: postId,
        createdAt: new Date(),
      });
      
      // Emit real-time notification to post owner
      io.to(`user_${postOwner}`).emit('notification', {
        _id: notification._id,
        type: 'like',
        from: likedBy,
        post: postId,
        createdAt: new Date(),
        isRead: false,
      });
      console.log(`🔔 Like notification sent to user_${postOwner}`);
    } catch (err) {
      console.error('Error sending like notification:', err);
    }
  });

  // Real-time notification for comment post with validation
  socket.on('comment_post', async (data) => {
    if (!socket.userId) {
      console.warn(`🚫 Unauthenticated socket ${socket.id} trying to comment post`);
      return;
    }

    const { postId, commentBy, postOwner, commentText } = data;
    
    // Validate data
    if (!postId || !commentBy || !postOwner || !commentText || commentBy !== socket.userId) {
      console.warn(`🚫 Invalid comment post data from socket ${socket.id}`);
      return;
    }

    try {
      // Check if notification already exists (within last 5 minutes)
      const existingNotification = await Notification.findOne({
        user: postOwner,
        type: 'comment',
        from: commentBy,
        post: postId,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });
      
      if (existingNotification) {
        console.log(`🔔 Comment notification already exists for user_${postOwner}, skipping duplicate`);
        return;
      }
      
      const notification = await Notification.create({
        user: postOwner,
        type: 'comment',
        from: commentBy,
        post: postId,
        comment: commentText,
        createdAt: new Date(),
      });
      
      io.to(`user_${postOwner}`).emit('notification', {
        _id: notification._id,
        type: 'comment',
        from: commentBy,
        post: postId,
        comment: commentText,
        createdAt: new Date(),
        isRead: false,
      });
      console.log(`🔔 Comment notification sent to user_${postOwner}`);
    } catch (err) {
      console.error('Error sending comment notification:', err);
    }
  });

  // Real-time notification for follow user with validation
  socket.on('follow_user', async (data) => {
    if (!socket.userId) {
      console.warn(`🚫 Unauthenticated socket ${socket.id} trying to follow user`);
      return;
    }

    const { followedUserId, followedBy } = data;
    
    // Validate data
    if (!followedUserId || !followedBy || followedBy !== socket.userId) {
      console.warn(`🚫 Invalid follow user data from socket ${socket.id}`);
      return;
    }

    try {
      // Check if notification already exists (within last 5 minutes)
      const existingNotification = await Notification.findOne({
        user: followedUserId,
        type: 'follow',
        from: followedBy,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });
      
      if (existingNotification) {
        console.log(`🔔 Follow notification already exists for user_${followedUserId}, skipping duplicate`);
        return;
      }
      
      const notification = await Notification.create({
        user: followedUserId,
        type: 'follow',
        from: followedBy,
        createdAt: new Date(),
      });
      
      io.to(`user_${followedUserId}`).emit('notification', {
        _id: notification._id,
        type: 'follow',
        from: followedBy,
        createdAt: new Date(),
        isRead: false,
      });
      console.log(`🔔 Follow notification sent to user_${followedUserId}`);
    } catch (err) {
      console.error('Error sending follow notification:', err);
    }
  });

  } catch (error) {
    console.error('🚨 Socket connection setup error:', error);
    // Don't crash the server, just log the error
  }
});

// MongoDB connection with enhanced security settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Enhanced security options
      ssl: process.env.NODE_ENV === 'production',
      sslValidate: process.env.NODE_ENV === 'production',
      // Connection monitoring
      monitorCommands: true,
      // Connection event handling - removed unsupported options
      bufferCommands: false
      // Removed: bufferMaxEntries: 0 (not supported in newer MongoDB versions)
    });
    
    console.log('MongoDB холбогдлоо');
    console.log('Connected to MongoDB Atlas');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    mongoose.connection.on('close', () => {
      console.log('MongoDB connection closed');
    });
    
    return conn;
  } catch (error) {
    console.error('MongoDB холболтын алдаа:', error.message);
    console.error('Full error:', error);
    
    // Try fallback connection with minimal options
    try {
      console.log('Trying fallback connection...');
      const fallbackConn = await mongoose.connect(process.env.MONGODB_URI, {
        // Minimal options for compatibility
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000
      });
      console.log('MongoDB connected with fallback settings');
      return fallbackConn;
    } catch (fallbackError) {
      console.error('Fallback connection failed:', fallbackError.message);
      process.exit(1);
    }
  }
};

// Connect to MongoDB
connectDB();

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  res.status(500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Сервер ${PORT} порт дээр ажиллаж байна`);
  console.log(`Орчны горим: ${process.env.NODE_ENV}`);
  console.log(`🔒 Security features enabled: Input sanitization, Rate limiting, Enhanced JWT, Socket validation`);
  console.log(`🚂 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not Railway'}`);
  console.log(`🌐 Server URL: ${process.env.NODE_ENV === 'production' ? 'https://' + process.env.RAILWAY_DOMAIN : 'http://localhost:' + PORT}`);
});

// Graceful shutdown with enhanced cleanup
process.on('SIGTERM', () => {
  console.log('SIGTERM хүлээн авлаа. Серверийг унтрааж байна...');
  
  // Close all socket connections
  io.close(() => {
    console.log('Socket.IO server closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      
      // Close MongoDB connection
      mongoose.connection.close(() => {
        console.log('MongoDB холболт тасарлаа');
        process.exit(0);
      });
    });
  });
});

// Add global error handlers to prevent server from crashing
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  // Log to external monitoring service
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection:', reason);
  // Log to external monitoring service
}); 
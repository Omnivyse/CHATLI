const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

// Debug environment loading
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification'); // Added Notification model import

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, 'https://chatli.vercel.app', 'https://chatli-mobile.vercel.app'].filter(Boolean)
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:19006"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8,
  allowRequest: (req, callback) => {
    // Allow all requests for Railway
    callback(null, true);
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
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
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
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    } else {
      // Allow all origins in development
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting - Relaxed for production
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 1000 : 10000, // Increased from 100 to 1000 for production
  message: {
    success: false,
    message: 'Хэт олон хүсэлт илгээгдлээ. Дахин оролдоно уу.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and analytics
  skip: (req) => req.path === '/api/health' || req.path.includes('/analytics')
});

// Apply rate limiting to all API routes except analytics
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 50 : 100, // Increased from 5 to 50 for production
  message: {
    success: false,
    message: 'Хэт олон нэвтрэх оролдлого. 15 минутын дараа дахин оролдоно уу.'
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', authLimiter);

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
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Сервер ажиллаж байна',
    timestamp: new Date().toISOString(),
    socketConnections: connectionCount,
    environment: process.env.NODE_ENV
  });
});

// WebSocket health check
app.get('/api/socket-health', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket сервер ажиллаж байна',
    timestamp: new Date().toISOString(),
    socketConnections: connectionCount,
    connectedUsers: Array.from(connectedUsers.keys()),
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

// Socket.IO connection handling
const connectedUsers = new Map();
let connectionCount = 0;

io.on('connection', (socket) => {
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

  // Authenticate user
  socket.on('authenticate', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        socket.userId = user._id.toString();
        socket.user = user;
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

        console.log('User authenticated:', user.name);
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  });

  // Join chat room
  socket.on('join_chat', (chatId) => {
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
  });

  // Test chat join event
  socket.on('test_chat_join', (data) => {
    console.log('🧪 Test chat join received:', data);
    const { chatId, userId } = data;
    
    // Send test response back
    socket.emit('test_chat_join_response', {
      success: true,
      chatId,
      userId,
      message: 'Chat join test successful',
      timestamp: new Date().toISOString()
    });
  });

  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User left chat: ${chatId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, message } = data;
      
      // Broadcast message to chat room
      socket.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message
      });
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Typing indicator
  socket.on('typing_start', (chatId) => {
    socket.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (chatId) => {
    socket.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: socket.userId,
      isTyping: false
    });
  });

  // Add reaction
  socket.on('add_reaction', (data) => {
    try {
      const { chatId, messageId, userId, emoji, userName } = data;
      console.log(`🔥 REACTION ADDED: ${emoji} to message ${messageId} in chat ${chatId} by user ${userName} (${userId})`);
      console.log(`📡 Broadcasting to chat room: chat_${chatId}`);
      
      // Get the number of users in the chat room
      const chatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
      const userCount = chatRoom ? chatRoom.size : 0;
      console.log(`👥 Users in chat room: ${userCount}`);
      
      // Log all users in the room for debugging
      if (chatRoom) {
        const userIds = Array.from(chatRoom);
        console.log(`👥 User IDs in chat room:`, userIds);
      }
      
      // Broadcast reaction to ALL users in the chat room (including sender for confirmation)
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

  // Remove reaction
  socket.on('remove_reaction', (data) => {
    try {
      const { chatId, messageId, userId, emoji } = data;
      console.log(`🗑️ REACTION REMOVED: ${emoji} from message ${messageId} in chat ${chatId} by user ${userId}`);
      console.log(`📡 Broadcasting to chat room: chat_${chatId}`);
      
      // Get the number of users in the chat room
      const chatRoom = io.sockets.adapter.rooms.get(`chat_${chatId}`);
      const userCount = chatRoom ? chatRoom.size : 0;
      console.log(`👥 Users in chat room: ${userCount}`);
      
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

  // Test event for debugging
  socket.on('test_reaction', (data) => {
    console.log(`🧪 TEST REACTION EVENT RECEIVED:`, data);
    socket.to(`chat_${data.chatId}`).emit('test_reaction_received', {
      message: 'Test reaction event received and broadcasted',
      timestamp: new Date().toISOString(),
      data
    });
  });

  // Real-time notification for like post
  socket.on('like_post', async (data) => {
    const { postId, likedBy, postOwner } = data;
    try {
      // Create notification in DB (optional)
      await Notification.create({
        user: postOwner,
        type: 'like',
        from: likedBy,
        post: postId,
        createdAt: new Date(),
      });
      // Emit real-time notification to post owner
      io.to(`user_${postOwner}`).emit('notification', {
        type: 'like',
        from: likedBy,
        post: postId,
        createdAt: new Date(),
      });
      console.log(`🔔 Like notification sent to user_${postOwner}`);
    } catch (err) {
      console.error('Error sending like notification:', err);
    }
  });

  // Real-time notification for comment post
  socket.on('comment_post', async (data) => {
    const { postId, commentBy, postOwner, commentText } = data;
    try {
      await Notification.create({
        user: postOwner,
        type: 'comment',
        from: commentBy,
        post: postId,
        comment: commentText,
        createdAt: new Date(),
      });
      io.to(`user_${postOwner}`).emit('notification', {
        type: 'comment',
        from: commentBy,
        post: postId,
        comment: commentText,
        createdAt: new Date(),
      });
      console.log(`🔔 Comment notification sent to user_${postOwner}`);
    } catch (err) {
      console.error('Error sending comment notification:', err);
    }
  });

  // Real-time notification for follow user
  socket.on('follow_user', async (data) => {
    const { followedUserId, followedBy } = data;
    try {
      await Notification.create({
        user: followedUserId,
        type: 'follow',
        from: followedBy,
        createdAt: new Date(),
      });
      io.to(`user_${followedUserId}`).emit('notification', {
        type: 'follow',
        from: followedBy,
        createdAt: new Date(),
      });
      console.log(`🔔 Follow notification sent to user_${followedUserId}`);
    } catch (err) {
      console.error('Error sending follow notification:', err);
    }
  });
});

// MongoDB connection with simplified settings for Railway
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
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
    
    return conn;
  } catch (error) {
    console.error('MongoDB холболтын алдаа:', error.message);
    console.error('Full error:', error);
    
    // Try fallback connection with minimal options
    try {
      console.log('Trying fallback connection...');
      const fallbackConn = await mongoose.connect(process.env.MONGODB_URI);
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Серверийн алдаа'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint олдсонгүй'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Сервер ${PORT} порт дээр ажиллаж байна`);
  console.log(`Орчны горим: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM хүлээн авлаа. Серверийг унтрааж байна...');
  server.close(() => {
    console.log('Сервер унтрагдлаа');
    mongoose.connection.close(() => {
      console.log('MongoDB холболт тасарлаа');
      process.exit(0);
    });
  });
});

// Add global error handlers to prevent server from crashing
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
}); 
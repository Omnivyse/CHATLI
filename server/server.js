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

// Import models
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 10000, // much higher limit for dev
  message: {
    success: false,
    message: 'Хэт олон хүсэлт илгээгдлээ. Дахин оролдоно уу.'
  }
});
if (isProduction) {
  app.use('/api/', limiter);
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Сервер ажиллаж байна',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
    console.log(`User joined chat: ${chatId}`);
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

      // Update unread counts for other participants
      const Chat = require('./models/Chat');
      const chat = await Chat.findById(chatId);
      
      if (chat) {
        const otherParticipants = chat.participants.filter(
          participant => participant.toString() !== socket.userId
        );

        for (const participantId of otherParticipants) {
          await chat.updateUnreadCount(participantId, true);
        }
      }
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

  // Disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Notify other users about offline status
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB холбогдлоо');
})
.catch((error) => {
  console.error('MongoDB холболтын алдаа:', error);
  process.exit(1);
});

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
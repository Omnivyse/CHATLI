// Simple WebSocket Test Script for Railway
// Run this with: node test-socket.js

const io = require('socket.io-client');

const SOCKET_URL = 'https://chatli-production.up.railway.app';

console.log('🔌 Testing WebSocket connection to Railway...');
console.log('🚂 Socket URL:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Successfully connected to Railway WebSocket!');
  console.log('🔗 Socket ID:', socket.id);
  
  // Test authentication
  socket.emit('authenticate', 'test-token');
  
  // Test joining a chat
  socket.emit('join_chat', 'test-chat-id');
  
  // Test reaction
  socket.emit('add_reaction', {
    chatId: 'test-chat-id',
    messageId: 'test-message-id',
    userId: 'test-user-id',
    emoji: '❤️',
    userName: 'Test User'
  });
  
  console.log('🧪 All test events sent successfully');
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.error('🔍 Error details:', error);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('🚂 Railway error:', error);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('⏰ Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 15000); 
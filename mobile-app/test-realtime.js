// Real-time Reaction Test Script
// This script simulates two users in a chat to test reaction synchronization

const io = require('socket.io-client');

const SOCKET_URL = 'https://chatli-production.up.railway.app';
const CHAT_ID = 'test-chat-123';

console.log('🧪 Testing real-time reaction synchronization...');
console.log('🚂 Socket URL:', SOCKET_URL);
console.log('💬 Chat ID:', CHAT_ID);

// Simulate User 1 (Mobile)
const user1 = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

// Simulate User 2 (Web)
const user2 = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

let user1Connected = false;
let user2Connected = false;

// User 1 (Mobile) setup
user1.on('connect', () => {
  console.log('📱 User 1 (Mobile) connected:', user1.id);
  user1Connected = true;
  
  // Authenticate user 1
  user1.emit('authenticate', 'user1-token');
  
  // Join chat
  user1.emit('join_chat', CHAT_ID);
  
  // Listen for reactions
  user1.on('reaction_added', (data) => {
    console.log('📱 User 1 received reaction:', data);
  });
  
  user1.on('reaction_removed', (data) => {
    console.log('📱 User 1 received reaction removal:', data);
  });
  
  user1.on('chat_joined', (data) => {
    console.log('📱 User 1 joined chat:', data);
  });
});

// User 2 (Web) setup
user2.on('connect', () => {
  console.log('💻 User 2 (Web) connected:', user2.id);
  user2Connected = true;
  
  // Authenticate user 2
  user2.emit('authenticate', 'user2-token');
  
  // Join chat
  user2.emit('join_chat', CHAT_ID);
  
  // Listen for reactions
  user2.on('reaction_added', (data) => {
    console.log('💻 User 2 received reaction:', data);
  });
  
  user2.on('reaction_removed', (data) => {
    console.log('💻 User 2 received reaction removal:', data);
  });
  
  user2.on('chat_joined', (data) => {
    console.log('💻 User 2 joined chat:', data);
  });
});

// Test reaction synchronization
setTimeout(() => {
  if (user1Connected && user2Connected) {
    console.log('\n🧪 Starting reaction synchronization test...');
    
    // User 2 adds a reaction to a message
    setTimeout(() => {
      console.log('💻 User 2 adding reaction...');
      user2.emit('add_reaction', {
        chatId: CHAT_ID,
        messageId: 'test-message-456',
        userId: 'user2-id',
        emoji: '❤️',
        userName: 'User 2'
      });
    }, 2000);
    
    // User 1 adds a different reaction
    setTimeout(() => {
      console.log('📱 User 1 adding reaction...');
      user1.emit('add_reaction', {
        chatId: CHAT_ID,
        messageId: 'test-message-456',
        userId: 'user1-id',
        emoji: '👍',
        userName: 'User 1'
      });
    }, 4000);
    
    // User 2 removes their reaction
    setTimeout(() => {
      console.log('💻 User 2 removing reaction...');
      user2.emit('remove_reaction', {
        chatId: CHAT_ID,
        messageId: 'test-message-456',
        userId: 'user2-id',
        emoji: '❤️'
      });
    }, 6000);
    
    // Cleanup after test
    setTimeout(() => {
      console.log('\n✅ Test completed. Disconnecting...');
      user1.disconnect();
      user2.disconnect();
      process.exit(0);
    }, 8000);
    
  } else {
    console.error('❌ Failed to connect both users');
    process.exit(1);
  }
}, 3000);

// Error handling
user1.on('connect_error', (error) => {
  console.error('❌ User 1 connection error:', error.message);
});

user2.on('connect_error', (error) => {
  console.error('❌ User 2 connection error:', error.message);
});

// Timeout
setTimeout(() => {
  console.error('⏰ Test timeout');
  user1.disconnect();
  user2.disconnect();
  process.exit(1);
}, 15000); 
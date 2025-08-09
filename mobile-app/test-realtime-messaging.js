// Test script for debugging real-time messaging issues in TestFlight
import socketService from './src/services/socket';
import apiService from './src/services/api';

console.log('🔍 Starting real-time messaging debug test...');

// Test socket connection
async function testSocketConnection(userToken) {
  console.log('\n🔌 Socket Connection Test:');
  
  try {
    console.log('🔌 Attempting to connect socket...');
    socketService.connect(userToken);
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);
      
      const checkConnection = () => {
        if (socketService.isReady()) {
          console.log('✅ Socket connected successfully');
          clearTimeout(timeout);
          resolve();
        } else {
          console.log('⏳ Waiting for socket connection...');
          setTimeout(checkConnection, 500);
        }
      };
      checkConnection();
    });
    
    console.log('📋 Socket details:', {
      isConnected: socketService.getConnectionStatus(),
      isReady: socketService.isReady(),
      socketId: socketService.socket?.id
    });
    
    return true;
  } catch (error) {
    console.error('❌ Socket connection failed:', error);
    return false;
  }
}

// Test chat room joining
async function testChatRoomJoin(chatId, userId) {
  console.log('\n🎯 Chat Room Join Test:');
  
  if (!socketService.isReady()) {
    console.log('❌ Socket not ready, cannot test chat room join');
    return false;
  }
  
  try {
    console.log('🎯 Joining chat room:', chatId);
    socketService.joinChat(chatId);
    
    // Wait for join confirmation
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Chat join timeout'));
      }, 5000);
      
      const handleChatJoined = (data) => {
        console.log('✅ Chat room joined successfully:', data);
        clearTimeout(timeout);
        socketService.off('chat_joined', handleChatJoined);
        resolve(data);
      };
      
      const handleChatJoinError = (error) => {
        console.error('❌ Chat join error:', error);
        clearTimeout(timeout);
        socketService.off('chat_join_error', handleChatJoinError);
        reject(error);
      };
      
      socketService.on('chat_joined', handleChatJoined);
      socketService.on('chat_join_error', handleChatJoinError);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Chat room join failed:', error);
    return false;
  }
}

// Test message sending via API
async function testMessageSending(chatId, messageText) {
  console.log('\n📤 Message Sending Test (API):');
  
  try {
    console.log('📤 Sending message via API:', {
      chatId,
      messageText
    });
    
    const response = await apiService.sendMessage(chatId, {
      type: 'text',
      content: { text: messageText }
    });
    
    if (response.success) {
      console.log('✅ Message sent successfully via API:', response.data.message);
      return response.data.message;
    } else {
      console.error('❌ Message sending failed:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ Message sending error:', error);
    return null;
  }
}

// Test socket message emission
async function testSocketMessageEmission(chatId, message) {
  console.log('\n📡 Socket Message Emission Test:');
  
  if (!socketService.isReady()) {
    console.log('❌ Socket not ready, cannot test message emission');
    return false;
  }
  
  try {
    console.log('📡 Emitting message via socket:', {
      chatId,
      messageId: message._id
    });
    
    socketService.sendMessage(chatId, message);
    console.log('✅ Message emitted via socket');
    
    return true;
  } catch (error) {
    console.error('❌ Socket message emission failed:', error);
    return false;
  }
}

// Test message receiving
async function testMessageReceiving(chatId, timeoutMs = 10000) {
  console.log('\n📨 Message Receiving Test:');
  
  if (!socketService.isReady()) {
    console.log('❌ Socket not ready, cannot test message receiving');
    return false;
  }
  
  try {
    console.log('📨 Waiting for messages (timeout:', timeoutMs, 'ms)...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Message receiving timeout');
        socketService.off('new_message', handleNewMessage);
        resolve(false);
      }, timeoutMs);
      
      const handleNewMessage = (data) => {
        console.log('✅ Message received via socket:', data);
        clearTimeout(timeout);
        socketService.off('new_message', handleNewMessage);
        resolve(true);
      };
      
      socketService.on('new_message', handleNewMessage);
    });
  } catch (error) {
    console.error('❌ Message receiving test failed:', error);
    return false;
  }
}

// Test push notification token
async function testPushToken() {
  console.log('\n🔑 Push Token Test:');
  
  try {
    const token = await apiService.getCurrentUser();
    if (token.success && token.data.user.pushToken) {
      console.log('✅ Push token found:', {
        tokenLength: token.data.user.pushToken.length,
        tokenPrefix: token.data.user.pushToken.substring(0, 20) + '...'
      });
      return token.data.user.pushToken;
    } else {
      console.log('⚠️ No push token found for user');
      return null;
    }
  } catch (error) {
    console.error('❌ Push token test failed:', error);
    return null;
  }
}

// Main test function
async function runRealtimeMessagingTest(chatId, userId, userToken) {
  console.log('🚀 Starting comprehensive real-time messaging test...\n');
  
  const results = {
    socketConnection: false,
    chatRoomJoin: false,
    messageSending: false,
    socketEmission: false,
    messageReceiving: false,
    pushToken: null
  };
  
  // Test socket connection
  results.socketConnection = await testSocketConnection(userToken);
  
  if (results.socketConnection) {
    // Test chat room join
    results.chatRoomJoin = await testChatRoomJoin(chatId, userId);
    
    if (results.chatRoomJoin) {
      // Test message sending
      const testMessage = await testMessageSending(chatId, `Test message ${Date.now()}`);
      results.messageSending = !!testMessage;
      
      if (testMessage) {
        // Test socket emission
        results.socketEmission = await testSocketMessageEmission(chatId, testMessage);
        
        // Test message receiving (wait for 5 seconds)
        results.messageReceiving = await testMessageReceiving(chatId, 5000);
      }
    }
  }
  
  // Test push token
  results.pushToken = await testPushToken();
  
  // Summary
  console.log('\n📊 Real-time Messaging Test Results:');
  console.log('✅ Socket Connection:', results.socketConnection ? 'Success' : 'Failed');
  console.log('✅ Chat Room Join:', results.chatRoomJoin ? 'Success' : 'Failed');
  console.log('✅ Message Sending (API):', results.messageSending ? 'Success' : 'Failed');
  console.log('✅ Socket Emission:', results.socketEmission ? 'Success' : 'Failed');
  console.log('✅ Message Receiving:', results.messageReceiving ? 'Success' : 'Failed');
  console.log('✅ Push Token:', results.pushToken ? 'Found' : 'Missing');
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!results.socketConnection) {
    console.log('⚠️ Socket connection failed - check network and authentication');
  }
  
  if (!results.chatRoomJoin) {
    console.log('⚠️ Chat room join failed - check chat ID and socket connection');
  }
  
  if (!results.messageSending) {
    console.log('⚠️ Message sending failed - check API endpoint and authentication');
  }
  
  if (!results.socketEmission) {
    console.log('⚠️ Socket emission failed - check socket connection');
  }
  
  if (!results.messageReceiving) {
    console.log('⚠️ Message receiving failed - check socket listeners and server broadcasting');
  }
  
  if (!results.pushToken) {
    console.log('⚠️ No push token - notifications may not work');
  }
  
  console.log('\n✅ Real-time messaging test completed!');
  
  return results;
}

// Export for use in other files
export { runRealtimeMessagingTest };

// Run if this file is executed directly
if (typeof window === 'undefined') {
  console.log('⚠️ This test requires user authentication and chat ID');
  console.log('⚠️ Use: runRealtimeMessagingTest(chatId, userId, userToken)');
} 
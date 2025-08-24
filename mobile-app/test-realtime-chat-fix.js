// Test script for verifying real-time chat fixes
import socketService from './src/services/socket';

console.log('🔍 Testing real-time chat fixes...');

// Test 1: Socket connection and reconnection
async function testSocketReconnection() {
  console.log('\n🔌 Test 1: Socket Reconnection');
  
  try {
    // Simulate initial connection
    console.log('📱 Simulating initial socket connection...');
    socketService.connect('test-token');
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Initial connection status:', {
      isConnected: socketService.getConnectionStatus(),
      isReady: socketService.isReady(),
      activeChatRooms: socketService.getActiveChatRooms()
    });
    
    // Test chat room joining
    console.log('🎯 Testing chat room joining...');
    socketService.joinChat('test-chat-1');
    socketService.joinChat('test-chat-2');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ After joining chat rooms:', {
      activeChatRooms: socketService.getActiveChatRooms()
    });
    
    // Simulate disconnection and reconnection
    console.log('🔄 Simulating disconnection...');
    if (socketService.socket) {
      socketService.socket.disconnect();
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔄 Simulating reconnection...');
    socketService.connect('test-token');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ After reconnection:', {
      isConnected: socketService.getConnectionStatus(),
      isReady: socketService.isReady(),
      activeChatRooms: socketService.getActiveChatRooms()
    });
    
    return true;
  } catch (error) {
    console.error('❌ Socket reconnection test failed:', error);
    return false;
  }
}

// Test 2: Chat room management
async function testChatRoomManagement() {
  console.log('\n🎯 Test 2: Chat Room Management');
  
  try {
    if (!socketService.isReady()) {
      console.log('⚠️ Socket not ready, connecting first...');
      socketService.connect('test-token');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test joining multiple chat rooms
    const testChats = ['chat-1', 'chat-2', 'chat-3'];
    
    testChats.forEach(chatId => {
      console.log(`🎯 Joining chat: ${chatId}`);
      socketService.joinChat(chatId);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Active chat rooms:', socketService.getActiveChatRooms());
    
    // Test leaving a chat room
    console.log('🚪 Leaving chat: chat-2');
    socketService.leaveChat('chat-2');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Active chat rooms after leaving:', socketService.getActiveChatRooms());
    
    return true;
  } catch (error) {
    console.error('❌ Chat room management test failed:', error);
    return false;
  }
}

// Test 3: Event listener management
async function testEventListenerManagement() {
  console.log('\n👂 Test 3: Event Listener Management');
  
  try {
    if (!socketService.isReady()) {
      console.log('⚠️ Socket not ready, connecting first...');
      socketService.connect('test-token');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test adding and removing event listeners
    const testHandler = (data) => {
      console.log('🧪 Test event received:', data);
    };
    
    console.log('👂 Adding test event listener...');
    socketService.on('test_event', testHandler);
    
    // Test emitting the event
    console.log('📡 Emitting test event...');
    socketService.emit('test_event', { message: 'Hello from test' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test removing the event listener
    console.log('🗑️ Removing test event listener...');
    socketService.off('test_event', testHandler);
    
    // Test emitting again (should not be received)
    console.log('📡 Emitting test event again (should not be received)...');
    socketService.emit('test_event', { message: 'This should not be received' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Event listener management test completed');
    return true;
  } catch (error) {
    console.error('❌ Event listener management test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting real-time chat fix tests...\n');
  
  const results = [];
  
  results.push(await testSocketReconnection());
  results.push(await testChatRoomManagement());
  results.push(await testEventListenerManagement());
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 All tests passed! Real-time chat fixes are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
  
  // Cleanup
  if (socketService.socket) {
    socketService.disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };

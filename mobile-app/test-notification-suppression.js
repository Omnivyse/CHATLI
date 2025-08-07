// Test script for notification suppression logic
console.log('🧪 Testing notification suppression logic...');

// Mock navigation state
const mockNavigationState = {
  currentScreen: 'Chat',
  currentChatId: 'chat123',
  isInChat: true,
  shouldShowNotification: (notificationData) => {
    // If it's a chat/message notification and the user is already in that chat, don't show
    if (notificationData?.type === 'message' || notificationData?.type === 'chat') {
      const notificationChatId = notificationData?.chatId;
      if (notificationChatId && mockNavigationState.isInChat && mockNavigationState.currentChatId === notificationChatId) {
        console.log('🔔 Suppressing notification - user already in chat:', notificationChatId);
        return false;
      }
    }
    
    // For other notification types, always show
    return true;
  }
};

// Test cases
const testCases = [
  {
    name: 'Message notification for current chat',
    notification: { type: 'message', chatId: 'chat123' },
    expected: false,
    description: 'Should suppress notification when user is in the same chat'
  },
  {
    name: 'Message notification for different chat',
    notification: { type: 'message', chatId: 'chat456' },
    expected: true,
    description: 'Should show notification when user is in different chat'
  },
  {
    name: 'Like notification',
    notification: { type: 'like', postId: 'post123' },
    expected: true,
    description: 'Should show like notifications regardless of chat state'
  },
  {
    name: 'Comment notification',
    notification: { type: 'comment', postId: 'post123' },
    expected: true,
    description: 'Should show comment notifications regardless of chat state'
  },
  {
    name: 'Follow notification',
    notification: { type: 'follow', followerId: 'user123' },
    expected: true,
    description: 'Should show follow notifications regardless of chat state'
  }
];

// Run tests
console.log('\n📋 Running notification suppression tests...\n');

testCases.forEach((testCase, index) => {
  const result = mockNavigationState.shouldShowNotification(testCase.notification);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`   Description: ${testCase.description}`);
  console.log(`   Notification:`, testCase.notification);
  console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('🎯 Test completed!');
console.log('📱 This logic will be used in the mobile app to suppress notifications when the user is already in the relevant chat.'); 
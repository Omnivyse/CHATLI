// Server-side notification test script
// Run this to test if notifications are being sent correctly

const pushNotificationService = require('./services/pushNotificationService');
const User = require('./models/User');
const mongoose = require('mongoose');

console.log('🧪 Starting Server Notification Test...');

// Test configuration
const TEST_CONFIG = {
  // Test with a real push token from your mobile app
  testPushToken: process.env.TEST_PUSH_TOKEN || 'ExponentPushToken[your-test-token-here]',
  // Test user ID (optional)
  testUserId: process.env.TEST_USER_ID || null,
  // Test chat ID (optional)
  testChatId: process.env.TEST_CHAT_ID || 'test-chat-id',
  // Test post ID (optional)
  testPostId: process.env.TEST_POST_ID || 'test-post-id'
};

// Test 1: Test basic push notification service
const testBasicNotification = async () => {
  console.log('\n🔔 Test 1: Basic Push Notification Test');
  
  try {
    const result = await pushNotificationService.sendPushNotification(
      TEST_CONFIG.testPushToken,
      'Test Notification',
      'This is a test notification from the server',
      { type: 'test', timestamp: Date.now() },
      'general'
    );
    
    if (result) {
      console.log('✅ Basic notification sent successfully');
    } else {
      console.log('❌ Basic notification failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Basic notification error:', error.message);
    return false;
  }
};

// Test 2: Test message notification
const testMessageNotification = async () => {
  console.log('\n💬 Test 2: Message Notification Test');
  
  try {
    const result = await pushNotificationService.sendMessageNotification(
      TEST_CONFIG.testPushToken,
      'Test User',
      'Hello! This is a test message notification.',
      TEST_CONFIG.testChatId,
      'test-sender-id',
      'test-recipient-id'
    );
    
    if (result) {
      console.log('✅ Message notification sent successfully');
    } else {
      console.log('❌ Message notification failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Message notification error:', error.message);
    return false;
  }
};

// Test 3: Test like notification
const testLikeNotification = async () => {
  console.log('\n❤️ Test 3: Like Notification Test');
  
  try {
    const result = await pushNotificationService.sendLikeNotification(
      TEST_CONFIG.testPushToken,
      'Test User',
      TEST_CONFIG.testPostId,
      'This is a test post content for like notification testing.'
    );
    
    if (result) {
      console.log('✅ Like notification sent successfully');
    } else {
      console.log('❌ Like notification failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Like notification error:', error.message);
    return false;
  }
};

// Test 4: Test comment notification
const testCommentNotification = async () => {
  console.log('\n💭 Test 4: Comment Notification Test');
  
  try {
    const result = await pushNotificationService.sendCommentNotification(
      TEST_CONFIG.testPushToken,
      'Test User',
      TEST_CONFIG.testPostId,
      'This is a test comment for notification testing.',
      'This is the original post content that was commented on.'
    );
    
    if (result) {
      console.log('✅ Comment notification sent successfully');
    } else {
      console.log('❌ Comment notification failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Comment notification error:', error.message);
    return false;
  }
};

// Test 5: Test follow notification
const testFollowNotification = async () => {
  console.log('\n👥 Test 5: Follow Notification Test');
  
  try {
    const result = await pushNotificationService.sendFollowNotification(
      TEST_CONFIG.testPushToken,
      'Test User',
      'test-follower-id'
    );
    
    if (result) {
      console.log('✅ Follow notification sent successfully');
    } else {
      console.log('❌ Follow notification failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Follow notification error:', error.message);
    return false;
  }
};

// Test 6: Test multiple notifications
const testMultipleNotifications = async () => {
  console.log('\n📱 Test 6: Multiple Notifications Test');
  
  try {
    const tokens = [TEST_CONFIG.testPushToken];
    const result = await pushNotificationService.sendPushNotificationToMultiple(
      tokens,
      'Multiple Test',
      'This is a test of sending to multiple devices',
      { type: 'multiple-test', timestamp: Date.now() },
      'general'
    );
    
    if (result) {
      console.log('✅ Multiple notifications sent successfully');
    } else {
      console.log('❌ Multiple notifications failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Multiple notifications error:', error.message);
    return false;
  }
};

// Test 7: Test notification with custom sound
const testCustomSoundNotification = async () => {
  console.log('\n🔊 Test 7: Custom Sound Notification Test');
  
  try {
    const result = await pushNotificationService.sendPushNotification(
      TEST_CONFIG.testPushToken,
      'Custom Sound Test',
      'This notification should play the custom sound',
      { type: 'sound-test', timestamp: Date.now() },
      'message' // Use message sound type
    );
    
    if (result) {
      console.log('✅ Custom sound notification sent successfully');
    } else {
      console.log('❌ Custom sound notification failed');
    }
    
    return result;
  } catch (error) {
    console.log('❌ Custom sound notification error:', error.message);
    return false;
  }
};

// Test 8: Test invalid push token
const testInvalidToken = async () => {
  console.log('\n🚫 Test 8: Invalid Token Test');
  
  try {
    const result = await pushNotificationService.sendPushNotification(
      'invalid-token-format',
      'Invalid Token Test',
      'This should fail gracefully',
      { type: 'invalid-test' },
      'general'
    );
    
    if (!result) {
      console.log('✅ Invalid token handled gracefully (expected failure)');
    } else {
      console.log('⚠️ Invalid token unexpectedly succeeded');
    }
    
    return !result; // Return true if it failed as expected
  } catch (error) {
    console.log('✅ Invalid token error handled:', error.message);
    return true;
  }
};

// Test 9: Test database user push tokens
const testDatabaseTokens = async () => {
  console.log('\n💾 Test 9: Database Push Tokens Test');
  
  try {
    // Check if we can connect to the database
    if (!mongoose.connection.readyState) {
      console.log('⚠️ Database not connected, skipping database test');
      return false;
    }
    
    // Find users with push tokens
    const usersWithTokens = await User.find({ pushToken: { $exists: true, $ne: null } }).limit(5);
    
    console.log(`- Found ${usersWithTokens.length} users with push tokens`);
    
    if (usersWithTokens.length > 0) {
      const testUser = usersWithTokens[0];
      console.log(`- Testing with user: ${testUser.name} (${testUser._id})`);
      console.log(`- Push token: ${testUser.pushToken.substring(0, 20)}...`);
      
      // Send a test notification to this user
      const result = await pushNotificationService.sendGeneralNotification(
        testUser.pushToken,
        'Database Token Test',
        `Hello ${testUser.name}! This is a test notification using your stored push token.`
      );
      
      if (result) {
        console.log('✅ Database token notification sent successfully');
      } else {
        console.log('❌ Database token notification failed');
      }
      
      return result;
    } else {
      console.log('⚠️ No users with push tokens found in database');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Database tokens test error:', error.message);
    return false;
  }
};

// Test 10: Test notification service configuration
const testServiceConfiguration = () => {
  console.log('\n⚙️ Test 10: Service Configuration Test');
  
  try {
    console.log('- Expo Push URL:', pushNotificationService.expoPushUrl);
    console.log('- Sound Settings:', pushNotificationService.soundSettings);
    
    // Test channel ID generation
    const testTypes = ['message', 'like', 'comment', 'follow', 'general'];
    testTypes.forEach(type => {
      const channelId = pushNotificationService.getChannelId(type);
      console.log(`- Channel ID for ${type}: ${channelId}`);
    });
    
    // Test sound file generation
    testTypes.forEach(type => {
      const sound = pushNotificationService.getSoundForType(type);
      console.log(`- Sound for ${type}: ${sound}`);
    });
    
    console.log('✅ Service configuration test completed');
    return true;
  } catch (error) {
    console.log('❌ Service configuration test error:', error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive server notification tests...\n');
  
  const results = {
    basic: await testBasicNotification(),
    message: await testMessageNotification(),
    like: await testLikeNotification(),
    comment: await testCommentNotification(),
    follow: await testFollowNotification(),
    multiple: await testMultipleNotifications(),
    customSound: await testCustomSoundNotification(),
    invalidToken: await testInvalidToken(),
    databaseTokens: await testDatabaseTokens(),
    configuration: testServiceConfiguration()
  };
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('✅ Basic Notification:', results.basic ? 'Success' : 'Failed');
  console.log('✅ Message Notification:', results.message ? 'Success' : 'Failed');
  console.log('✅ Like Notification:', results.like ? 'Success' : 'Failed');
  console.log('✅ Comment Notification:', results.comment ? 'Success' : 'Failed');
  console.log('✅ Follow Notification:', results.follow ? 'Success' : 'Failed');
  console.log('✅ Multiple Notifications:', results.multiple ? 'Success' : 'Failed');
  console.log('✅ Custom Sound:', results.customSound ? 'Success' : 'Failed');
  console.log('✅ Invalid Token Handling:', results.invalidToken ? 'Success' : 'Failed');
  console.log('✅ Database Tokens:', results.databaseTokens ? 'Success' : 'Failed');
  console.log('✅ Service Configuration:', results.configuration ? 'Success' : 'Failed');
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n📈 Overall Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! Server notifications are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
    console.log('🔧 Common issues:');
    console.log('1. Invalid push token format');
    console.log('2. Network connectivity issues');
    console.log('3. Expo push service problems');
    console.log('4. Database connection issues');
  }
  
  return results;
};

// Export for use in other files
module.exports = {
  runAllTests,
  testBasicNotification,
  testMessageNotification,
  testLikeNotification,
  testCommentNotification,
  testFollowNotification,
  testMultipleNotifications,
  testCustomSoundNotification,
  testInvalidToken,
  testDatabaseTokens,
  testServiceConfiguration
};

// Auto-run if this file is executed directly
if (require.main === module) {
  // Check if we have a valid test token
  if (!TEST_CONFIG.testPushToken || TEST_CONFIG.testPushToken === 'ExponentPushToken[your-test-token-here]') {
    console.log('⚠️ No valid test push token provided.');
    console.log('🔧 Set TEST_PUSH_TOKEN environment variable or update the script with a real token.');
    console.log('📱 Get a push token from your mobile app by running the notification debug script.');
    process.exit(1);
  }
  
  runAllTests()
    .then(() => {
      console.log('\n✅ Server notification tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

const pushNotificationService = require('./src/services/pushNotificationService').default;

// Test notification sounds
async function testNotificationSounds() {
  console.log('🔔 Testing notification sounds...');
  
  try {
    // Test message notification
    console.log('📱 Testing message notification...');
    await pushNotificationService.sendLocalNotification(
      'Test Message',
      'This is a test message notification',
      { type: 'message', test: true },
      'message'
    );
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test like notification
    console.log('❤️ Testing like notification...');
    await pushNotificationService.sendLocalNotification(
      'Test Like',
      'Someone liked your post',
      { type: 'like', test: true },
      'like'
    );
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test comment notification
    console.log('💭 Testing comment notification...');
    await pushNotificationService.sendLocalNotification(
      'Test Comment',
      'Someone commented on your post',
      { type: 'comment', test: true },
      'comment'
    );
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test follow notification
    console.log('👤 Testing follow notification...');
    await pushNotificationService.sendLocalNotification(
      'Test Follow',
      'Someone started following you',
      { type: 'follow', test: true },
      'follow'
    );
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test general notification
    console.log('📢 Testing general notification...');
    await pushNotificationService.sendLocalNotification(
      'Test General',
      'This is a general notification',
      { type: 'general', test: true },
      'general'
    );
    
    console.log('✅ All notification tests completed!');
    console.log('📱 Check your device for notifications with different sounds');
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
}

// Run the test
testNotificationSounds(); 
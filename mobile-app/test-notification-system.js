// Test notification system setup
console.log('🔔 Testing notification system setup...');

const fs = require('fs');
const path = require('path');

// Check sound file
const soundFilePath = path.join(__dirname, 'assets', 'sounds', 'nottif.mp3');
if (fs.existsSync(soundFilePath)) {
  const stats = fs.statSync(soundFilePath);
  console.log('✅ Sound file found:', soundFilePath);
  console.log('📊 File size:', (stats.size / 1024).toFixed(2) + 'KB');
} else {
  console.log('❌ Sound file not found:', soundFilePath);
}

// Check server-side notification service
const serverNotificationServicePath = path.join(__dirname, '..', 'server', 'services', 'pushNotificationService.js');
if (fs.existsSync(serverNotificationServicePath)) {
  const serverService = fs.readFileSync(serverNotificationServicePath, 'utf8');
  
  // Check if sendMessageNotification method exists
  if (serverService.includes('sendMessageNotification')) {
    console.log('✅ Server sendMessageNotification method found');
  } else {
    console.log('❌ Server sendMessageNotification method not found');
  }
  
  // Check if nottif sound is configured
  if (serverService.includes('nottif')) {
    console.log('✅ Server configured to use nottif sound');
  } else {
    console.log('❌ Server not configured to use nottif sound');
  }
} else {
  console.log('❌ Server notification service not found');
}

// Check chat routes for notification calls
const chatRoutesPath = path.join(__dirname, '..', 'server', 'routes', 'chats.js');
if (fs.existsSync(chatRoutesPath)) {
  const chatRoutes = fs.readFileSync(chatRoutesPath, 'utf8');
  
  // Check if sendMessageNotification is called
  if (chatRoutes.includes('sendMessageNotification')) {
    console.log('✅ Chat routes calling sendMessageNotification');
  } else {
    console.log('❌ Chat routes not calling sendMessageNotification');
  }
  
  // Check if push notification is sent for messages
  if (chatRoutes.includes('pushNotificationService.sendMessageNotification')) {
    console.log('✅ Push notifications enabled for chat messages');
  } else {
    console.log('❌ Push notifications not enabled for chat messages');
  }
} else {
  console.log('❌ Chat routes not found');
}

// Check mobile app notification service
const mobileNotificationServicePath = path.join(__dirname, 'src', 'services', 'pushNotificationService.js');
if (fs.existsSync(mobileNotificationServicePath)) {
  const mobileService = fs.readFileSync(mobileNotificationServicePath, 'utf8');
  
  // Check if nottif sound is configured
  if (mobileService.includes('nottif')) {
    console.log('✅ Mobile app configured to use nottif sound');
  } else {
    console.log('❌ Mobile app not configured to use nottif sound');
  }
  
  // Check if updatePushTokenOnServer method exists
  if (mobileService.includes('updatePushTokenOnServer')) {
    console.log('✅ Mobile app has updatePushTokenOnServer method');
  } else {
    console.log('❌ Mobile app missing updatePushTokenOnServer method');
  }
} else {
  console.log('❌ Mobile notification service not found');
}

// Check app configuration
const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  console.log('✅ App configuration found');
  console.log('📱 App name:', appConfig.expo.name);
  console.log('🔧 Build number:', appConfig.expo.ios.buildNumber);
} else {
  console.log('❌ App configuration not found');
}

console.log('');
console.log('🎵 Notification system verification complete!');
console.log('');
console.log('📋 Issues to check:');
console.log('1. Ensure mobile app users have granted notification permissions');
console.log('2. Verify push tokens are being saved to server database');
console.log('3. Check that web users are sending messages to mobile users');
console.log('4. Test on physical device (not simulator)');
console.log('');
console.log('🚀 Next steps:');
console.log('1. Build and deploy: eas build --platform ios --profile production');
console.log('2. Test notifications between web and mobile users');
console.log('3. Verify custom nottif.mp3 sound plays'); 
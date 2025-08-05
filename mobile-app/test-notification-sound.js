// Simple test to verify notification sound setup
console.log('🔔 Testing notification sound setup...');

// Check if the sound file exists
const fs = require('fs');
const path = require('path');

const soundFilePath = path.join(__dirname, 'assets', 'sounds', 'nottif.mp3');

if (fs.existsSync(soundFilePath)) {
  const stats = fs.statSync(soundFilePath);
  console.log('✅ Sound file found:', soundFilePath);
  console.log('📊 File size:', (stats.size / 1024).toFixed(2) + 'KB');
  console.log('📅 Last modified:', stats.mtime);
} else {
  console.log('❌ Sound file not found:', soundFilePath);
}

// Check app configuration
const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  console.log('✅ App configuration found');
  console.log('📱 App name:', appConfig.expo.name);
  console.log('🔧 Asset bundle patterns:', appConfig.expo.assetBundlePatterns);
} else {
  console.log('❌ App configuration not found');
}

// Check notification service configuration
const notificationServicePath = path.join(__dirname, 'src', 'services', 'pushNotificationService.js');
if (fs.existsSync(notificationServicePath)) {
  console.log('✅ Notification service found');
  console.log('🔧 Service path:', notificationServicePath);
} else {
  console.log('❌ Notification service not found');
}

console.log('');
console.log('🎵 Notification sound setup verification complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Build the app: eas build --platform ios --profile production');
console.log('2. Deploy to TestFlight: eas submit --platform ios --profile production');
console.log('3. Test on device to hear your custom nottif.mp3 sound');
console.log('');
console.log('🎯 Expected result: All notifications will play your custom sound!'); 
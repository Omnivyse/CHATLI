// Test script for debugging push notification issues in TestFlight
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

console.log('🔍 Starting notification debug test...');

// Test project ID detection
function testProjectIdDetection() {
  console.log('\n📋 Project ID Detection Test:');
  
  const projectId = 
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.expoConfig?.extra?.projectId ||
    Constants.expoConfig?.projectId ||
    process.env.EXPO_PROJECT_ID ||
    '228cdfa0-b203-439c-bfe6-c6b682a56be3';
  
  console.log('✅ Project ID:', projectId);
  console.log('📱 Environment:', {
    isDevelopment: __DEV__,
    isProduction: !__DEV__,
    platform: Platform.OS
  });
  
  console.log('🔧 Config sources:', {
    fromEas: Constants.expoConfig?.extra?.eas?.projectId,
    fromExtra: Constants.expoConfig?.extra?.projectId,
    fromConfig: Constants.expoConfig?.projectId,
    fromEnv: process.env.EXPO_PROJECT_ID
  });
  
  return projectId;
}

// Test device capabilities
function testDeviceCapabilities() {
  console.log('\n📱 Device Capabilities Test:');
  
  console.log('✅ Device info:', {
    isDevice: Device.isDevice,
    isSimulator: !Device.isDevice,
    platform: Platform.OS,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    osVersion: Device.osVersion
  });
  
  return Device.isDevice;
}

// Test notification permissions
async function testNotificationPermissions() {
  console.log('\n🔔 Notification Permissions Test:');
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('✅ Current permission status:', existingStatus);
    
    if (existingStatus !== 'granted') {
      console.log('⚠️ Permission not granted, requesting...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('✅ New permission status:', status);
      return status === 'granted';
    }
    
    return true;
  } catch (error) {
    console.error('❌ Permission test error:', error);
    return false;
  }
}

// Test push token generation
async function testPushTokenGeneration(projectId) {
  console.log('\n🔑 Push Token Generation Test:');
  
  if (!Device.isDevice) {
    console.log('❌ Must use physical device for push tokens');
    return null;
  }
  
  if (!projectId || projectId === 'your-project-id') {
    console.log('❌ No valid project ID found');
    return null;
  }
  
  try {
    console.log('🔔 Attempting to get push token with project ID:', projectId);
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    console.log('✅ Push token obtained:', token.data);
    console.log('📋 Token details:', {
      token: token.data,
      tokenLength: token.data?.length,
      startsWithExponent: token.data?.startsWith('ExponentPushToken'),
      isDevelopment: __DEV__,
      isProduction: !__DEV__
    });
    
    return token.data;
  } catch (error) {
    console.error('❌ Push token generation error:', error);
    console.log('📋 Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return null;
  }
}

// Test local notification
async function testLocalNotification() {
  console.log('\n🔔 Local Notification Test:');
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from debug script',
        data: { type: 'test', timestamp: Date.now() },
        sound: Platform.OS === 'ios' ? 'nottif.aiff' : 'nottif.mp3',
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Local notification scheduled successfully');
    return true;
  } catch (error) {
    console.error('❌ Local notification error:', error);
    return false;
  }
}

// Test notification channels (Android)
async function testNotificationChannels() {
  if (Platform.OS !== 'android') {
    console.log('\n📱 Skipping Android channels test (iOS detected)');
    return true;
  }
  
  console.log('\n🔔 Android Notification Channels Test:');
  
  try {
    await Notifications.setNotificationChannelAsync('test', {
      name: 'Test Channel',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'nottif.mp3',
      enableVibrate: true,
      showBadge: true,
    });
    
    console.log('✅ Test notification channel created');
    return true;
  } catch (error) {
    console.error('❌ Notification channel error:', error);
    return false;
  }
}

// Main test function
async function runNotificationDebugTest() {
  console.log('🚀 Starting comprehensive notification debug test...\n');
  
  const results = {
    projectId: testProjectIdDetection(),
    deviceCapabilities: testDeviceCapabilities(),
    permissions: await testNotificationPermissions(),
    pushToken: null,
    localNotification: false,
    channels: false
  };
  
  if (results.deviceCapabilities && results.permissions) {
    results.pushToken = await testPushTokenGeneration(results.projectId);
  }
  
  results.localNotification = await testLocalNotification();
  results.channels = await testNotificationChannels();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('✅ Project ID:', results.projectId ? 'Valid' : 'Invalid');
  console.log('✅ Device Capabilities:', results.deviceCapabilities ? 'Physical Device' : 'Simulator');
  console.log('✅ Permissions:', results.permissions ? 'Granted' : 'Denied');
  console.log('✅ Push Token:', results.pushToken ? 'Generated' : 'Failed');
  console.log('✅ Local Notification:', results.localNotification ? 'Success' : 'Failed');
  console.log('✅ Channels (Android):', results.channels ? 'Success' : 'Failed');
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!results.deviceCapabilities) {
    console.log('⚠️ Use a physical device for push notification testing');
  }
  
  if (!results.permissions) {
    console.log('⚠️ Notification permissions not granted');
  }
  
  if (!results.pushToken) {
    console.log('⚠️ Push token generation failed - check project ID configuration');
  }
  
  if (!results.localNotification) {
    console.log('⚠️ Local notification failed - check notification setup');
  }
  
  console.log('\n✅ Debug test completed!');
  
  return results;
}

// Export for use in other files
export { runNotificationDebugTest };

// Run if this file is executed directly
if (typeof window === 'undefined') {
  runNotificationDebugTest().catch(console.error);
} 
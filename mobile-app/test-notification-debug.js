// Test Notification Debug Script
// Run this in your mobile app to debug notification issues

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('🧪 Starting Notification Debug Test...');

// Test 1: Check device capabilities
const testDeviceCapabilities = () => {
  console.log('📱 Device Capabilities Test:');
  console.log('- Is Device:', Device.isDevice);
  console.log('- Platform:', Platform.OS);
  console.log('- Platform Version:', Platform.Version);
  console.log('- Is Development:', __DEV__);
  console.log('- Is Production:', !__DEV__);
  
  if (!Device.isDevice) {
    console.log('⚠️ WARNING: Notifications only work on physical devices, not simulators');
  }
};

// Test 2: Check project configuration
const testProjectConfiguration = () => {
  console.log('🔍 Project Configuration Test:');
  console.log('- Constants.expoConfig:', Constants.expoConfig);
  console.log('- Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
  console.log('- Constants.expoConfig?.extra?.eas:', Constants.expoConfig?.extra?.eas);
  console.log('- Constants.expoConfig?.projectId:', Constants.expoConfig?.projectId);
  
  const projectId = 
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.expoConfig?.extra?.projectId ||
    Constants.expoConfig?.projectId;
    
  if (projectId && projectId !== 'your-project-id') {
    console.log('✅ Project ID found:', projectId);
  } else {
    console.log('❌ No valid project ID found');
  }
};

// Test 3: Check notification permissions
const testNotificationPermissions = async () => {
  console.log('🔔 Notification Permissions Test:');
  
  try {
    const permissions = await Notifications.getPermissionsAsync();
    console.log('- Current permissions:', permissions);
    
    if (permissions.status === 'granted') {
      console.log('✅ Notifications are allowed');
    } else if (permissions.status === 'denied') {
      console.log('❌ Notifications are denied');
    } else if (permissions.status === 'undetermined') {
      console.log('❓ Notifications permission not determined');
    }
    
    return permissions.status;
  } catch (error) {
    console.log('❌ Error checking permissions:', error.message);
    return null;
  }
};

// Test 4: Request notification permissions
const testRequestPermissions = async () => {
  console.log('🔔 Requesting Notification Permissions...');
  
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
      },
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });
    
    console.log('- Permission request result:', status);
    return status;
  } catch (error) {
    console.log('❌ Error requesting permissions:', error.message);
    return null;
  }
};

// Test 5: Test push token generation
const testPushTokenGeneration = async () => {
  console.log('🔑 Push Token Generation Test:');
  
  try {
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.expoConfig?.extra?.projectId ||
      Constants.expoConfig?.projectId ||
      '228cdfa0-b203-439c-bfe6-c6b682a56be3';
    
    if (!projectId || projectId === 'your-project-id') {
      console.log('❌ No valid project ID available');
      return null;
    }
    
    console.log('- Using project ID:', projectId);
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    console.log('✅ Push token generated:', token.data);
    console.log('- Token length:', token.data?.length);
    console.log('- Token prefix:', token.data?.substring(0, 20));
    console.log('- Is valid format:', token.data?.startsWith('ExponentPushToken['));
    
    // Store token for later use
    await AsyncStorage.setItem('pushToken', token.data);
    console.log('💾 Token stored in AsyncStorage');
    
    return token.data;
  } catch (error) {
    console.log('❌ Error generating push token:', error.message);
    console.log('- Error code:', error.code);
    console.log('- Error stack:', error.stack);
    return null;
  }
};

// Test 6: Test Android notification channels
const testAndroidChannels = async () => {
  if (Platform.OS !== 'android') {
    console.log('📱 Skipping Android channels test (not Android)');
    return;
  }
  
  console.log('🔔 Android Notification Channels Test:');
  
  try {
    // Test default channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      description: 'Default notification channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'nottif.mp3',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    console.log('✅ Default channel configured');
    
    // Test message channel
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Chat and message notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'nottif.mp3',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    console.log('✅ Messages channel configured');
    
  } catch (error) {
    console.log('❌ Error configuring Android channels:', error.message);
  }
};

// Test 7: Test local notification
const testLocalNotification = async () => {
  console.log('🔔 Local Notification Test:');
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification to verify the system is working',
        data: { type: 'test', timestamp: Date.now() },
        sound: Platform.OS === 'ios' ? 'nottif.aiff' : 'nottif.mp3',
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Test notification scheduled');
    
    // Wait a moment and check if it was delivered
    setTimeout(async () => {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('- Scheduled notifications count:', scheduledNotifications.length);
    }, 1000);
    
  } catch (error) {
    console.log('❌ Error scheduling test notification:', error.message);
  }
};

// Test 8: Check stored tokens
const testStoredTokens = async () => {
  console.log('💾 Stored Tokens Test:');
  
  try {
    const pushToken = await AsyncStorage.getItem('pushToken');
    const authToken = await AsyncStorage.getItem('token');
    
    console.log('- Stored push token:', pushToken ? `${pushToken.substring(0, 20)}...` : 'None');
    console.log('- Stored auth token:', authToken ? `${authToken.substring(0, 20)}...` : 'None');
    
    if (pushToken) {
      console.log('- Push token length:', pushToken.length);
      console.log('- Push token format valid:', pushToken.startsWith('ExponentPushToken['));
    }
    
    if (authToken) {
      console.log('- Auth token length:', authToken.length);
    }
    
  } catch (error) {
    console.log('❌ Error checking stored tokens:', error.message);
  }
};

// Test 9: Test notification listeners
const testNotificationListeners = () => {
  console.log('👂 Notification Listeners Test:');
  
  try {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received via listener:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });
    });
    
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification response received via listener:', {
        actionIdentifier: response.actionIdentifier,
        data: response.notification.request.content.data
      });
    });
    
    console.log('✅ Notification listeners set up successfully');
    
    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
      console.log('🧹 Notification listeners cleaned up');
    };
    
  } catch (error) {
    console.log('❌ Error setting up notification listeners:', error.message);
    return null;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive notification tests...\n');
  
  // Run all tests
  testDeviceCapabilities();
  console.log('');
  
  testProjectConfiguration();
  console.log('');
  
  const permissionStatus = await testNotificationPermissions();
  console.log('');
  
  if (permissionStatus !== 'granted') {
    console.log('🔔 Requesting permissions...');
    await testRequestPermissions();
    console.log('');
  }
  
  await testAndroidChannels();
  console.log('');
  
  const pushToken = await testPushTokenGeneration();
  console.log('');
  
  await testStoredTokens();
  console.log('');
  
  const cleanupListeners = testNotificationListeners();
  console.log('');
  
  await testLocalNotification();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('- Device compatible:', Device.isDevice);
  console.log('- Platform:', Platform.OS);
  console.log('- Permissions granted:', permissionStatus === 'granted');
  console.log('- Push token generated:', !!pushToken);
  console.log('- Listeners set up:', !!cleanupListeners);
  
  if (pushToken) {
    console.log('✅ Push notifications should work on this device');
    console.log('🔧 Next steps:');
    console.log('1. Ensure your server is configured with the correct project ID');
    console.log('2. Send a test notification from your server');
    console.log('3. Check if the notification appears on this device');
  } else {
    console.log('❌ Push notifications may not work on this device');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check project ID configuration in app.json');
    console.log('2. Ensure device has internet connection');
    console.log('3. Try restarting the app');
    console.log('4. Check device notification settings');
  }
  
  // Cleanup after 10 seconds
  setTimeout(() => {
    if (cleanupListeners) {
      cleanupListeners();
    }
    console.log('🧹 Test cleanup completed');
  }, 10000);
};

// Export for use in other files
export {
  runAllTests,
  testDeviceCapabilities,
  testProjectConfiguration,
  testNotificationPermissions,
  testRequestPermissions,
  testPushTokenGeneration,
  testAndroidChannels,
  testLocalNotification,
  testStoredTokens,
  testNotificationListeners
};

// Auto-run if this file is executed directly
if (typeof global !== 'undefined') {
  global.runNotificationTests = runAllTests;
  console.log('🧪 Notification test functions available globally:');
  console.log('- runNotificationTests() - Run all tests');
  console.log('- Individual test functions also available');
} 
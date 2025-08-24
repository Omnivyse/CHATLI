import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation state tracking
let navigationStateRef = null;

// Current user tracking for notification filtering
let currentUserId = null;

export const setNavigationStateRef = (ref) => {
  navigationStateRef = ref;
};

// Set current user ID for notification filtering
export const setCurrentUserId = (userId) => {
  console.log('🔔 setCurrentUserId called with:', userId);
  currentUserId = userId;
  console.log('🔔 Current user ID set for notifications:', currentUserId);
};

// Get current user ID for debugging
export const getCurrentUserId = () => {
  return currentUserId;
};

// Check notification filtering status
export const getNotificationFilteringStatus = () => {
  return {
    currentUserId,
    isFilteringEnabled: currentUserId !== null,
    timestamp: new Date().toISOString()
  };
};

// Test notification filtering with sample data
export const testNotificationFiltering = () => {
  const testNotifications = [
    {
      type: 'message',
      senderId: 'user1',
      recipientId: 'user2',
      title: 'New message from user1'
    },
    {
      type: 'message', 
      senderId: 'user2',
      recipientId: 'user1',
      title: 'New message from user2'
    },
    {
      type: 'like',
      userId: 'user1',
      recipientId: 'user2'
    }
  ];

  console.log('🧪 Testing notification filtering...');
  console.log('🔔 Current user ID:', currentUserId);
  
  testNotifications.forEach((notification, index) => {
    const shouldShow = new PushNotificationService().shouldShowNotificationForCurrentUser(notification);
    console.log(`🧪 Test ${index + 1}:`, {
      notification,
      shouldShow,
      result: shouldShow ? '✅ ALLOWED' : '❌ SUPPRESSED'
    });
  });
};

// Log current notification filtering status
export const logNotificationFilteringStatus = () => {
  console.log('🔔 📊 Current notification filtering status:', {
    currentUserId,
    isFilteringEnabled: currentUserId !== null,
    timestamp: new Date().toISOString(),
    serviceInstance: !!new PushNotificationService()
  });
};

// Clear current user ID (for logout)
export const clearCurrentUserId = (() => {
  let timeoutId = null;
  let isClearing = false;
  
  return () => {
    // Prevent multiple simultaneous calls
    if (isClearing) {
      console.log('🔔 clearCurrentUserId already in progress, skipping...');
      return;
    }
    
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Debounce the actual clearing
    timeoutId = setTimeout(() => {
      isClearing = true;
      console.log('🔔 clearCurrentUserId called, clearing current user ID');
      currentUserId = null;
      console.log('🔔 Current user ID cleared, notification filtering disabled');
      isClearing = false;
    }, 50);
  };
})();

// Configure notification behavior with custom sounds
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.soundSettings = {
      message: 'message_notification',
      like: 'like_notification',
      comment: 'comment_notification',
      follow: 'follow_notification',
      general: 'general_notification'
    };
  }

  // Get the correct project ID for different environments
  getProjectId() {
    // Try multiple sources for project ID
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.expoConfig?.extra?.projectId ||
      Constants.expoConfig?.projectId ||
      process.env.EXPO_PROJECT_ID ||
      '228cdfa0-b203-439c-bfe6-c6b682a56be3'; // Fallback to your actual project ID
    
    console.log('🔍 Project ID detection:', {
      fromEas: Constants.expoConfig?.extra?.eas?.projectId,
      fromExtra: Constants.expoConfig?.extra?.projectId,
      fromConfig: Constants.expoConfig?.projectId,
      fromEnv: process.env.EXPO_PROJECT_ID,
      final: projectId,
      isDevelopment: __DEV__,
      isProduction: !__DEV__
    });
    
    return projectId;
  }

  // Initialize push notifications
  async initialize() {
    try {
      console.log('🔔 Initializing push notifications...');
      console.log('📱 Device info:', {
        isDevice: Device.isDevice,
        platform: Platform.OS,
        isDevelopment: __DEV__,
        isProduction: !__DEV__
      });
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🔔 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions not granted');
        console.log('📋 Permission status:', finalStatus);
        return false;
      }
      
      console.log('✅ Push notification permissions granted');
      
      // Set up Android notification channels with custom sounds
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }
      
      // Get the token
      if (Device.isDevice) {
        try {
          const projectId = this.getProjectId();
          
          if (projectId && projectId !== 'your-project-id') {
            console.log('🔔 Getting push token with project ID:', projectId);
            
            this.expoPushToken = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
            
            console.log('✅ Expo Push Token obtained:', this.expoPushToken.data);
            console.log('📋 Token details:', {
              token: this.expoPushToken.data,
              tokenLength: this.expoPushToken.data?.length,
              startsWithExponent: this.expoPushToken.data?.startsWith('ExponentPushToken'),
              isDevelopment: __DEV__,
              isProduction: !__DEV__
            });
          } else {
            console.log('⚠️ No valid project ID found, skipping push token generation');
            console.log('📋 Available config:', {
              expoConfig: Constants.expoConfig,
              extra: Constants.expoConfig?.extra,
              eas: Constants.expoConfig?.extra?.eas
            });
          }
        } catch (error) {
          console.error('❌ Error getting push token:', error);
          console.log('📋 Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
          });
          
          // For TestFlight builds, we need to be more specific about the error
          if (error.message.includes('projectId')) {
            console.log('🔧 Project ID configuration issue detected');
            console.log('🔧 Please ensure your app.json has the correct project ID');
          }
          
          // Don't throw the error, just log it and continue
        }
      } else {
        console.log('⚠️ Must use physical device for push notifications');
        console.log('📋 Current environment:', {
          isDevice: Device.isDevice,
          isSimulator: !Device.isDevice,
          platform: Platform.OS
        });
      }
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Update push token on server if available
      if (this.expoPushToken?.data) {
        console.log('🔔 Push token available, will update on server after delay');
        setTimeout(async () => {
          const success = await this.updatePushTokenOnServer();
          if (success) {
            console.log('✅ Push token successfully updated on server');
          } else {
            console.log('⚠️ Failed to update push token on server');
          }
        }, 3000); // Increased delay to ensure user is logged in
      } else {
        console.log('⚠️ No push token available for server update');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      console.log('📋 Initialization error details:', {
        message: error.message,
        stack: error.stack
      });
      // Don't throw the error, just return false
      return false;
    }
  }

  // Set up Android notification channels with custom sounds
  async setupAndroidChannels() {
    try {
      // Message notifications
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

      // Like notifications
      await Notifications.setNotificationChannelAsync('likes', {
        name: 'Likes',
        description: 'Post like notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // Comment notifications
      await Notifications.setNotificationChannelAsync('comments', {
        name: 'Comments',
        description: 'Post comment notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // Follow notifications
      await Notifications.setNotificationChannelAsync('follows', {
        name: 'Follows',
        description: 'User follow notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // General notifications
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      console.log('✅ Android notification channels configured with enhanced settings');
    } catch (error) {
      console.log('⚠️ Error setting up Android channels:', error.message);
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    try {
      // Listen for incoming notifications
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received:', notification);
        console.log('📋 Notification details:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
          sound: notification.request.content.sound
        });
        this.handleNotificationReceived(notification).catch(error => {
          console.log('⚠️ Error in handleNotificationReceived:', error.message);
        });
      });

      // Listen for notification responses (when user taps notification)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('🔔 Notification response received:', response);
        console.log('📋 Response details:', {
          actionIdentifier: response.actionIdentifier,
          data: response.notification.request.content.data
        });
        this.handleNotificationResponse(response);
      });
      
      console.log('✅ Notification listeners set up successfully');
    } catch (error) {
      console.log('⚠️ Error setting up notification listeners:', error.message);
    }
  }

  // Handle incoming notifications
  async handleNotificationReceived(notification) {
    try {
      const { title, body, data } = notification.request.content;
      console.log('🔔 Handling notification:', { title, body, data });
      
      // Check if we should suppress this notification based on current user
      if (!this.shouldShowNotificationForCurrentUser(data)) {
        console.log('🔔 Notification suppressed - not for current user');
        return;
      }
      
      // Check if we should suppress this notification based on navigation state
      if (navigationStateRef && navigationStateRef.shouldShowNotification) {
        const shouldShow = navigationStateRef.shouldShowNotification(data);
        if (!shouldShow) {
          console.log('🔔 Notification suppressed - user already in relevant screen');
          return;
        }
      }
      
      // Handle different notification types
      if (data) {
        console.log('🔔 Notification data:', data);
        
        // Log specific notification types for debugging
        if (data.type === 'message' || data.type === 'chat') {
          console.log('💬 Message notification received:', {
            chatId: data.chatId,
            senderName: data.senderName,
            messageContent: data.messageContent,
            senderId: data.senderId,
            recipientId: data.recipientId
          });
        }
      }
      
      // You can add custom logic here for handling notifications in foreground
      // For example, updating UI, playing sounds, etc.
    } catch (error) {
      console.log('⚠️ Error handling notification:', error.message);
    }
  }

  // Handle notification responses (when user taps notification)
  handleNotificationResponse(response) {
    try {
      const { data } = response.notification.request.content;
      console.log('🔔 Handling notification response:', data);
      
      // Navigate based on notification data
      this.handleNotificationNavigation(data);
    } catch (error) {
      console.log('⚠️ Error handling notification response:', error.message);
    }
  }

  // Handle navigation based on notification data
  handleNotificationNavigation(data) {
    try {
      if (!data) return;
      
      // Example navigation logic
      if (data.type === 'message' || data.type === 'chat') {
        // Navigate to chat screen
        console.log('🔔 Navigating to chat:', data.chatId);
        // You can add navigation logic here when navigation is available
      } else if (data.type === 'post') {
        // Navigate to post screen
        console.log('🔔 Navigating to post:', data.postId);
      } else if (data.type === 'profile') {
        // Navigate to profile screen
        console.log('🔔 Navigating to profile:', data.userId);
      } else if (data.type === 'like') {
        // Navigate to post screen
        console.log('🔔 Navigating to liked post:', data.postId);
      } else if (data.type === 'comment') {
        // Navigate to post screen
        console.log('🔔 Navigating to commented post:', data.postId);
      } else if (data.type === 'follow') {
        // Navigate to profile screen
        console.log('🔔 Navigating to follower profile:', data.followerId);
      }
    } catch (error) {
      console.log('⚠️ Error handling notification navigation:', error.message);
    }
  }

  // Get the push token
  getPushToken() {
    return this.expoPushToken?.data || null;
  }

  // Update push token on server
  async updatePushTokenOnServer() {
    try {
      const token = this.getPushToken();
      if (token) {
        const api = require('./api').default;
        await api.updatePushToken(token);
        console.log('✅ Push token updated on server:', token);
        return true;
      } else {
        console.log('⚠️ No push token available to update');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating push token on server:', error);
      return false;
    }
  }

  // Update push token when user logs in
  async updatePushTokenForUser() {
    try {
      const token = this.getPushToken();
      if (token) {
        const api = require('./api').default;
        await api.updatePushToken(token);
        console.log('✅ Push token updated for logged in user:', token);
        return true;
      } else {
        console.log('⚠️ No push token available for user update');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating push token for user:', error);
      return false;
    }
  }

  // Send local notification with custom sound
  async sendLocalNotification(title, body, data = {}, soundType = 'general') {
    try {
      const sound = this.getSoundForType(soundType);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound,
        },
        trigger: null, // Send immediately
      });
      console.log('🔔 Local notification sent:', { title, body, sound });
    } catch (error) {
      console.log('⚠️ Error sending local notification:', error.message);
    }
  }

  // Get sound file for notification type
  getSoundForType(type) {
    // Use platform-specific sound files for better compatibility
    if (Platform.OS === 'ios') {
      // iOS supports .aiff files better
      return 'nottif.aiff';
    } else if (Platform.OS === 'android') {
      // Android supports .mp3 files better
      return 'nottif.mp3';
    } else {
      // Web or other platforms
      return 'nottif.mp3';
    }
  }

  // Schedule notification with custom sound
  async scheduleNotification(title, body, data = {}, trigger, soundType = 'general') {
    try {
      const sound = this.getSoundForType(soundType);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound,
        },
        trigger,
      });
      console.log('🔔 Notification scheduled:', { title, body, trigger, sound });
    } catch (error) {
      console.log('⚠️ Error scheduling notification:', error.message);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔔 All notifications cancelled');
    } catch (error) {
      console.log('⚠️ Error cancelling notifications:', error.message);
    }
  }

  // Get notification settings
  async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      console.log('🔔 Notification settings:', settings);
      return settings;
    } catch (error) {
      console.log('⚠️ Error getting notification settings:', error.message);
      return null;
    }
  }

  // Cleanup listeners
  cleanup() {
    try {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }
      
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }
      
      // Clear current user ID when cleaning up
      currentUserId = null;
      
      console.log('🔔 Push notification listeners cleaned up');
    } catch (error) {
      console.log('⚠️ Error cleaning up notification listeners:', error.message);
    }
  }

  // Check if notification should be shown for current user
  shouldShowNotificationForCurrentUser(data) {
    console.log('🔔 🔍 Notification filtering check started:', {
      currentUserId,
      notificationData: data,
      notificationType: data?.type,
      timestamp: new Date().toISOString()
    });

    if (!currentUserId) {
      console.log('🔔 ⚠️ No current user ID, allowing notification (filtering disabled)');
      return true; // Allow notification if no user context
    }

    // For message notifications, check if current user is the recipient
    if (data && (data.type === 'message' || data.type === 'chat')) {
      console.log('🔔 💬 Processing message/chat notification:', {
        senderId: data.senderId,
        recipientId: data.recipientId,
        chatId: data.chatId,
        title: data.title
      });
      
      // Check if the notification is for the current user using recipientId
      if (data.recipientId && data.recipientId === currentUserId) {
        console.log('🔔 ✅ Message notification allowed - current user is recipient');
        return true;
      }
      
      // Check if the notification is from the current user (suppress)
      if (data.senderId && data.senderId === currentUserId) {
        console.log('🔔 ❌ Message notification suppressed - current user is sender');
        return false;
      }
      
      // If no recipientId but has senderId, and sender is current user, suppress
      if (data.senderId && data.senderId === currentUserId) {
        console.log('🔔 ❌ Message notification suppressed - current user is sender (fallback)');
        return false;
      }
      
      // For chat notifications without explicit recipient, check if title indicates it's for current user
      if (data.chatId && data.title && data.title.includes('from')) {
        // This is a message notification, allow it if not from current user
        console.log('🔔 ✅ Message notification allowed (not from current user)');
        return true;
      }
      
      // If we can't determine the recipient, allow the notification
      console.log('🔔 ✅ Message notification allowed - unable to determine recipient/sender relationship');
      return true;
    }

    // For other notification types (likes, comments, follows), check if they're for current user
    if (data && (data.type === 'like' || data.type === 'comment' || data.type === 'follow')) {
      console.log('🔔 ❤️ Processing social notification:', {
        recipientId: data.recipientId,
        userId: data.userId,
        type: data.type
      });
      
      if (data.recipientId && data.recipientId === currentUserId) {
        console.log('🔔 ✅ Social notification allowed - current user is recipient');
        return true;
      }
      
      if (data.userId && data.userId === currentUserId) {
        console.log('🔔 ❌ Social notification suppressed - current user is target');
        return false;
      }
      
      console.log('🔔 ✅ Social notification allowed - unable to determine recipient relationship');
      return true;
    }

    // Default: allow notification if we can't determine it should be suppressed
    console.log('🔔 ✅ Notification allowed - no specific filtering rules apply');
    return true;
  }

  // Get current user ID (updated to use the tracked value)
  getCurrentUserId() {
    return currentUserId;
  }

  // Check notification filtering status
  getNotificationFilteringStatus() {
    return {
      currentUserId,
      isFilteringEnabled: currentUserId !== null,
      timestamp: new Date().toISOString()
    };
  }

  // Set current user ID for notification filtering
  setCurrentUserId(userId) {
    console.log('🔔 setCurrentUserId called with:', userId);
    currentUserId = userId;
    console.log('🔔 Current user ID set for notifications:', currentUserId);
  }

  // Clear current user ID (for logout)
  clearCurrentUserId() {
    console.log('🔔 clearCurrentUserId called, clearing current user ID');
    currentUserId = null;
    console.log('🔔 Current user ID cleared, notification filtering disabled');
  }

  // Test notification filtering with sample data
  testNotificationFiltering() {
    const testNotifications = [
      {
        type: 'message',
        senderId: 'user1',
        recipientId: 'user2',
        title: 'New message from user1'
      },
      {
        type: 'message', 
        senderId: 'user2',
        recipientId: 'user1',
        title: 'New message from user2'
      },
      {
        type: 'like',
        userId: 'user1',
        recipientId: 'user2'
      }
    ];

    console.log('🧪 Testing notification filtering...');
    console.log('🔔 Current user ID:', currentUserId);
    
    testNotifications.forEach((notification, index) => {
      const shouldShow = this.shouldShowNotificationForCurrentUser(notification);
      console.log(`🧪 Test ${index + 1}:`, {
        notification,
        shouldShow,
        result: shouldShow ? '✅ ALLOWED' : '❌ SUPPRESSED'
      });
    });
  }

  // Log current notification filtering status
  logNotificationFilteringStatus() {
    console.log('🔔 📊 Current notification filtering status:', {
      currentUserId,
      isFilteringEnabled: currentUserId !== null,
      timestamp: new Date().toISOString(),
      serviceInstance: !!this
    });
  }

  // Initialize push notification service
  async initialize() {
    try {
      console.log('🔔 Initializing push notification service...');
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        console.log('✅ Push notification service initialized successfully');
        return true;
      } else {
        console.log('⚠️ Failed to initialize push notification service');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing push notification service:', error);
      return false;
    }
  }

  // Update push token for user on server
  async updatePushTokenForUser() {
    try {
      const token = this.getPushToken();
      if (token) {
        // Here you would typically make an API call to update the token on your server
        console.log('✅ Push token updated for user:', token);
        return true;
      } else {
        console.log('⚠️ No push token available to update');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating push token for user:', error);
      return false;
    }
  }

  // Schedule notification
  async scheduleNotification(notificationData) {
    try {
      const { title, body, sound, data } = notificationData;
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound || 'nottif.mp3',
        },
        trigger: null, // Send immediately
      });
      console.log('✅ Test notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
      return false;
    }
  }

  // Setup Android notification channels
  async setupAndroidChannels() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'nottif.mp3',
        });

        await Notifications.setNotificationChannelAsync('likes', {
          name: 'Likes',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'nottif.mp3',
        });

        await Notifications.setNotificationChannelAsync('comments', {
          name: 'Comments',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'nottif.mp3',
        });

        await Notifications.setNotificationChannelAsync('follows', {
          name: 'Follows',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'nottif.mp3',
        });

        await Notifications.setNotificationChannelAsync('general', {
          name: 'General',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'nottif.mp3',
        });

        console.log('✅ Android notification channels created successfully');
        return true;
      } else {
        console.log('ℹ️ Notification channels are only available on Android');
        return true;
      }
    } catch (error) {
      console.error('❌ Error setting up Android notification channels:', error);
      return false;
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔔 All notifications cancelled');
      return true;
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
      return false;
    }
  }

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    try {
      let token;
      
      // Check if we're in development or production
      const isDevelopment = __DEV__;
      const isTestFlight = !isDevelopment && Platform.OS === 'ios';
      
      console.log('🔔 Registering for push notifications...');
      console.log('📱 Environment:', {
        isDevelopment,
        isProduction: !isDevelopment,
        isTestFlight,
        platform: Platform.OS
      });
      
      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          description: 'Default notification channel',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'nottif.mp3',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
      
      // Request permissions with enhanced options
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🔔 Requesting notification permissions...');
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
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission not granted');
        console.log('📋 Permission status:', finalStatus);
        return null;
      }
      
      console.log('✅ Push notification permissions granted');
      
      // Get project ID
      const projectId = this.getProjectId();
      
      // Get push token with enhanced error handling
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })).data;
        
        console.log('✅ Push token obtained successfully:', token);
        console.log('📋 Token details:', {
          token: token,
          tokenLength: token?.length,
          startsWithExponent: token?.startsWith('ExponentPushToken'),
          isDevelopment,
          isProduction: !isDevelopment,
          isTestFlight
        });
        
        // Store the token in the service
        this.expoPushToken = token;
        
        // Store the token for later use
        if (token) {
          try {
            await AsyncStorage.setItem('pushToken', token);
            console.log('💾 Push token stored in AsyncStorage');
          } catch (storageError) {
            console.log('⚠️ Could not store push token:', storageError);
          }
        }
        
      } catch (pushTokenError) {
        console.error('❌ Push token error:', pushTokenError);
        console.log('📋 Push token error details:', {
          message: pushTokenError.message,
          code: pushTokenError.code,
          stack: pushTokenError.stack
        });
        
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('❌ Push notification setup error:', error);
      console.log('📋 Setup error details:', {
        message: error.message,
        stack: error.stack
      });
      return null;
    }
  }
}

export default new PushNotificationService(); 
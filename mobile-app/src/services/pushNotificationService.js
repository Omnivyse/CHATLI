import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
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
  }

  // Initialize push notifications
  async initialize() {
    try {
      console.log('🔔 Initializing push notifications...');
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions not granted');
        return false;
      }
      
      console.log('✅ Push notification permissions granted');
      
      // Get the token
      if (Device.isDevice) {
        try {
          // Try to get projectId from various sources
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                           Constants.expoConfig?.extra?.projectId ||
                           Constants.expoConfig?.projectId;
          
          if (projectId) {
            this.expoPushToken = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
            console.log('🔔 Expo Push Token:', this.expoPushToken.data);
          } else {
            console.log('⚠️ No projectId found, skipping push token generation');
            console.log('📋 This is normal in development or without EAS configuration');
            console.log('📋 Available config:', {
              expoConfig: Constants.expoConfig,
              extra: Constants.expoConfig?.extra,
              eas: Constants.expoConfig?.extra?.eas
            });
          }
        } catch (error) {
          console.log('⚠️ Error getting push token:', error.message);
          console.log('📋 This is normal in development or without EAS configuration');
          // Don't throw the error, just log it and continue
        }
      } else {
        console.log('⚠️ Must use physical device for push notifications');
      }
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      // Don't throw the error, just return false
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    try {
      // Listen for incoming notifications when app is in foreground
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received in foreground:', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification responses (when user taps notification)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('🔔 Notification response received:', response);
        this.handleNotificationResponse(response);
      });
    } catch (error) {
      console.log('⚠️ Error setting up notification listeners:', error.message);
    }
  }

  // Handle incoming notifications
  handleNotificationReceived(notification) {
    try {
      const { title, body, data } = notification.request.content;
      console.log('🔔 Handling notification:', { title, body, data });
      
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
      if (data.type === 'chat') {
        // Navigate to chat screen
        console.log('🔔 Navigating to chat:', data.chatId);
      } else if (data.type === 'post') {
        // Navigate to post screen
        console.log('🔔 Navigating to post:', data.postId);
      } else if (data.type === 'profile') {
        // Navigate to profile screen
        console.log('🔔 Navigating to profile:', data.userId);
      }
    } catch (error) {
      console.log('⚠️ Error handling notification navigation:', error.message);
    }
  }

  // Get the push token
  getPushToken() {
    return this.expoPushToken?.data || null;
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
      console.log('🔔 Local notification sent:', { title, body });
    } catch (error) {
      console.log('⚠️ Error sending local notification:', error.message);
    }
  }

  // Schedule notification
  async scheduleNotification(title, body, data = {}, trigger) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger,
      });
      console.log('🔔 Notification scheduled:', { title, body, trigger });
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
      
      console.log('🔔 Push notification listeners cleaned up');
    } catch (error) {
      console.log('⚠️ Error cleaning up notification listeners:', error.message);
    }
  }
}

export default new PushNotificationService(); 
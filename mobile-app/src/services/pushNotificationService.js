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
        this.expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        console.log('🔔 Expo Push Token:', this.expoPushToken.data);
      } else {
        console.log('⚠️ Must use physical device for push notifications');
      }
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
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
  }

  // Handle incoming notifications
  handleNotificationReceived(notification) {
    const { title, body, data } = notification.request.content;
    console.log('🔔 Handling notification:', { title, body, data });
    
    // You can add custom logic here for handling notifications in foreground
    // For example, updating UI, playing sounds, etc.
  }

  // Handle notification responses (when user taps notification)
  handleNotificationResponse(response) {
    const { title, body, data } = response.notification.request.content;
    console.log('🔔 User tapped notification:', { title, body, data });
    
    // Handle navigation based on notification type
    this.handleNotificationNavigation(data);
  }

  // Handle navigation based on notification type
  handleNotificationNavigation(data) {
    if (!data || !data.type) return;
    
    // You can implement navigation logic here
    // This will be called when user taps on a notification
    switch (data.type) {
      case 'chat':
        // Navigate to chat screen
        console.log('🔔 Navigating to chat:', data.chatId);
        break;
      case 'like':
        // Navigate to post
        console.log('🔔 Navigating to post:', data.postId);
        break;
      case 'comment':
        // Navigate to post with comments
        console.log('🔔 Navigating to post comments:', data.postId);
        break;
      case 'follow':
        // Navigate to user profile
        console.log('🔔 Navigating to user profile:', data.userId);
        break;
      default:
        console.log('🔔 Unknown notification type:', data.type);
    }
  }

  // Get the push token
  getPushToken() {
    return this.expoPushToken?.data;
  }

  // Send local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
      console.log('🔔 Local notification sent:', { title, body, data });
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Schedule notification for later
  async scheduleNotification(title, body, data = {}, trigger) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });
      console.log('🔔 Notification scheduled:', { title, body, data, trigger });
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔔 All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      console.log('🔔 Notification settings:', settings);
      return settings;
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      return null;
    }
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    console.log('🔔 Push notification listeners cleaned up');
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService; 
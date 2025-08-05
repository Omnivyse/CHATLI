import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
      
      // Set up Android notification channels with custom sounds
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }
      
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
      
      // Update push token on server if available
      if (this.expoPushToken?.data) {
        setTimeout(async () => {
          await this.updatePushTokenOnServer();
        }, 2000); // Delay to ensure user is logged in
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
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
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
      });

      // Like notifications
      await Notifications.setNotificationChannelAsync('likes', {
        name: 'Likes',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
      });

      // Comment notifications
      await Notifications.setNotificationChannelAsync('comments', {
        name: 'Comments',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
      });

      // Follow notifications
      await Notifications.setNotificationChannelAsync('follows', {
        name: 'Follows',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
      });

      // General notifications
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'nottif.mp3',
        enableVibrate: true,
        showBadge: true,
      });

      console.log('✅ Android notification channels configured');
    } catch (error) {
      console.log('⚠️ Error setting up Android channels:', error.message);
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
    // Use the uploaded nottif.mp3 for all notification types
    return Platform.OS === 'ios' ? 'nottif.aiff' : 'nottif.mp3';
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
      
      console.log('🔔 Push notification listeners cleaned up');
    } catch (error) {
      console.log('⚠️ Error cleaning up notification listeners:', error.message);
    }
  }
}

export default new PushNotificationService(); 
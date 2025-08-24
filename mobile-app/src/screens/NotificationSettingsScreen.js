import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import pushNotificationService from '../services/pushNotificationService';

const NotificationSettingsScreen = ({ navigation, user }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  
  // Notification settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  // Load saved notification settings
  useEffect(() => {
    loadNotificationSettings();
    checkNotificationPermissions();
    
    // Set current user ID for notification filtering
    if (user?._id) {
      pushNotificationService.setCurrentUserId(user._id);
    }

    // Set up notification handler for foreground notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Set up notification listener for test notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Test notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Test notification response:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [user]);

  const checkNotificationPermissions = async () => {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== 'granted') {
        setPushNotifications(false);
      }
      
      // Check if push notification service is initialized
      const pushToken = pushNotificationService.getPushToken();
      if (!pushToken) {
        console.log('⚠️ Push notification service not initialized');
      }
    } catch (error) {
      console.log('Error checking notification permissions:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('@chatli_notification_settings');
      if (settings) {
        const savedSettings = JSON.parse(settings);
        setPushNotifications(savedSettings.pushNotifications ?? true);
        setMessageNotifications(savedSettings.messageNotifications ?? true);
        setLikeNotifications(savedSettings.likeNotifications ?? true);
        setCommentNotifications(savedSettings.commentNotifications ?? true);
        setFollowNotifications(savedSettings.followNotifications ?? true);
        setEventNotifications(savedSettings.eventNotifications ?? true);
        setSoundEnabled(savedSettings.soundEnabled ?? true);
        setVibrationEnabled(savedSettings.vibrationEnabled ?? true);
        setBadgeEnabled(savedSettings.badgeEnabled ?? true);
        setQuietHoursEnabled(savedSettings.quietHoursEnabled ?? false);
        setQuietHoursStart(savedSettings.quietHoursStart ?? '22:00');
        setQuietHoursEnd(savedSettings.quietHoursEnd ?? '08:00');
      }
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    try {
      const currentSettings = {
        pushNotifications,
        messageNotifications,
        likeNotifications,
        commentNotifications,
        followNotifications,
        eventNotifications,
        soundEnabled,
        vibrationEnabled,
        badgeEnabled,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        ...newSettings
      };
      
      await AsyncStorage.setItem('@chatli_notification_settings', JSON.stringify(currentSettings));
      console.log('✅ Notification settings saved');
    } catch (error) {
      console.log('Error saving notification settings:', error);
    }
  };

  const handlePushNotificationsToggle = async (value) => {
    if (value) {
      // Request permissions when enabling
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          getTranslation('permissionRequired', language),
          getTranslation('notificationPermissionRequired', language),
          [
            { text: getTranslation('cancel', language), style: 'cancel' },
            { text: getTranslation('settings', language), onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      // Update push token on server when enabling
      try {
        await pushNotificationService.updatePushTokenForUser();
        console.log('✅ Push token updated on server after enabling notifications');
      } catch (error) {
        console.log('⚠️ Failed to update push token on server:', error);
      }
    }
    
    setPushNotifications(value);
    saveNotificationSettings({ pushNotifications: value });
  };

  const handleSettingToggle = (setting, value) => {
    switch (setting) {
      case 'messageNotifications':
        setMessageNotifications(value);
        saveNotificationSettings({ messageNotifications: value });
        break;
      case 'likeNotifications':
        setLikeNotifications(value);
        saveNotificationSettings({ likeNotifications: value });
        break;
      case 'commentNotifications':
        setCommentNotifications(value);
        saveNotificationSettings({ commentNotifications: value });
        break;
      case 'followNotifications':
        setFollowNotifications(value);
        saveNotificationSettings({ followNotifications: value });
        break;
      case 'eventNotifications':
        setEventNotifications(value);
        saveNotificationSettings({ eventNotifications: value });
        break;
      case 'soundEnabled':
        setSoundEnabled(value);
        saveNotificationSettings({ soundEnabled: value });
        break;
      case 'vibrationEnabled':
        setVibrationEnabled(value);
        saveNotificationSettings({ vibrationEnabled: value });
        break;
      case 'badgeEnabled':
        setBadgeEnabled(value);
        saveNotificationSettings({ badgeEnabled: value });
        break;
      case 'quietHoursEnabled':
        setQuietHoursEnabled(value);
        saveNotificationSettings({ quietHoursEnabled: value });
        break;
    }
  };

  const testNotification = async () => {
    try {
      // Check permissions first
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notification permissions to test notifications',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Prepare notification content
      const notificationContent = {
        title: getTranslation('testNotification', language),
        body: getTranslation('testNotificationBody', language),
        sound: soundEnabled ? 'default' : undefined, // Use default sound instead of nottif.mp3
        data: { type: 'test' },
      };

      console.log('🔔 Sending test notification with content:', notificationContent);
      
      // Use Expo Notifications directly for local test notifications
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });
      
      console.log('✅ Test notification scheduled successfully with ID:', notificationId);
      
      // Check if notification was actually scheduled
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Current scheduled notifications:', scheduledNotifications);
      
      Alert.alert(
        getTranslation('success', language),
        getTranslation('testNotificationSent', language)
      );
    } catch (error) {
      console.log('Error sending test notification:', error);
      Alert.alert(
        getTranslation('error', language),
        getTranslation('testNotificationError', language)
      );
    }
  };



  const renderSettingItem = (icon, title, subtitle, type, value, onToggle, onPress) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingItemText}>
          <Text style={[styles.settingItemTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value ? colors.white : colors.textSecondary}
        />
      )}
      
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {getTranslation('notificationSettings', language)}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {getTranslation('pushNotifications', language)}
          </Text>
          
          {renderSettingItem(
            'notifications-outline',
            getTranslation('enablePushNotifications', language),
            getTranslation('enablePushNotificationsSubtitle', language),
            'switch',
            pushNotifications,
            handlePushNotificationsToggle
          )}
        </View>

        {/* Notification Types Section */}
        {pushNotifications && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {getTranslation('notificationTypes', language)}
            </Text>
            
            {renderSettingItem(
              'chatbubbles-outline',
              getTranslation('messageNotifications', language),
              getTranslation('messageNotificationsSubtitle', language),
              'switch',
              messageNotifications,
              (value) => handleSettingToggle('messageNotifications', value)
            )}
            
            {renderSettingItem(
              'heart-outline',
              getTranslation('likeNotifications', language),
              getTranslation('likeNotificationsSubtitle', language),
              'switch',
              likeNotifications,
              (value) => handleSettingToggle('likeNotifications', value)
            )}
            
            {renderSettingItem(
              'chatbox-outline',
              getTranslation('commentNotifications', language),
              getTranslation('commentNotificationsSubtitle', language),
              'switch',
              commentNotifications,
              (value) => handleSettingToggle('commentNotifications', value)
            )}
            
            {renderSettingItem(
              'people-outline',
              getTranslation('followNotifications', language),
              getTranslation('followNotificationsSubtitle', language),
              'switch',
              followNotifications,
              (value) => handleSettingToggle('followNotifications', value)
            )}
            
            {renderSettingItem(
              'calendar-outline',
              getTranslation('eventNotifications', language),
              getTranslation('eventNotificationsSubtitle', language),
              'switch',
              eventNotifications,
              (value) => handleSettingToggle('eventNotifications', value)
            )}
          </View>
        )}

        {/* Notification Behavior Section */}
        {pushNotifications && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {getTranslation('notificationBehavior', language)}
            </Text>
            
            {renderSettingItem(
              'volume-high-outline',
              getTranslation('sound', language),
              getTranslation('soundSubtitle', language),
              'switch',
              soundEnabled,
              (value) => handleSettingToggle('soundEnabled', value)
            )}
            
            {renderSettingItem(
              'phone-portrait-outline',
              getTranslation('vibration', language),
              getTranslation('vibrationSubtitle', language),
              'switch',
              vibrationEnabled,
              (value) => handleSettingToggle('vibrationEnabled', value)
            )}
            
            {renderSettingItem(
              'ellipse-outline',
              getTranslation('badge', language),
              getTranslation('badgeSubtitle', language),
              'switch',
              badgeEnabled,
              (value) => handleSettingToggle('badgeEnabled', value)
            )}
          </View>
        )}

        {/* Quiet Hours Section */}
        {pushNotifications && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {getTranslation('quietHours', language)}
            </Text>
            
            {renderSettingItem(
              'moon-outline',
              getTranslation('enableQuietHours', language),
              getTranslation('quietHoursSubtitle', language),
              'switch',
              quietHoursEnabled,
              (value) => handleSettingToggle('quietHoursEnabled', value)
            )}
            
            {quietHoursEnabled && (
              <>
                <Text style={[styles.quietHoursText, { color: colors.textSecondary }]}>
                  {getTranslation('quietHoursRange', language)}: {quietHoursStart} - {quietHoursEnd}
                </Text>
                <Text style={[styles.quietHoursNote, { color: colors.textSecondary }]}>
                  {getTranslation('quietHoursNote', language)}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {getTranslation('actions', language)}
          </Text>
          
          {renderSettingItem(
            'play-outline',
            getTranslation('testNotification', language),
            getTranslation('testNotificationSubtitle', language),
            'arrow',
            null,
            null,
            testNotification
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {getTranslation('notificationSettingsInfo', language)}
          </Text>
          
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  quietHoursText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  quietHoursNote: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
    fontStyle: 'italic',
  },
  infoSection: {
    marginTop: 32,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
     infoText: {
     fontSize: 12,
     textAlign: 'center',
     lineHeight: 16,
   },
});

export default NotificationSettingsScreen;

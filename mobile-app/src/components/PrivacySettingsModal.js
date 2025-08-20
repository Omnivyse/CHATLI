import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeColors } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

const PrivacySettingsModal = ({ visible, onClose, user }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    isPrivateAccount: false,
    showProfileInSearch: true,
    allowMessagesFromStrangers: true,
    showOnlineStatus: true,
    showLastSeen: true,
    allowProfileViews: true,
    allowPostComments: true,
    allowEventInvites: true,
  });

  useEffect(() => {
    if (visible) {
      loadPrivacySettings();
    }
  }, [visible]);

  const loadPrivacySettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPrivacySettings();
      console.log('Privacy settings response:', response);
      
      if (response.success && response.data) {
        // Ensure all settings have default values if missing
        const loadedSettings = {
          isPrivateAccount: false,
          showProfileInSearch: true,
          allowMessagesFromStrangers: true,
          showOnlineStatus: true,
          showLastSeen: true,
          allowProfileViews: true,
          allowPostComments: true,
          allowEventInvites: true,
          ...response.data // Override with server data
        };
        
        console.log('Setting privacy settings to:', loadedSettings);
        setPrivacySettings(loadedSettings);
      } else {
        console.log('No privacy settings found, using defaults');
        // Keep default settings if no data from server
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      // Keep current settings if loading fails
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (settingKey, value) => {
    // Store the previous state before making changes
    const previousSettings = { ...privacySettings };
    const newSettings = { ...privacySettings, [settingKey]: value };
    setPrivacySettings(newSettings);
    
    setSaving(true);
    try {
      const response = await apiService.updatePrivacySettings({ [settingKey]: value });
      if (!response.success) {
        // Revert to previous state if failed
        setPrivacySettings(previousSettings);
        Alert.alert('Error', 'Failed to save settings');
      } else {
        console.log('Privacy setting updated successfully:', settingKey, value);
      }
    } catch (error) {
      // Revert to previous state if failed
      setPrivacySettings(previousSettings);
      console.error('Error updating privacy setting:', error);
      Alert.alert('Алдаа', 'Тохиргоо хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivateAccountToggle = async (value) => {
    if (value) {
      Alert.alert(
        getTranslation('privateAccount', language),
        getTranslation('privateAccountSecretPostWarning', language),
        [
          { text: getTranslation('cancel', language), style: 'cancel' },
          { text: getTranslation('yes', language), onPress: () => handleToggleSetting('isPrivateAccount', value) }
        ]
      );
    } else {
      handleToggleSetting('isPrivateAccount', value);
    }
  };

  const privacySections = [
    {
      title: 'Profile Visibility',
      items: [
        {
          key: 'isPrivateAccount',
          title: 'Хувийн аккаунт',
          subtitle: 'Only followers can see your posts',
          type: 'switch',
          value: privacySettings.isPrivateAccount,
          onToggle: handlePrivateAccountToggle,
          icon: 'lock-closed-outline',
        },
        {
          key: 'showProfileInSearch',
          title: 'Хайлтад харагдах',
          subtitle: 'Profile appears in search results',
          type: 'switch',
          value: privacySettings.showProfileInSearch,
          onToggle: (value) => handleToggleSetting('showProfileInSearch', value),
          icon: 'search-outline',
        },
        {
          key: 'allowProfileViews',
          title: 'Профайл харагдах',
          subtitle: 'People can view your profile',
          type: 'switch',
          value: privacySettings.allowProfileViews,
          onToggle: (value) => handleToggleSetting('allowProfileViews', value),
          icon: 'eye-outline',
        },
      ],
    },
    {
      title: 'Холбоо барих',
      items: [
        {
          key: 'allowMessagesFromStrangers',
          title: 'Messages from Strangers',
          subtitle: 'Receive messages from unknown people',
          type: 'switch',
          value: privacySettings.allowMessagesFromStrangers,
          onToggle: (value) => handleToggleSetting('allowMessagesFromStrangers', value),
          icon: 'chatbubble-outline',
        },
        {
          key: 'allowEventInvites',
          title: 'Event Invites',
          subtitle: 'Receive event invitations',
          type: 'switch',
          value: privacySettings.allowEventInvites,
          onToggle: (value) => handleToggleSetting('allowEventInvites', value),
          icon: 'calendar-outline',
        },
      ],
    },
    {
      title: 'Online Status',
      items: [
        {
          key: 'showOnlineStatus',
          title: 'Онлайн статус',
          subtitle: 'Онлайн байгаагаа харуулах',
          type: 'switch',
          value: privacySettings.showOnlineStatus,
          onToggle: (value) => handleToggleSetting('showOnlineStatus', value),
          icon: 'wifi-outline',
        },
        {
          key: 'showLastSeen',
          title: 'Сүүлд харагдах',
          subtitle: 'Сүүлд харагдах хугацааг харуулах',
          type: 'switch',
          value: privacySettings.showLastSeen,
          onToggle: (value) => handleToggleSetting('showLastSeen', value),
          icon: 'time-outline',
        },
      ],
    },
    {
      title: 'Контент',
      items: [
        {
          key: 'allowPostComments',
          title: 'Post Comments',
          subtitle: 'Allow comments on posts',
          type: 'switch',
          value: privacySettings.allowPostComments,
          onToggle: (value) => handleToggleSetting('allowPostComments', value),
          icon: 'chatbox-outline',
        },
      ],
    },
  ];

  const renderPrivacyItem = ({ item }) => (
    <View style={[styles.privacyItem, { borderBottomColor: colors.border }]}>
      <View style={styles.privacyItemLeft}>
        <View style={[styles.privacyIcon, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name={item.icon} size={20} color={colors.text} />
        </View>
        <View style={styles.privacyContent}>
          <Text style={[styles.privacyTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.privacySubtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.privacyItemRight}>
        {saving && item.key === privacySettings.lastChanged ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor={item.value ? colors.primary : colors.textSecondary}
            disabled={saving}
          />
        )}
      </View>
    </View>
  );

  const renderSection = ({ item: section }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
      {section.items.map((item, index) => (
        <View key={item.key}>
          {renderPrivacyItem({ item })}
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Privacy Settings
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading settings...
            </Text>
          </View>
        ) : (
          <FlatList
            data={privacySections}
            renderItem={renderSection}
            keyExtractor={(item) => item.title}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  privacySubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  privacyItemRight: {
    marginLeft: 16,
  },
};

export default PrivacySettingsModal; 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '../utils/themeUtils';
import ThemeToggle from '../components/ThemeToggle';
import ChangePasswordModal from '../components/ChangePasswordModal';
import PrivacySettingsModal from '../components/PrivacySettingsModal';
import ReportModal from '../components/ReportModal';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation, user, onLogout }) => {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const colors = getThemeColors(theme);
  
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Recreate settings data when language changes
  useEffect(() => {
    console.log('🔄 Language changed, recreating settings data');
  }, [language]);

  const settingsData = [
    {
      title: getTranslation('account', language),
      items: [
        {
          icon: 'person-outline',
          title: getTranslation('editProfile', language),
          subtitle: getTranslation('editProfile', language),
          type: 'arrow',
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: 'notifications-outline',
          title: getTranslation('notifications', language),
          subtitle: getTranslation('notifications', language),
          type: 'arrow',
          onPress: () => navigation.navigate('Notifications'),
        },
      ],
    },
    {
      title: getTranslation('settings', language),
      items: [
        {
          icon: 'moon-outline',
          title: getTranslation('darkMode', language),
          subtitle: getTranslation('darkMode', language),
          type: 'custom',
          customComponent: <ThemeToggle size={20} />,
        },
        {
          icon: 'download-outline',
          title: getTranslation('autoDownload', language),
          subtitle: getTranslation('autoDownload', language),
          type: 'switch',
          value: autoDownload,
          onToggle: setAutoDownload,
        },
        {
          icon: 'cellular-outline',
          title: getTranslation('mobileData', language),
          subtitle: getTranslation('mobileData', language),
          type: 'arrow',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: getTranslation('comingSoon', language),
              text2: getTranslation('mobileDataComingSoon', language),
            });
          },
        },
        {
          icon: 'language-outline',
          title: getTranslation('language', language),
          subtitle: language === 'mn' ? getTranslation('mongolian', language) : getTranslation('english', language),
          type: 'arrow',
          onPress: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      title: getTranslation('privacy', language),
      items: [
        {
          icon: 'shield-outline',
          title: getTranslation('twoFactorAuth', language),
          subtitle: getTranslation('twoFactorAuth', language),
          type: 'arrow',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: getTranslation('comingSoon', language),
              text2: getTranslation('twoFactorAuthComingSoon', language),
            });
          },
        },
        {
          icon: 'lock-closed-outline',
          title: getTranslation('changePassword', language),
          subtitle: getTranslation('changePassword', language),
          type: 'arrow',
          onPress: () => {
            console.log('🔄 Password change button pressed');
            setShowChangePassword(true);
          },
        },
        {
          icon: 'shield-checkmark-outline',
          title: getTranslation('privacySettings', language),
          subtitle: getTranslation('privacySettings', language),
          type: 'arrow',
          onPress: () => {
            setShowPrivacySettings(true);
          },
        },
        {
          icon: 'eye-off-outline',
          title: getTranslation('privacyPolicy', language),
          subtitle: getTranslation('privacyPolicy', language),
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              getTranslation('privacyPolicy', language),
              getTranslation('privacyPolicyText', language),
              [{ text: getTranslation('ok', language) }]
            );
          },
        },
      ],
    },
    {
      title: getTranslation('help', language),
      items: [
        {
          icon: 'help-circle-outline',
          title: getTranslation('helpCenter', language),
          subtitle: getTranslation('helpCenter', language),
          type: 'arrow',
          onPress: () => {
            navigation.navigate('HelpCenter');
          },
        },
        {
          icon: 'mail-outline',
          title: getTranslation('contact', language),
          subtitle: getTranslation('contactText', language),
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              getTranslation('contact', language),
              getTranslation('contactText', language),
              [{ text: getTranslation('ok', language) }]
            );
          },
        },
        {
          icon: 'warning-outline',
          title: getTranslation('report', language),
          subtitle: getTranslation('reportIssue', language),
          type: 'arrow',
          onPress: () => {
            setShowReportModal(true);
          },
          isDestructive: true,
        },
        {
          icon: 'log-out-outline',
          title: getTranslation('logout', language),
          subtitle: getTranslation('logout', language),
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              getTranslation('logout', language),
              getTranslation('logoutConfirm', language),
              [
                { text: getTranslation('cancel', language), style: 'cancel' },
                { text: getTranslation('logout', language), onPress: onLogout, style: 'destructive' }
              ]
            );
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    const isDestructive = item.isDestructive;
    const iconColor = isDestructive ? '#FF3B30' : colors.primary;
    const iconBgColor = isDestructive ? '#FF3B3015' : colors.primary + '15';
    const titleColor = isDestructive ? '#FF3B30' : colors.text;
    const subtitleColor = isDestructive ? '#FF3B3080' : colors.textSecondary;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.settingItem,
          { backgroundColor: colors.surface },
          index === 0 && { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
          index === settingsData.find(section => section.items.includes(item))?.items.length - 1 && 
            { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderBottomWidth: 0 }
        ]}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
        activeOpacity={0.7}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, { backgroundColor: iconBgColor }]}>
            <Ionicons name={item.icon} size={22} color={iconColor} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: titleColor }]}>
              {item.title}
            </Text>
            <Text style={[styles.settingSubtitle, { color: subtitleColor }]}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        
        <View style={styles.settingItemRight}>
          {item.type === 'switch' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.surfaceVariant, true: colors.primary + '40' }}
              thumbColor={item.value ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.surfaceVariant}
            />
          ) : item.type === 'custom' ? (
            item.customComponent
          ) : item.type === 'arrow' ? (
            <Ionicons name="chevron-forward" size={20} color={subtitleColor} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const handleLanguageChange = async (newLanguage) => {
    try {
      console.log('🔄 Changing language to:', newLanguage);
      await setLanguage(newLanguage);
      console.log('✅ Language changed successfully');
      setShowLanguageModal(false);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: getTranslation('success', newLanguage),
        text2: getTranslation('languageChanged', newLanguage),
      });
    } catch (error) {
      console.error('❌ Language change error:', error);
      Toast.show({
        type: 'error',
        text1: getTranslation('error', newLanguage),
        text2: getTranslation('languageChangeError', newLanguage),
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {getTranslation('settings', language)}
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {settingsData.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            CHATLI v1.0.0 Beta
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textTertiary }]}>
            {getTranslation('betaVersion', language)}
          </Text>
        </View>
      </ScrollView>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          Toast.show({
            type: 'success',
            text1: getTranslation('success', language),
            text2: getTranslation('passwordChangeSuccess', language),
          });
          setShowChangePassword(false);
        }}
        onLogout={onLogout}
      />

      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        onSuccess={() => {
          Toast.show({
            type: 'success',
            text1: getTranslation('success', language),
            text2: getTranslation('privacySettingsSuccessDescription', language),
          });
          setShowPrivacySettings(false);
        }}
      />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'F0' }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {getTranslation('selectLanguage', language)}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  { backgroundColor: colors.surfaceVariant },
                  language === 'mn' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleLanguageChange('mn')}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: colors.text }]}>
                    {getTranslation('mongolian', 'mn')}
                  </Text>
                  <Text style={[styles.languageNative, { color: colors.textSecondary }]}>
                    English
                  </Text>
                </View>
                {language === 'mn' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  { backgroundColor: colors.surfaceVariant },
                  language === 'en' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleLanguageChange('en')}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: colors.text }]}>
                    {getTranslation('english', 'en')}
                  </Text>
                  <Text style={[styles.languageNative, { color: colors.textSecondary }]}>
                    English
                  </Text>
                </View>
                {language === 'en' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingItemRight: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  languageOptions: {
    gap: 16,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 16,
    opacity: 0.7,
  },
});

export default SettingsScreen; 
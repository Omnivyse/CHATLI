import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';

const { width, height } = Dimensions.get('window');

const AppUpdateScreen = ({ 
  isUpdateRequired = true, 
  currentVersion = '1.0.9',
  latestVersion = '1.1.0',
  updateDescription = '',
  onSkip = null,
  onUpdate
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);

  const handleUpdate = async () => {
    try {
      // Open App Store for iOS
      const appStoreUrl = 'https://apps.apple.com/app/chatli/id1234567890'; // Replace with your actual App Store URL
      const supported = await Linking.canOpenURL(appStoreUrl);
      
      if (supported) {
        await Linking.openURL(appStoreUrl);
      } else {
        Alert.alert(
          getTranslation('error', language),
          getTranslation('cannotOpenAppStore', language),
          [{ text: getTranslation('ok', language) }]
        );
      }
    } catch (error) {
      console.error('Error opening App Store:', error);
      Alert.alert(
        getTranslation('error', language),
        getTranslation('updateError', language),
        [{ text: getTranslation('ok', language) }]
      );
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="chatbubbles" size={80} color={colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {getTranslation('updateAvailable', language)}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {getTranslation('updateRequiredMessage', language)}
        </Text>

        {/* Version Info */}
        <View style={[styles.versionContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
              {getTranslation('currentVersion', language)}:
            </Text>
            <Text style={[styles.versionValue, { color: colors.text }]}>
              {currentVersion}
            </Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
              {getTranslation('latestVersion', language)}:
            </Text>
            <Text style={[styles.versionValue, { color: colors.primary }]}>
              {latestVersion}
            </Text>
          </View>
        </View>

        {/* Update Description */}
        {updateDescription && (
          <View style={[styles.descriptionContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.descriptionTitle, { color: colors.text }]}>
              {getTranslation('whatsNew', language)}:
            </Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {updateDescription}
            </Text>
          </View>
        )}

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: colors.primary }]}
          onPress={handleUpdate}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up-circle" size={24} color="white" />
          <Text style={styles.updateButtonText}>
            {getTranslation('updateNow', language)}
          </Text>
        </TouchableOpacity>

        {/* Skip Button (only show if not required) */}
        {!isUpdateRequired && onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              {getTranslation('skipForNow', language)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            {getTranslation('updateBenefits', language)}:
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {getTranslation('bugFixes', language)}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {getTranslation('performanceImprovements', language)}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {getTranslation('newFeatures', language)}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {getTranslation('securityUpdates', language)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  versionContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  featuresContainer: {
    width: '100%',
    marginTop: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});

export default AppUpdateScreen; 
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';

const { width, height } = Dimensions.get('window');

const AppUpdateScreen = ({
  currentVersion = '1.5.0',
  latestVersion = '1.5.0',
  updateDescription = '',
  isUpdateRequired = false,
  isForceUpdate = false,
  onUpdate,
  onSkip,
  isTestFlight = false,
  storeUrl = null
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);

  const handleUpdate = async () => {
    if (isTestFlight) {
      // For TestFlight, just close the screen
      if (onUpdate) {
        onUpdate();
      }
    } else {
      // For regular updates, open the appropriate store
      try {
        if (storeUrl) {
          const supported = await Linking.canOpenURL(storeUrl);
          if (supported) {
            await Linking.openURL(storeUrl);
          } else {
            Alert.alert('Error', 'Cannot open app store. Please update manually.');
          }
        } else {
          Alert.alert('Update', 'Please update the app from your device\'s app store.');
        }
      } catch (error) {
        console.error('Error opening store:', error);
        Alert.alert('Error', 'Failed to open app store. Please update manually.');
      }
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primary + '80']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* App Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="chatbubbles" size={60} color="white" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {isTestFlight
                ? getTranslation('welcomeToUpdate', language) || 'Welcome to CHATLI!'
                : getTranslation('updateAvailable', language)
              }
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {isTestFlight
                ? getTranslation('testFlightWelcomeMessage', language) || 'Discover what\'s new in this version and enjoy an enhanced messaging experience.'
                : getTranslation('updateRequiredMessage', language)
              }
            </Text>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Version Comparison Card */}
          <View style={[styles.versionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.versionHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <Text style={[styles.versionCardTitle, { color: colors.text }]}>
                {getTranslation('versionInfo', language)}
              </Text>
            </View>

            <View style={styles.versionComparison}>
              <View style={styles.versionItem}>
                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                  {getTranslation('currentVersion', language)}
                </Text>
                <View style={[styles.versionBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.versionValue, { color: colors.text }]}>
                    {currentVersion}
                  </Text>
                </View>
              </View>

              <View style={styles.versionArrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
              </View>

              <View style={styles.versionItem}>
                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                  {getTranslation('latestVersion', language)}
                </Text>
                <View style={[styles.versionBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.versionValue, { color: colors.primary }]}>
                    {latestVersion}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Update Description Card */}
          {updateDescription && (
            <View style={[styles.descriptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.descriptionHeader}>
                <Ionicons name="newspaper" size={24} color={colors.primary} />
                <Text style={[styles.descriptionTitle, { color: colors.text }]}>
                  {getTranslation('whatsNew', language)}
                </Text>
              </View>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                {updateDescription}
              </Text>
            </View>
          )}

          {/* Features Card */}
          <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.featuresHeader}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text style={[styles.featuresTitle, { color: colors.text }]}>
                {getTranslation('updateBenefits', language)}
              </Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  {getTranslation('bugFixes', language)}
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  {getTranslation('performanceImprovements', language)}
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  {getTranslation('newFeatures', language)}
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  {getTranslation('securityUpdates', language)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={isTestFlight ? handleSkip : handleUpdate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'CC']}
                style={styles.updateButtonGradient}
              >
                <Ionicons
                  name={isTestFlight ? "checkmark-circle" : "arrow-up-circle"}
                  size={24}
                  color="white"
                />
                <Text style={styles.updateButtonText}>
                  {isTestFlight
                    ? (getTranslation('getStarted', language) || 'Get Started')
                    : getTranslation('updateNow', language)
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Skip Button (only show if not required and not TestFlight) */}
            {!isUpdateRequired && onSkip && !isTestFlight && (
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
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  versionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  versionCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  versionComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionItem: {
    flex: 1,
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  versionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionArrow: {
    paddingHorizontal: 16,
  },
  descriptionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  featuresCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 16,
  },
  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AppUpdateScreen; 
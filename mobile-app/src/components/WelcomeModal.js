import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const { width, height } = Dimensions.get('window');

const WelcomeModal = ({ isVisible, onClose, isNewUser = false }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: 'chatbubbles',
      title: 'Мессеж солилцох',
      description: 'Бодит цагийн мессеж солилцох, хариу өгөх, реакц үүсгэх'
    },
    {
      icon: 'people',
      title: 'Хэрэглэгчид',
      description: 'Бусад хэрэглэгчдийг дагах, хувийн профайл тохируулах'
    },
    {
      icon: 'image',
      title: 'Зураг хуваалцах',
      description: 'Өндөр чанартай зураг upload хийх, харах'
    },
    {
      icon: 'videocam',
      title: 'Видео контент',
      description: 'Видео үзэх, хуваалцах, босоо болон хэвтээ формат дэмжих'
    },
    {
      icon: 'notifications',
      title: 'Мэдэгдэл',
      description: 'Шинэ мессеж, дагагч, реакцийн мэдэгдэл авах'
    },
    {
      icon: 'shield-checkmark',
      title: 'Аюулгүй байдал',
      description: 'JWT баталгаажуулалт, хувийн мэдээлэл хамгаалах'
    }
  ];

  const updates = [
    'Beta хувилбар - туршилтын горим',
    'Cloudinary интеграци - хурдан зураг/видео upload',
    'Видео автомат размер тохируулга',
    'Хэрэглэгч татах/устгах функц',
    'Сайжруулсан UI/UX дизайн',
    'Монгол хэл дэмжлэг',
    'Хувийн профайл тохиргоо',
    'Дагах хүсэлт систем',
    'Event үүсгэх болон оролцох',
    'Push мэдэгдэл'
  ];

  const slides = [
    {
      title: 'CHATLI Platform',
      content: (
        <View style={styles.slideContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            CHATLI Platform
          </Text>
          
          <View style={[styles.betaBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.betaText, { color: colors.primary }]}>
              🚧 BETA ТЕСТ
            </Text>
          </View>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {isNewUser 
              ? 'Манай платформд тавтай морил! Бид танд хамгийн сайн мессеж солилцох туршлага санал болгож байна.'
              : 'Дахин тавтай морил! Шинэ шинэчлэлтүүдийг харцгаая.'
            }
          </Text>
          
          <View style={[styles.warningContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>
                Beta тестийн анхааруулга
              </Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                Туршилтын хувилбар. Алдаа гарч болно.
              </Text>
            </View>
          </View>
          
          <View style={[styles.versionContainer, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.versionText, { color: colors.primary }]}>
              Хувилбар 1.0.0 BETA - 2025 оны 1 сар
            </Text>
          </View>
        </View>
      )
    },
    {
      title: 'Онцлог шинж чанарууд',
      content: (
        <View style={styles.slideContent}>
          <Text style={[styles.slideTitle, { color: colors.text }]}>
            Онцлог шинж чанарууд
          </Text>
          <ScrollView style={styles.featuresList} showsVerticalScrollIndicator={false}>
            {features.map((feature, index) => (
              <View key={index} style={[styles.featureItem, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={feature.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )
    },
    {
      title: 'Шинэчлэлтүүд',
      content: (
        <View style={styles.slideContent}>
          <Text style={[styles.slideTitle, { color: colors.text }]}>
            Шинэчлэлтүүд
          </Text>
          <ScrollView style={styles.updatesList} showsVerticalScrollIndicator={false}>
            {updates.map((update, index) => (
              <View key={index} style={[styles.updateItem, { backgroundColor: colors.surface }]}>
                <View style={[styles.updateIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.updateText, { color: colors.text }]}>
                  {update}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'F0' }]}>
      <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {slides[currentSlide].title}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {slides[currentSlide].content}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentSlide ? colors.primary : colors.border,
                    width: index === currentSlide ? 20 : 8,
                  }
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigation}>
            {currentSlide > 0 && (
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={prevSlide}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
                <Text style={[styles.navButtonText, { color: colors.text }]}>Өмнөх</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={nextSlide}
            >
              <Text style={[styles.navButtonText, { color: colors.textInverse }]}>
                {currentSlide === slides.length - 1 ? 'Дууссан' : 'Дараах'}
              </Text>
              <Ionicons 
                name={currentSlide === slides.length - 1 ? "checkmark" : "chevron-forward"} 
                size={20} 
                color={colors.textInverse} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  betaBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  betaText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 16,
  },
  versionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  updatesList: {
    flex: 1,
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  updateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    marginLeft: 12,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
});

export default WelcomeModal; 
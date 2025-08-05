import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import api from '../services/api';

const ReportModal = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  
  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isLargeScreen = screenWidth > 768;
  
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportCategories = [
    { 
      key: 'bug', 
      label: language === 'mn' ? 'Программын алдаа' : 'App Bug',
      icon: 'bug-outline',
      color: '#FF6B6B'
    },
    { 
      key: 'inappropriate_content', 
      label: language === 'mn' ? 'Зохисгүй агуулга' : 'Inappropriate Content',
      icon: 'warning-outline',
      color: '#FFA726'
    },
    { 
      key: 'spam', 
      label: language === 'mn' ? 'Спам' : 'Spam',
      icon: 'mail-unread-outline',
      color: '#66BB6A'
    },
    { 
      key: 'harassment', 
      label: language === 'mn' ? 'Дээрэм' : 'Harassment',
      icon: 'shield-outline',
      color: '#EF5350'
    },
    { 
      key: 'fake_account', 
      label: language === 'mn' ? 'Хуурамч данс' : 'Fake Account',
      icon: 'person-remove-outline',
      color: '#AB47BC'
    },
    { 
      key: 'other', 
      label: language === 'mn' ? 'Бусад' : 'Other',
      icon: 'ellipsis-horizontal-outline',
      color: '#42A5F5'
    },
  ];

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert(
        getTranslation('error', language),
        getTranslation('reportCategory', language)
      );
      return;
    }

    if (!description || description.trim().length < 10) {
      Alert.alert(
        getTranslation('error', language),
        getTranslation('reportDescription', language)
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.submitReport(category, description.trim());
      
      if (response.success) {
        Alert.alert(
          getTranslation('success', language),
          getTranslation('reportSubmitted', language),
          [{ text: getTranslation('ok', language), onPress: handleClose }]
        );
      } else {
        Alert.alert(
          getTranslation('error', language),
          response.message || getTranslation('reportError', language)
        );
      }
    } catch (error) {
      console.error('Report submission error:', error);
      Alert.alert(
        getTranslation('error', language),
        getTranslation('reportError', language)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategory('');
    setDescription('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: colors.background,
            width: isSmallScreen ? '92%' : isLargeScreen ? '65%' : '85%',
            maxWidth: isLargeScreen ? 550 : 450,
            maxHeight: isSmallScreen ? '85%' : '80%',
          }
        ]}>
          
          {/* Modern Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconContainer, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="warning" size={20} color="white" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {getTranslation('reportIssue', language)}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  {getTranslation('reportDescription', language)}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleClose} 
              disabled={loading}
              style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {getTranslation('reportCategory', language)}
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Select the most appropriate category for your report
              </Text>
              
              <View style={styles.categoryGrid}>
                {reportCategories.map((cat, index) => {
                  console.log(`Rendering category ${index + 1}: ${cat.key} - ${cat.label}`);
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryButton,
                        { 
                          backgroundColor: category === cat.key ? cat.color : colors.surfaceVariant,
                          borderColor: category === cat.key ? cat.color : colors.border,
                        }
                      ]}
                      onPress={() => setCategory(cat.key)}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.categoryIconContainer,
                        { backgroundColor: category === cat.key ? 'rgba(255, 255, 255, 0.2)' : colors.surface }
                      ]}>
                        <Ionicons 
                          name={cat.icon} 
                          size={18} 
                          color={category === cat.key ? 'white' : cat.color} 
                        />
                      </View>
                      <Text style={[
                        styles.categoryText,
                        { color: category === cat.key ? 'white' : colors.text }
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {getTranslation('reportDescription', language)}
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Please provide detailed information about the issue
              </Text>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.surfaceVariant }]}>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    { color: colors.text }
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  editable={!loading}
                  maxLength={500}
                />
                <View style={styles.inputFooter}>
                  <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                    {description.length}/500 characters
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modern Submit Button */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: loading ? colors.surfaceVariant : '#FF3B30',
                  opacity: loading ? 0.6 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons name="send" size={18} color="white" style={styles.submitIcon} />
                  <Text style={styles.submitButtonText}>
                    {getTranslation('submit', language)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },

  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 16,
    lineHeight: 18,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    minHeight: 200,
  },

  categoryButton: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },

  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },

  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  descriptionInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 100,
  },

  inputFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'flex-end',
  },

  characterCount: {
    fontSize: 11,
    fontWeight: '500',
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },

  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitIcon: {
    marginRight: 8,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default ReportModal; 
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
      icon: 'bug-outline'
    },
    { 
      key: 'inappropriate_content', 
      label: language === 'mn' ? 'Зохисгүй агуулга' : 'Inappropriate Content',
      icon: 'warning-outline'
    },
    { 
      key: 'spam', 
      label: language === 'mn' ? 'Спам' : 'Spam',
      icon: 'mail-unread-outline'
    },
    { 
      key: 'harassment', 
      label: language === 'mn' ? 'Дээрэм' : 'Harassment',
      icon: 'shield-outline'
    },
    { 
      key: 'fake_account', 
      label: language === 'mn' ? 'Хуурамч данс' : 'Fake Account',
      icon: 'person-remove-outline'
    },
    { 
      key: 'other', 
      label: language === 'mn' ? 'Бусад' : 'Other',
      icon: 'ellipsis-horizontal-outline'
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

  // Debug: Log when modal is visible
  React.useEffect(() => {
    if (visible) {
      console.log('🔍 ReportModal opened');
      console.log('📊 Categories:', reportCategories.length);
      console.log('🌐 Language:', language);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
             <View style={styles.overlay}>
                                                                       <View style={[
                                      styles.modalContainer, 
                                      { 
                                        backgroundColor: colors.background,
                                        width: isSmallScreen ? '98%' : isLargeScreen ? '70%' : '90%',
                                        maxWidth: isLargeScreen ? 600 : 500,
                                        maxHeight: isSmallScreen ? '95%' : '90%',
                                        borderRadius: isSmallScreen ? 12 : 16,
                                      }
                                    ]}>
           
           {/* Header */}
                       <View style={[
              styles.header, 
              { 
                borderBottomColor: colors.border,
                paddingHorizontal: isSmallScreen ? 12 : 16,
                paddingVertical: isSmallScreen ? 12 : 14,
              }
            ]}>
            <TouchableOpacity 
              onPress={handleClose} 
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Ionicons name="warning" size={24} color="#FF3B30" style={styles.headerIcon} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {getTranslation('reportIssue', language)}
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

                                                                                                                                                                                                                                                                                                                                                               <ScrollView 
                style={[
                  styles.content,
                  {
                    paddingHorizontal: isSmallScreen ? 12 : 16,
                    paddingVertical: isSmallScreen ? 16 : 20,
                  }
                ]} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: isSmallScreen ? 30 : 40 }}
              >
             {/* Category Selection */}
             <View style={styles.section}>
               <Text style={[styles.sectionTitle, { color: colors.text }]}>
                 {getTranslation('reportCategory', language)}
               </Text>
                                                               <View style={[
                                  styles.categoryGrid,
                                  {
                                    gap: isSmallScreen ? 6 : 8,
                                    minHeight: isSmallScreen ? 250 : isLargeScreen ? 350 : 300,
                                  }
                                ]}>
                  {reportCategories.map((cat, index) => {
                    console.log(`Rendering category ${index + 1}: ${cat.key} - ${cat.label}`);
                    return (
                      <TouchableOpacity
                        key={cat.key}
                                                 style={[
                           styles.categoryButton,
                           { 
                             backgroundColor: category === cat.key ? colors.primary : colors.surfaceVariant,
                             borderColor: category === cat.key ? colors.primary : colors.border,
                             paddingHorizontal: isSmallScreen ? 8 : 12,
                             paddingVertical: isSmallScreen ? 12 : 16,
                             minHeight: isSmallScreen ? 60 : isLargeScreen ? 80 : 70,
                             borderRadius: isSmallScreen ? 8 : 10,
                           }
                         ]}
                        onPress={() => setCategory(cat.key)}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <View style={styles.categoryContent}>
                                                  <Ionicons 
                          name={cat.icon} 
                          size={22} 
                          color={category === cat.key ? colors.textInverse : colors.textSecondary} 
                          style={styles.categoryIcon}
                        />
                          <Text style={[
                            styles.categoryText,
                            { color: category === cat.key ? colors.textInverse : colors.text }
                          ]}>
                            {cat.label}
                          </Text>
                        </View>
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
               <TextInput
                 style={[
                   styles.descriptionInput,
                   { 
                     backgroundColor: colors.surfaceVariant,
                     color: colors.text,
                     borderColor: colors.border
                   }
                 ]}
                 value={description}
                 onChangeText={setDescription}
                 placeholder={getTranslation('reportDescription', language)}
                 placeholderTextColor={colors.placeholder}
                 multiline
                 numberOfLines={4}
                 textAlignVertical="top"
                 editable={!loading}
                 maxLength={500}
               />
               <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                 {description.length}/500
               </Text>
             </View>
           </ScrollView>

                     {/* Submit Button */}
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
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons name="send" size={18} color={colors.textInverse} style={styles.submitIcon} />
                  <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
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
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 300,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    width: '48%',
    minHeight: 70,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 140,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    marginRight: 4,
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
  },
});

export default ReportModal; 
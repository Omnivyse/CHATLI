import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const HelpCenterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [expandedItems, setExpandedItems] = useState({});

  const helpData = [
    {
      title: 'Getting Started',
      items: [
        {
          question: 'What is CHATLI?',
          answer: 'CHATLI is Mongolia\'s first chat app that provides you with reliable, fast messaging capabilities. You can chat with friends, share photos, videos, make voice calls, and much more.'
        }
      ]
    },
    {
      title: 'Chat and Messaging',
      items: [
        {
          question: 'How to start a chat?',
          answer: '1. Go to user profile\n2. Tap "Send Message" button\n3. Write your message\n4. Tap "Send" button'
        },
        {
          question: 'How to send photos/videos?',
          answer: '1. In chat page, tap "+" button\n2. Select "Photo" or "Video"\n3. Choose your file\n4. Tap "Send" button'
        },
        {
          question: 'How to delete a chat?',
          answer: 'Long press on chat in chat list and select "Delete" option. This will only delete it from your view.'
        }
      ]
    },
    {
      title: 'Profile and Settings',
      items: [
        {
          question: 'How to change profile picture?',
          answer: '1. Go to profile page\n2. Tap on profile picture\n3. Tap "Choose Photo" button\n4. Select new photo\n5. Tap "Save" button'
        },
        {
          question: 'How to enable dark mode?',
          answer: '1. Go to settings page\n2. Find "Dark Mode" section\n3. Enable the toggle'
        },
        {
          question: 'How to manage notifications?',
          answer: '1. Go to settings page\n2. Find "Notifications" section\n3. Choose desired settings\n4. Tap "Save" button'
        },
        {
          question: 'How to change password?',
          answer: '1. Go to settings page\n2. Find "Privacy and Security" section\n3. Tap "Change Password"\n4. Enter current and new password'
        }
      ]
    },
    {
      title: 'Troubleshooting',
      items: [
        {
          question: 'Photos/videos not downloading?',
          answer: '1. Check your internet connection\n2. Check phone storage space\n3. Check app permissions\n4. Check if "Auto Download" is enabled in settings'
        },
        {
          question: 'App not working properly?',
          answer: '1. Restart the app\n2. Check internet connection\n3. Update the app\n4. Clear app cache\n5. Reinstall the app'
        }
      ]
    },
    {
      title: 'Privacy and Security',
      items: [
        {
          question: 'Is my information secure?',
          answer: 'Yes, CHATLI values your privacy. We use end-to-end encryption to protect your messages.'
        },
        {
          question: 'How to block a user?',
          answer: '1. Go to user profile\n2. Tap "..." button\n3. Select "Block" option\n4. Tap "Block" button'
        }
      ]
    },
    {
      title: 'Account Management',
      items: [
        {
          question: 'How to delete account?',
          answer: '1. Go to settings page\n2. Find "Delete Account" section\n3. Enter your password\n4. Tap "Delete Account" button'
        }
      ]
    }
  ];

  const toggleItem = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderHelpItem = (item, sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    const isExpanded = expandedItems[key];

    return (
      <View key={itemIndex} style={styles.helpItem}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleItem(sectionIndex, itemIndex)}
        >
          <Text style={[styles.question, { color: colors.text }]}>
            {item.question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>
              {item.answer}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHelpSection = (section, sectionIndex) => {
    return (
      <View key={sectionIndex} style={styles.helpSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name={section.icon} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {section.title}
          </Text>
        </View>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {section.items.map((item, itemIndex) => 
            renderHelpItem(item, sectionIndex, itemIndex)
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Тусламж төв</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
          <View style={[styles.welcomeIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="help-circle" size={32} color="#ffffff" />
          </View>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Тусламж төвд тавтай морил
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            CHATLI-тай холбоотой асуултуудаа эндээс олж болно
          </Text>
        </View>

        {/* Help Sections */}
        {helpData.map((section, index) => renderHelpSection(section, index))}

        {/* Contact Section */}
        <View style={[styles.contactSection, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Нэмэлт тусламж хэрэгтэй юу?
            </Text>
          </View>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            Дээрх асуултуудаас хариулт олж чадаагүй бол бидэнтэй холбогдоно уу
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Alert.alert(
                'Холбогдох',
                'Санал хүсэлт, асуудлаа доорх хаягаар илгээнэ үү:\n\nomnivyse@gmail.com',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="mail" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>Имэйл илгээх</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HelpCenterScreen; 
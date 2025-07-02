import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const SettingsScreen = ({ navigation, user }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const settingsSections = [
    {
      title: 'Ерөнхий',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Мэдэгдэл',
          subtitle: 'Push мэдэгдэл авах',
          type: 'switch',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'moon-outline',
          title: 'Харанхуй горим',
          subtitle: 'Удахгүй нэмэгдэнэ',
          type: 'switch',
          value: darkMode,
          onToggle: setDarkMode,
          disabled: true,
        },
        {
          icon: 'volume-high-outline',
          title: 'Дуу чимээ',
          subtitle: 'Мессежийн дуу чимээ',
          type: 'switch',
          value: soundEnabled,
          onToggle: setSoundEnabled,
        },
      ],
    },
    {
      title: 'Мэдээлэл',
      items: [
        {
          icon: 'download-outline',
          title: 'Автомат татах',
          subtitle: 'Зураг, видео автомат татах',
          type: 'switch',
          value: autoDownload,
          onToggle: setAutoDownload,
        },
        {
          icon: 'cellular-outline',
          title: 'Мобайл дата',
          subtitle: 'Мобайл дата ашиглах тохиргоо',
          type: 'arrow',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Удахгүй',
              text2: 'Мобайл дата тохиргоо удахгүй нэмэгдэнэ',
            });
          },
        },
      ],
    },
    {
      title: 'Нууцлал ба аюулгүй байдал',
      items: [
        {
          icon: 'shield-outline',
          title: 'Хоёр алхамын нотолгоо',
          subtitle: 'Нэмэлт аюулгүй байдал',
          type: 'arrow',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Удахгүй',
              text2: 'Хоёр алхамын нотолгоо удахгүй нэмэгдэнэ',
            });
          },
        },
        {
          icon: 'lock-closed-outline',
          title: 'Нууц үг солих',
          subtitle: 'Нууц үгээ шинэчлэх',
          type: 'arrow',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Удахгүй',
              text2: 'Нууц үг солих боломж удахгүй нэмэгдэнэ',
            });
          },
        },
        {
          icon: 'eye-off-outline',
          title: 'Нууцлалын бодлого',
          subtitle: 'Нууцлалын дэлгэрэнгүй мэдээлэл',
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              'Нууцлалын бодлого',
              'CHATLI нь таны хувийн мэдээллийг хамгаалахыг эрхэмлэдэг. Бид таны мэдээллийг гуравдагч талд дамжуулдаггүй.',
              [{ text: 'OK' }]
            );
          },
        },
      ],
    },
    {
      title: 'Тусламж ба дэмжлэг',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Тусламж төв',
          subtitle: 'Асуулт хариулт',
          type: 'arrow',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Тусламж',
              text2: 'CHATLI тусламж төв удахгүй нээгдэнэ',
            });
          },
        },
        {
          icon: 'mail-outline',
          title: 'Холбогдох',
          subtitle: 'Санал хүсэлт, асуудлаа доорх хаягаар илгээнэ үү:\n\nsupport@chatli.mn',
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              'Холбогдох',
              'Санал хүсэлт, асуудлаа доорх хаягаар илгээнэ үү:\n\nsupport@chatli.mn',
              [{ text: 'OK' }]
            );
          },
        },
        {
          icon: 'information-circle-outline',
          title: 'Апп-ийн тухай',
          subtitle: 'Хувилбар, лиценз',
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              'CHATLI v1.0.0',
              'Монголын анхны чат апп\n\n© 2024 CHATLI\nБүх эрх хуулиар хамгаалагдсан.',
              [{ text: 'OK' }]
            );
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={[styles.settingItem, item.disabled && styles.settingItemDisabled]}
        onPress={item.onPress}
        disabled={item.disabled || item.type === 'switch'}
      >
        <View style={styles.settingIcon}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={item.disabled ? "#cccccc" : "#000000"} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[
            styles.settingTitle, 
            item.disabled && styles.settingTitleDisabled
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.settingSubtitle,
            item.disabled && styles.settingSubtitleDisabled
          ]}>
            {item.subtitle}
          </Text>
        </View>
        <View style={styles.settingAction}>
          {item.type === 'switch' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              disabled={item.disabled}
              trackColor={{ false: '#e5e5e5', true: '#000000' }}
              thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
            />
          ) : (
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={item.disabled ? "#cccccc" : "#cccccc"} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CHATLI v1.0.0</Text>
          <Text style={styles.footerText}>Монголын анхны чат апп</Text>
          <Text style={styles.footerText}>© 2024 CHATLI. Бүх эрх хуулиар хамгаалагдсан.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
    color: '#000000',
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: '#cccccc',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  settingSubtitleDisabled: {
    color: '#cccccc',
  },
  settingAction: {
    marginLeft: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default SettingsScreen; 
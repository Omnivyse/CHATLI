import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation, user, onLogout }) => {
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Гарах',
      'Гарахдаа итгэлтэй байна уу?',
      [
        { text: 'Цуцлах', style: 'cancel' },
        {
          text: 'Гарах',
          style: 'destructive',
          onPress: () => {
            Toast.show({
              type: 'success',
              text1: 'Амжилттай гарлаа',
              text2: 'Дахин уулзая!',
            });
            onLogout();
          },
        },
      ]
    );
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings', { user });
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Профайл засах',
      subtitle: 'Нэр, зураг, био засах',
      onPress: () => {
        Toast.show({
          type: 'info',
          text1: 'Удахгүй',
          text2: 'Профайл засах боломж удахгүй нэмэгдэнэ',
        });
      },
    },
    {
      icon: 'settings-outline',
      title: 'Тохиргоо',
      subtitle: 'Апп-ийн тохиргоо',
      onPress: navigateToSettings,
    },
    {
      icon: 'notifications-outline',
      title: 'Мэдэгдэл',
      subtitle: 'Мэдэгдлийн тохиргоо',
      onPress: () => {
        Toast.show({
          type: 'info',
          text1: 'Удахгүй',
          text2: 'Мэдэгдлийн тохиргоо удахгүй нэмэгдэнэ',
        });
      },
    },
    {
      icon: 'shield-outline',
      title: 'Нууцлал',
      subtitle: 'Нууцлалын тохиргоо',
      onPress: () => {
        Toast.show({
          type: 'info',
          text1: 'Удахгүй',
          text2: 'Нууцлалын тохиргоо удахгүй нэмэгдэнэ',
        });
      },
    },
    {
      icon: 'help-circle-outline',
      title: 'Тусламж',
      subtitle: 'Асуулт хариулт',
      onPress: () => {
        Toast.show({
          type: 'info',
          text1: 'Тусламж',
          text2: 'CHATLI - Монголын анхны чат апп',
        });
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666666" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userUsername}>@{user.username}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={24} color="#000000" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cccccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Гарах</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>CHATLI v1.0.0</Text>
          <Text style={styles.appInfoText}>Монголын анхны чат апп</Text>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#999999',
  },
  menuContainer: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  logoutContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ffffff',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  appInfoText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 2,
  },
});

export default ProfileScreen; 
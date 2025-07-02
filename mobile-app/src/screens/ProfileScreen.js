import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation, user, onLogout }) => {
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Гарах',
      'Та гарахдаа итгэлтэй байна уу?',
      [
        {
          text: 'Болих',
          style: 'cancel',
        },
        {
          text: 'Гарах',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            onLogout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Профайл засах',
      onPress: () => {
        // TODO: Navigate to edit profile
        Alert.alert('Анхааруулга', 'Энэ функц удахгүй бэлэн болно');
      },
    },
    {
      icon: 'settings-outline',
      title: 'Тохиргоо',
      onPress: () => {
        // TODO: Navigate to settings
        Alert.alert('Анхааруулга', 'Энэ функц удахгүй бэлэн болно');
      },
    },
    {
      icon: 'help-circle-outline',
      title: 'Тусламж',
      onPress: () => {
        Alert.alert('Тусламж', 'CHATLI - Монголын анхны нийгмийн сүлжээ');
      },
    },
    {
      icon: 'information-circle-outline',
      title: 'Аппын тухай',
      onPress: () => {
        Alert.alert('CHATLI', 'Хувилбар: 1.0.0\n\nМонголын анхны нийгмийн сүлжээ');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профайл</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userHandle}>@{user.username}</Text>
          
          {user.bio && (
            <Text style={styles.userBio}>{user.bio}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Дагаж байна</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Дагагч</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Пост</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color="#666" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>
              {loading ? 'Гарч байна...' : 'Гарах'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>CHATLI v1.0.0</Text>
          <Text style={styles.appInfoText}>Монголын анхны нийгмийн сүлжээ</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ProfileScreen; 
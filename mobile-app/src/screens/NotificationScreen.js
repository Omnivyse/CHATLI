import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import apiService from '../services/api';

const NotificationScreen = ({ navigation, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError('');
    
    try {
      const response = await apiService.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setError(response.message || 'Мэдэгдэл татахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      Toast.show({
        type: 'success',
        text1: 'Амжилттай',
        text2: 'Бүх мэдэгдэл уншсан болсон',
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Мэдэгдэл уншихад алдаа гарлаа',
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return 'chatbubble-outline';
      case 'like':
        return 'heart-outline';
      case 'comment':
        return 'chatbubble-ellipses-outline';
      case 'follow':
        return 'person-add-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({ item: notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(notification._id)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={getNotificationIcon(notification.type)} 
          size={20} 
          color={notification.read ? "#666666" : "#000000"} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !notification.read && styles.unreadText
        ]}>
          {notification.title || 'Мэдэгдэл'}
        </Text>
        <Text style={styles.notificationMessage}>
          {notification.message || 'Шинэ мэдэгдэл байна'}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(notification.createdAt).toLocaleDateString('mn-MN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#cccccc" />
      <Text style={styles.emptyTitle}>Мэдэгдэл байхгүй байна</Text>
      <Text style={styles.emptySubtitle}>
        Шинэ мэдэгдэл ирэхэд энд харагдана
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Алдаа гарлаа</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
        <Text style={styles.retryButtonText}>Дахин оролдох</Text>
      </TouchableOpacity>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Мэдэгдэл ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Мэдэгдэл {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {notifications.length > 0 && unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllButtonText}>Бүгдийг унших</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  unreadText: {
    color: '#000000',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    marginLeft: 8,
  },
});

export default NotificationScreen; 
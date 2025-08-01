import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import socketService from '../services/socket';
import FollowRequestNotification from '../components/FollowRequestNotification';

const NotificationScreen = ({ navigation, user }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
    
    // Listen for real-time notifications
    const handleNotification = (data) => {
      console.log('🔔 Real-time notification received:', data);
      
      // Validate notification data
      if (!data || !data._id) {
        console.warn('Invalid notification data received:', data);
        return;
      }
      
      setNotifications((prev) => {
        // Check for duplicates by ID first
        const notificationExistsById = prev.some(notification => 
          notification && notification._id && notification._id === data._id
        );
        if (notificationExistsById) {
          console.log('🔔 Notification already exists by ID, skipping duplicate');
          return prev;
        }
        
        // Check for duplicates by content (same type, same post, same from user)
        const notificationExistsByContent = prev.some(notification => 
          notification && 
          notification.type === data.type &&
          notification.post === data.post &&
          notification.from === data.from &&
          // Check if it's within the last 5 minutes to avoid blocking legitimate new notifications
          new Date(notification.createdAt).getTime() > new Date().getTime() - 5 * 60 * 1000
        );
        if (notificationExistsByContent) {
          console.log('🔔 Similar notification exists, skipping duplicate');
          return prev;
        }
        
        // Add new notification at the beginning
        const newNotifications = [data, ...prev];
        
        // Limit to prevent too many notifications
        if (newNotifications.length > 50) {
          return newNotifications.slice(0, 50);
        }
        
        return newNotifications;
      });
    };
    
    // Listen for notification updates (mark as read, etc.)
    const handleNotificationUpdate = (data) => {
      console.log('🔔 Real-time notification updated:', data);
      
      // Validate update data
      if (!data || !data.notificationId) {
        console.warn('Invalid notification update data:', data);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification && notification._id === data.notificationId 
            ? { ...notification, ...data.updates }
            : notification
        ).filter(notification => notification !== null)
      );
    };
    
    socketService.onNotification(handleNotification);
    socketService.on('notification_update', handleNotificationUpdate);
    
    return () => {
      socketService.offNotification(handleNotification);
      socketService.off('notification_update', handleNotificationUpdate);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setError('');
      const response = await api.getNotifications();
      if (response.success) {
        // Filter out invalid notifications and ensure unique IDs
        const validNotifications = (response.data.notifications || [])
          .filter(notification => notification && notification._id)
          .reduce((unique, notification) => {
            const exists = unique.find(n => n._id === notification._id);
            if (!exists) {
              unique.push(notification);
            }
            return unique;
          }, []);
        
        setNotifications(validNotifications);
      } else {
        setError('Мэдэгдэл ачаалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      setError('Мэдэгдэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    // Validate notification ID
    if (!notificationId || notificationId === 'undefined' || notificationId === undefined) {
      console.error('Invalid notification ID:', notificationId);
      return;
    }
    
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.markAllNotificationsRead();
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleAcceptFollowRequest = async (requesterId) => {
    try {
      const response = await api.acceptFollowRequest(requesterId);
      if (response.success) {
        // Remove the follow request notification
        setNotifications(prev => 
          prev.filter(notification => 
            !(notification.type === 'follow_request' && notification.from === requesterId)
          )
        );
      } else {
        Alert.alert('Алдаа', response.message || 'Хүсэлт зөвшөөрөхөд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Accept follow request error:', error);
      Alert.alert('Алдаа', 'Хүсэлт зөвшөөрөхөд алдаа гарлаа');
    }
  };

  const handleRejectFollowRequest = async (requesterId) => {
    try {
      const response = await api.rejectFollowRequest(requesterId);
      if (response.success) {
        // Remove the follow request notification
        setNotifications(prev => 
          prev.filter(notification => 
            !(notification.type === 'follow_request' && notification.from === requesterId)
          )
        );
      } else {
        Alert.alert('Алдаа', response.message || 'Хүсэлт цуцлахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Reject follow request error:', error);
      Alert.alert('Алдаа', 'Хүсэлт цуцлахад алдаа гарлаа');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'follow':
        return 'person-add';
      case 'follow_request':
        return 'person-add';
      case 'mention':
        return 'at';
      case 'event_invite':
        return 'calendar';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return '#ff4757';
      case 'comment':
        return '#2ed573';
      case 'follow':
        return '#3742fa';
      case 'follow_request':
        return '#ffa502';
      case 'mention':
        return '#ff6348';
      case 'event_invite':
        return '#5352ed';
      default:
        return '#747d8c';
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'одоо';
    } else if (diffInMinutes < 60) {
      return String(diffInMinutes) + 'м өмнө';
    } else if (diffInHours < 24) {
      return String(diffInHours) + 'ц өмнө';
    } else if (diffInDays === 1) {
      return 'өчигдөр';
    } else if (diffInDays < 7) {
      return String(diffInDays) + ' өдөр өмнө';
    } else {
      return date.toLocaleDateString('mn-MN');
    }
  };

  const renderNotification = ({ item: notification, index }) => {
    // Validate notification data
    if (!notification || !notification._id) {
      console.warn('Invalid notification data:', notification);
      return null;
    }

    // Handle follow request notifications
    if (notification.type === 'follow_request' && notification.from) {
      return (
        <FollowRequestNotification
          requester={notification.from}
          onAccept={() => handleAcceptFollowRequest(notification.from._id)}
          onReject={() => handleRejectFollowRequest(notification.from._id)}
          onPress={() => handleMarkAsRead(notification._id)}
        />
      );
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
          !notification.isRead && { backgroundColor: colors.surfaceVariant }
        ]}
        onPress={() => handleMarkAsRead(notification._id)}
      >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={20}
          color={getNotificationColor(notification.type)}
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {notification.title || 'Шинэ мэдэгдэл'}
        </Text>
        {notification.message && (
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
            {notification.message}
          </Text>
        )}
        <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
          {formatNotificationTime(notification.createdAt)}
        </Text>
      </View>

      {!notification.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Мэдэгдэл</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingSpinner, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Мэдэгдэл</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary }]}
            onPress={handleMarkAllAsRead}
          >
            <Text style={[styles.markAllText, { color: colors.textInverse }]}>Бүгдийг унших</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
          {error && typeof error === 'string' ? error : 'Алдаа гарлаа'}
        </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadNotifications}
          >
            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Мэдэгдэл байхгүй</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Шинэ мэдэгдэл ирэхэд энд харагдана
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications.filter(notification => notification && notification._id)}
          renderItem={renderNotification}
          keyExtractor={(item, index) => item._id || `notification-${index}`}
          style={styles.notificationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007aff',
    marginLeft: 8,
  },
});

export default NotificationScreen; 
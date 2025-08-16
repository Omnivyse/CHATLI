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
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import socketService from '../services/socket';
import FollowRequestNotification from '../components/FollowRequestNotification';

const NotificationScreen = ({ navigation, user }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

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
      setLoading(true);
      setError('');
      
      console.log('🔔 Starting to load notifications...');
      const response = await api.getNotifications();
      console.log('🔔 Notifications response:', response);
      
      if (response.success && response.data.notifications) {
        console.log('🔔 Loaded notifications count:', response.data.notifications.length);
        console.log('🔔 First notification:', response.data.notifications[0]);
        
        // Validate notifications before setting
        const validNotifications = response.data.notifications.filter(notification => {
          if (!notification || !notification._id) {
            console.warn('Invalid notification found:', notification);
            return false;
          }
          return true;
        });
        
        console.log('🔔 Valid notifications count:', validNotifications.length);
        setNotifications(validNotifications);
      } else {
        console.log('🔔 No notifications or error:', response);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
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

  const handleNotificationPress = async (notification) => {
    // Mark notification as read first
    await handleMarkAsRead(notification._id);
    
    // Handle different notification types
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.post) {
          // Show post in modal instead of navigating
          console.log('Notification post data:', notification.post);
          console.log('Showing post in modal');
          
          // Get the post data - either from notification.post object or fetch it
          let postData = notification.post;
          if (typeof notification.post === 'string') {
            // If it's just an ID, we need to fetch the post data
            try {
              const response = await api.getComments(notification.post);
              if (response.success && (response.data.post || response.data)) {
                postData = response.data.post || response.data;
              }
            } catch (error) {
              console.error('Failed to fetch post data:', error);
              Alert.alert('Error', 'Failed to load post');
              return;
            }
          }
          
          setSelectedPost(postData);
          setPostModalVisible(true);
        }
        break;
      case 'follow':
        if (notification.from && notification.from.length > 0) {
          // Navigate to user profile
          navigation.navigate('Profile', { 
            userId: notification.from[0]._id 
          });
        }
        break;
      case 'follow_request':
        // Follow request notifications are handled separately
        break;
      case 'event_invite':
        if (notification.event) {
          // Event details screen not available yet
          Alert.alert(
            'Event Details',
            'Event details feature is coming soon!',
            [{ text: 'OK' }]
          );
        }
        break;
      default:
        // For other notification types, just mark as read
        break;
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
            !(notification.type === 'follow_request' && 
              notification.from && 
              notification.from.length > 0 && 
              notification.from[0]._id === requesterId)
          )
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to accept follow request');
      }
    } catch (error) {
      console.error('Accept follow request error:', error);
      Alert.alert('Error', 'Failed to accept follow request');
    }
  };

  const handleRejectFollowRequest = async (requesterId) => {
    try {
      const response = await api.rejectFollowRequest(requesterId);
      if (response.success) {
        // Remove the follow request notification
        setNotifications(prev => 
          prev.filter(notification => 
            !(notification.type === 'follow_request' && 
              notification.from && 
              notification.from.length > 0 && 
              notification.from[0]._id === requesterId)
          )
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to reject follow request');
      }
    } catch (error) {
      console.error('Reject follow request error:', error);
      Alert.alert('Error', 'Failed to reject follow request');
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
      return 'now';
    } else if (diffInMinutes < 60) {
      return String(diffInMinutes) + 'm ago';
    } else if (diffInHours < 24) {
      return String(diffInHours) + 'h ago';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return String(diffInDays) + ' days ago';
    } else {
      return date.toLocaleDateString('en-US');
    }
  };

  const renderNotification = ({ item: notification, index }) => {
    // Validate notification data
    if (!notification || !notification._id) {
      console.warn('Invalid notification data:', notification);
      return null;
    }

    // Handle follow request notifications
    if (notification.type === 'follow_request' && notification.from && notification.from.length > 0) {
      const requester = notification.from[0]; // Get the first user from the array
      return (
        <FollowRequestNotification
          requester={requester}
          onAccept={() => handleAcceptFollowRequest(requester._id)}
          onReject={() => handleRejectFollowRequest(requester._id)}
          onPress={() => handleNotificationPress(notification)}
        />
      );
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !notification.isRead && { 
            backgroundColor: colors.surfaceVariant,
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.notificationIcon,
          { backgroundColor: !notification.isRead ? colors.surfaceVariant : colors.surface }
        ]}>
          <Ionicons
            name={getNotificationIcon(notification.type)}
            size={22}
            color={getNotificationColor(notification.type)}
          />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle, 
            { color: colors.text },
            !notification.isRead && { fontWeight: '800' }
          ]}>
            {notification.title || 'New notification'}
          </Text>
          {notification.message && (
            <Text style={[
              styles.notificationMessage, 
              { color: colors.textSecondary },
              !notification.isRead && { fontWeight: '500' }
            ]}>
              {notification.message}
            </Text>
          )}
          <Text style={[
            styles.notificationTime, 
            { color: colors.textTertiary },
            !notification.isRead && { fontWeight: '600' }
          ]}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
        </View>

        {!notification.isRead && (
          <View style={[
            styles.unreadDot, 
            { backgroundColor: colors.primary }
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
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
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {getTranslation('notifications', language) || 'Notifications'}
          </Text>
          {notifications.some(n => !n.isRead) && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.unreadBadgeText, { color: colors.textInverse }]}>
                {notifications.filter(n => !n.isRead).length}
              </Text>
            </View>
          )}
        </View>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary }]}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.8}
          >
            <Text style={[styles.markAllText, { color: colors.textInverse }]}>
              {getTranslation('markAllAsRead', language) || 'Mark all as read'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
          {error && typeof error === 'string' ? error : 'Error occurred'}
        </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadNotifications}
          >
            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            New notifications will appear here
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

      {/* Post Modal */}
      <Modal
        visible={postModalVisible}
        transparent={true}
        animationType="slide"
                 onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedPost?.author?.name || 'Post'}
              </Text>
                             <TouchableOpacity
                 style={styles.modalCloseButton}
                 onPress={() => setPostModalVisible(false)}
               >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Post Content */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedPost && (
                <View style={styles.postContent}>
                  {/* Post Text */}
                  {selectedPost.content && (
                    <Text style={[styles.postText, { color: colors.text }]}>
                      {selectedPost.content}
                    </Text>
                  )}

                  {/* Post Media */}
                  {selectedPost.media && selectedPost.media.length > 0 && (
                    <View style={styles.mediaContainer}>
                      {selectedPost.media.map((media, index) => (
                        <View key={index} style={styles.mediaItem}>
                          {media.type === 'image' && (
                            <Image
                              source={{ uri: media.url }}
                              style={styles.mediaImage}
                              resizeMode="cover"
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                                     {/* Post Stats */}
                   <View style={styles.postStats}>
                     <View style={styles.statItem}>
                       <Ionicons name="heart" size={16} color={colors.primary} />
                       <Text style={[styles.statText, { color: colors.textSecondary }]}>
                         {selectedPost.likes?.length || 0}
                       </Text>
                     </View>
                     <View style={styles.statItem}>
                       <Ionicons name="chatbubble" size={16} color={colors.primary} />
                       <Text style={[styles.statText, { color: colors.textSecondary }]}>
                         {selectedPost.comments?.length || 0}
                       </Text>
                     </View>
                   </View>

                   

                   {/* Comments List */}
                   {selectedPost.comments && selectedPost.comments.length > 0 && (
                     <View style={styles.commentsSection}>
                       <Text style={[styles.commentsTitle, { color: colors.text }]}>
                         Comments ({selectedPost.comments.length})
                       </Text>
                       {selectedPost.comments.map((comment, index) => (
                         <View key={index} style={styles.commentItem}>
                           <Text style={[styles.commentAuthor, { color: colors.primary }]}>
                             {comment.author?.name || 'Unknown'}
                           </Text>
                           <Text style={[styles.commentText, { color: colors.text }]}>
                             {comment.content}
                           </Text>
                           <Text style={[styles.commentTime, { color: colors.textTertiary }]}>
                             {formatNotificationTime(comment.createdAt)}
                           </Text>
                         </View>
                       ))}
                     </View>
                   )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginVertical: 4,
    borderRadius: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: '400',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007aff',
    marginLeft: 12,
    shadowColor: '#007aff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  postContent: {
    padding: 20,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaItem: {
    marginBottom: 8,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },

  commentsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentTime: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default NotificationScreen; 
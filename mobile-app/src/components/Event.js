import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import EventChat from './EventChat';

const Event = ({ event, user, onJoinEvent, onLeaveEvent, onLikeEvent, onCommentEvent, onDeleteEvent, onKickEventUser, navigation }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [showChat, setShowChat] = useState(false);
  const [showJoinedUsers, setShowJoinedUsers] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Check if current user is the event creator
  const isEventCreator = event.author?._id === user?._id || event.author === user?._id;
  
  // Debug logging
  console.log('🔍 Kick Button Debug:');
  console.log('Event author ID:', event.author?._id);
  console.log('Current user ID:', user?._id);
  console.log('Is event creator:', isEventCreator);
  console.log('Event author:', event.author);
  console.log('Current user:', user);

  // Check if user is already joined when component loads
  useEffect(() => {
    if (event.joinedUsers && user) {
      const isUserJoined = event.joinedUsers.some(joinedUser => 
        joinedUser._id === user._id || joinedUser === user._id
      );
      setIsJoined(isUserJoined);
    }
  }, [event.joinedUsers, user]);

  // Check if user has already liked when component loads
  useEffect(() => {
    if (event.likes && user) {
      const isUserLiked = event.likes.some(likedUser => 
        likedUser._id === user._id || likedUser === user._id
      );
      setIsLiked(isUserLiked);
    }
  }, [event.likes, user]);

  const handleJoinEvent = async () => {
    // Prevent joining if already joined
    if (isJoined) {
      Alert.alert('Info', 'You have already joined this event');
      return;
    }

    // Show password modal for private events
    if (event.isPrivate) {
      setShowPasswordModal(true);
      return;
    }

    try {
      await onJoinEvent(event._id);
      setIsJoined(true);
    } catch (error) {
      // Don't show error if user is already joined (this is expected)
      if (error.message && error.message.includes('аль хэдийн нэгдсэн')) {
        setIsJoined(true);
        Alert.alert('Мэдээлэл', 'Та энэ event-д аль хэдийн нэгдсэн байна');
      } else {
        Alert.alert('Error', 'Failed to join event');
      }
    }
  };

  const handleJoinWithPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Алдаа', 'Нууц үгийг оруулна уу');
      return;
    }

    if (password.length !== 4) {
      Alert.alert('Алдаа', 'Password must be 4 digits');
      return;
    }

    try {
      await onJoinEvent(event._id, password);
      setIsJoined(true);
      setShowPasswordModal(false);
      setPassword('');
    } catch (error) {
      if (error.message && error.message.includes('Нууц үг буруу')) {
        Alert.alert('Алдаа', 'Нууц үг буруу байна');
      } else if (error.message && error.message.includes('аль хэдийн нэгдсэн')) {
        setIsJoined(true);
        setShowPasswordModal(false);
        setPassword('');
        Alert.alert('Мэдээлэл', 'Та энэ event-д аль хэдийн нэгдсэн байна');
      } else {
        Alert.alert('Алдаа', 'Wrong password');
      }
    }
  };

  const handleLeaveEvent = async () => {
    if (!isJoined) {
      Alert.alert('Мэдээлэл', 'Та энэ event-д аль хэдийн нэгдсэн байна');
      return;
    }

    try {
      await onLeaveEvent(event._id);
      setIsJoined(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to leave event');
    }
  };

  const handleKickUser = async (userId, userName) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${userName} from this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => handleKickUser(userId, userName) }
      ]
    );
  };

  const handleLikeEvent = async () => {
    try {
      await onLikeEvent(event._id);
      setIsLiked(!isLiked);
    } catch (error) {
      Alert.alert('Error', 'Failed to like event');
    }
  };

  const handleDeleteEvent = async () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteEvent(event._id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  const handleUserPress = (userId, userName) => {
    if (navigation && userId && user?._id && userId !== user._id) {
      navigation.navigate('UserProfile', { userId, userName });
    }
  };

  const renderJoinedUser = ({ item }) => (
    <TouchableOpacity 
      style={[styles.joinedUserItem, { borderBottomColor: colors.border }]}
      onPress={() => handleUserPress(item._id, item.name)}
      activeOpacity={0.7}
    >
      <View style={styles.joinedUserContent}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.joinedUserAvatar} />
        ) : (
          <View style={[styles.joinedUserAvatar, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
            <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
          </View>
        )}
        <View style={styles.joinedUserInfo}>
          <Text style={[styles.joinedUserName, { color: colors.text }]}>
            {item.name || 'User'}
          </Text>
          <Text style={[styles.joinedUserDate, { color: colors.textSecondary }]}>
            {new Date(item.joinedAt || Date.now()).toLocaleDateString('mn-MN')}
          </Text>
        </View>
      </View>
      {isEventCreator && (
        <TouchableOpacity
          style={[styles.kickButton, { backgroundColor: '#ff4757' }]}
          onPress={() => handleKickUser(item._id, item.name)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
      {!isEventCreator && console.log('❌ Kick button not shown - not event creator')}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Event Image */}
      <Image source={{ uri: event.image }} style={styles.eventImage} />
      
      {/* Event Creator Info */}
      <View style={styles.creatorContainer}>
        <View style={styles.creatorInfo}>
          {event.author?.avatar ? (
            <Image source={{ uri: event.author.avatar }} style={styles.creatorAvatar} />
          ) : (
            <View style={[styles.creatorAvatar, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
              <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
            </View>
          )}
          <View style={styles.creatorDetails}>
            <View style={styles.creatorNameContainer}>
              <Text style={[styles.creatorName, { color: colors.text }]}>
                {event.author?.name || 'Unknown User'}
              </Text>
              {event.author?.isVerified && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={14} 
                  color={colors.primary} 
                  style={styles.creatorVerifiedIcon}
                />
              )}
            </View>
            <Text style={[styles.creatorLabel, { color: colors.textSecondary }]}>
              Event creator
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => navigation.navigate('UserProfile', { userId: event.author?._id })}
        >
          <Text style={[styles.viewProfileText, { color: colors.primary }]}>
            View Profile
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Event Info */}
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: colors.text }]}>
            {event.name}
          </Text>
          {event.isPrivate && (
            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
          )}
        </View>
        <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>
          {event.description}
        </Text>
        
        {/* Event Stats */}
        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {event.joinedUsers?.length || 0}/{event.userNumber} people
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={isLiked ? '#ff4757' : colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {event.likes?.length || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {event.comments?.length || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Delete button for event creator */}
        {isEventCreator && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: '#ff4757' }]}
            onPress={handleDeleteEvent}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.joinButton,
            { 
              backgroundColor: isJoined ? '#ff4757' : '#000000',
              borderColor: isJoined ? '#ff4757' : '#000000'
            }
          ]}
          onPress={isJoined ? handleLeaveEvent : handleJoinEvent}
        >
          <Text style={[styles.joinButtonText, { color: '#ffffff' }]}>
            {isJoined ? 'Leave' : 'Join'}
          </Text>
        </TouchableOpacity>

        {isJoined && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={handleLikeEvent}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? '#ff4757' : colors.text} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={() => setShowChat(true)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={() => setShowJoinedUsers(true)}
            >
              <Ionicons name="people-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Event Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowChat(false)}
      >
        <EventChat 
          event={event}
          user={user}
          onClose={() => setShowChat(false)}
        />
      </Modal>

      {/* Joined Users Modal */}
      <Modal
        visible={showJoinedUsers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinedUsers(false)}
        style={{ zIndex: 9999 }}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: colors.background, zIndex: 9999, elevation: 9999 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowJoinedUsers(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Нэгдсэн хүмүүс ({event.joinedUsers?.length || 0})
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Joined Users List */}
          <FlatList
            data={event.joinedUsers || []}
            renderItem={renderJoinedUser}
            keyExtractor={(item, index) => `user-${item._id || index}`}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Одоогоор хэн ч нэгдээгүй байна
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
        style={{ zIndex: 9999 }}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: colors.background, zIndex: 9999, elevation: 9999 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Enter password to join this event
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Password Input */}
          <View style={styles.passwordContainer}>
            <Text style={[styles.passwordTitle, { color: colors.text }]}>
              Private Event
            </Text>
            <Text style={[styles.passwordSubtitle, { color: colors.textSecondary }]}>
              Please enter the password to join this event
            </Text>
            
            <TextInput
              style={[styles.passwordInput, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={password}
              onChangeText={setPassword}
              placeholder="0000"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={false}
              autoFocus={true}
            />
            
            <TouchableOpacity
              style={[styles.joinButton, { 
                backgroundColor: '#000000',
                borderColor: '#000000',
                marginTop: 24
              }]}
              onPress={handleJoinWithPassword}
            >
              <Text style={[styles.joinButtonText, { color: '#ffffff' }]}>
                Join
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  creatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  creatorDetails: {
    flex: 1,
    minWidth: 0,
  },
  creatorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  creatorVerifiedIcon: {
    marginLeft: 2,
  },
  creatorLabel: {
    fontSize: 12,
  },
  viewProfileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventInfo: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  joinButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  modalContainer: {
    flex: 1,
    zIndex: 9999,
    elevation: 9999,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  joinedUserItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  joinedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  joinedUserInfo: {
    flex: 1,
  },
  joinedUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinedUserDate: {
    fontSize: 12,
  },
  kickButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  passwordContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  passwordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  passwordSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
});

export default Event; 
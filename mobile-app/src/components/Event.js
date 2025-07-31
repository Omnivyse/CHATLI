import React, { useState } from 'react';
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

const Event = ({ event, user, onJoinEvent, onLikeEvent, onCommentEvent }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [showComments, setShowComments] = useState(false);
  const [showJoinedUsers, setShowJoinedUsers] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleJoinEvent = async () => {
    try {
      await onJoinEvent(event._id);
      setIsJoined(true);
      Alert.alert('Амжилттай', 'Event-д нэгдлээ!');
    } catch (error) {
      Alert.alert('Алдаа', 'Event-д нэгдэхэд алдаа гарлаа');
    }
  };

  const handleLikeEvent = async () => {
    if (!isJoined) {
      Alert.alert('Мэдээлэл', 'Event-д нэгдсний дараа лайк хийх боломжтой');
      return;
    }

    try {
      await onLikeEvent(event._id);
      setIsLiked(!isLiked);
    } catch (error) {
      Alert.alert('Алдаа', 'Лайк хийхэд алдаа гарлаа');
    }
  };

  const handleComment = async () => {
    if (!isJoined) {
      Alert.alert('Мэдээлэл', 'Event-д нэгдсний дараа сэтгэгдэл бичих боломжтой');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Алдаа', 'Сэтгэгдэл бичнэ үү');
      return;
    }

    try {
      await onCommentEvent(event._id, commentText.trim());
      setCommentText('');
      setShowComments(false);
      Alert.alert('Амжилттай', 'Сэтгэгдэл нэмэгдлээ!');
    } catch (error) {
      Alert.alert('Алдаа', 'Сэтгэгдэл бичихэд алдаа гарлаа');
    }
  };

  const renderComment = ({ item }) => (
    <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.commentAuthor, { color: colors.text }]}>
          {item.author?.name || 'Хэрэглэгч'}
        </Text>
        <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString('mn-MN')}
        </Text>
      </View>
      <Text style={[styles.commentText, { color: colors.text }]}>
        {item.content}
      </Text>
    </View>
  );

  const renderJoinedUser = ({ item }) => (
    <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.commentAuthor, { color: colors.text }]}>
          {item.name || 'Хэрэглэгч'}
        </Text>
        <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
          {new Date(item.joinedAt).toLocaleDateString('mn-MN')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Event Image */}
      <Image source={{ uri: event.image }} style={styles.eventImage} />
      
      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={[styles.eventName, { color: colors.text }]}>
          {event.name}
        </Text>
        <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>
          {event.description}
        </Text>
        
        {/* Event Stats */}
        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {event.joinedUsers?.length || 0}/{event.userNumber} хүн
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
        <TouchableOpacity
          style={[
            styles.joinButton,
            { 
              backgroundColor: isJoined ? colors.success : '#000000',
              borderColor: isJoined ? colors.success : '#000000'
            }
          ]}
          onPress={handleJoinEvent}
          disabled={isJoined}
        >
          <Text style={[styles.joinButtonText, { color: '#ffffff' }]}>
            {isJoined ? 'Нэгдсэн' : 'Нэгдэх'}
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
              onPress={() => setShowComments(true)}
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

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Сэтгэгдэл ({event.comments?.length || 0})
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Comment Input at Top */}
          <View style={[styles.commentInput, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Сэтгэгдэл бичнэ үү..."
              placeholderTextColor={colors.placeholder}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: '#000000' }]}
              onPress={handleComment}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={event.comments || []}
            renderItem={renderComment}
            keyExtractor={(item, index) => `comment-${item._id || index}`}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* Joined Users Modal */}
      <Modal
        visible={showJoinedUsers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinedUsers(false)}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
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
  eventInfo: {
    padding: 16,
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
  modalContainer: {
    flex: 1,
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
});

export default Event; 
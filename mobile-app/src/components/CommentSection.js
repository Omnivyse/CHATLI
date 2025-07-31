import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import api from '../services/api';
import socketService from '../services/socket';

const CommentSection = ({ post, user, onClose, onCommentAdded }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadComments();
    
    // Join post room for real-time updates
    socketService.joinPostRoom(post._id);
    
    // Listen for real-time comment additions
    const handleCommentAdded = (data) => {
      console.log('💬 Real-time comment added:', data);
      if (data.postId === post._id) {
        setComments(prevComments => {
          // Check if comment already exists to avoid duplicates
          const commentExists = prevComments.some(comment => comment._id === data.comment._id);
          if (commentExists) {
            return prevComments;
          }
          return [data.comment, ...prevComments];
        });
        
        // Notify parent component
        if (onCommentAdded) {
          setComments(prevComments => {
            const updatedComments = [data.comment, ...prevComments];
            onCommentAdded(updatedComments);
            return updatedComments;
          });
        }
      }
    };
    
    // Listen for real-time post updates (likes, etc.)
    const handlePostUpdated = (data) => {
      console.log('📝 Real-time post updated:', data);
      if (data.postId === post._id) {
        // Update post data if needed
        if (onCommentAdded) {
          // This will trigger parent component update
          onCommentAdded(comments);
        }
      }
    };
    
    socketService.onCommentAdded(handleCommentAdded);
    socketService.onPostUpdated(handlePostUpdated);
    
    return () => {
      // Cleanup socket listeners
      socketService.offCommentAdded(handleCommentAdded);
      socketService.offPostUpdated(handlePostUpdated);
      socketService.leavePostRoom(post._id);
    };
  }, [post._id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await api.getComments(post._id);
      if (response.success) {
        setComments(response.data.post.comments || []);
      } else {
        Alert.alert('Алдаа', 'Сэтгэгдлүүдийг ачаалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load comments error:', error);
      Alert.alert('Алдаа', 'Сэтгэгдлүүдийг ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComments();
    setRefreshing(false);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.addComment(post._id, commentText.trim());
      if (response.success) {
        setComments(response.data.comments || []);
        setCommentText('');
        
        // Emit socket event for real-time updates
        socketService.commentPost(
          post._id, 
          user._id, 
          post.author._id, 
          commentText.trim()
        );
        
        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded(response.data.comments || []);
        }
        
        // Scroll to bottom to show new comment
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Алдаа', 'Сэтгэгдэл нэмэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      Alert.alert('Алдаа', 'Сэтгэгдэл нэмэхэд алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      if (!dateString) return '0с';
      const now = new Date();
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '0с';
      
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return String(diffInSeconds) + 'с';
      if (diffInSeconds < 3600) return String(Math.floor(diffInSeconds / 60)) + 'м';
      if (diffInSeconds < 86400) return String(Math.floor(diffInSeconds / 3600)) + 'ц';
      return String(Math.floor(diffInSeconds / 86400)) + 'ө';
    } catch (error) {
      return '0с';
    }
  };

  const renderComment = ({ item }) => (
    <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
      {item.author?.avatar ? (
        <Image
          source={{ uri: item.author.avatar }}
          style={styles.commentAvatar}
        />
      ) : (
        <View style={[styles.commentAvatar, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
          <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: colors.text }]}>
            {item.author?.name && typeof item.author.name === 'string' ? item.author.name : 'Unknown User'}
          </Text>
          <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {item.content && typeof item.content === 'string' ? item.content : 'Comment content unavailable'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Сэтгэгдэл байхгүй
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
        Эхний сэтгэгдлээ үлдээгээрэй
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 50}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Сэтгэгдэл ({Array.isArray(comments) ? comments.length : 0})
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        <View style={styles.commentsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={scrollViewRef}
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item, index) => `comment-${item._id || index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={comments.length === 0 ? styles.emptyListContainer : styles.listContainer}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {/* Comment Input */}
        <View style={[
          styles.inputContainer, 
          { 
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }
        ]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { 
                color: colors.text,
              }]}
              placeholder="Сэтгэгдэл бичих..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={submitComment}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: commentText.trim() ? colors.primary : colors.textTertiary }
              ]}
              onPress={submitComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  commentsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 80,
    marginRight: 8,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentSection; 
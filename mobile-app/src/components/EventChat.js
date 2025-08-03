import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import apiService from '../services/api';

const EventChat = ({ event, user, onClose }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const flatListRef = useRef(null);

  // Check if user has joined the event
  const isJoined = event.joinedUsers?.some(joinedUser => 
    joinedUser._id === user?._id || joinedUser === user?._id
  );

  useEffect(() => {
    if (isJoined) {
      loadMessages();
      markAsRead();
    }
  }, [event._id, isJoined]);

  const loadMessages = async (pageNum = 1, refresh = false) => {
    if (!isJoined) return;

    try {
      setLoading(true);
      const response = await apiService.getEventChatMessages(event._id, pageNum);
      
      if (response.success) {
        if (refresh) {
          setMessages(response.data.messages);
        } else {
          setMessages(prev => [...prev, ...response.data.messages]);
        }
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading event chat messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async () => {
    try {
      await apiService.markEventChatAsRead(event._id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await apiService.sendEventChatMessage(event._id, newMessage.trim());
      
      if (response.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender._id === user?._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <View style={styles.messageHeader}>
            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
              {item.sender.name || item.sender.username}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage 
            ? [styles.ownBubble, { backgroundColor: colors.primary }]
            : [styles.otherBubble, { backgroundColor: colors.surfaceVariant }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#ffffff' : colors.text }
          ]}>
            {item.content.text}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
        Start the conversation!
      </Text>
    </View>
  );

  if (!isJoined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {event.name} Chat
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notJoinedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
          <Text style={[styles.notJoinedText, { color: colors.text }]}>
            Join the event to access the chat
          </Text>
          <Text style={[styles.notJoinedSubtext, { color: colors.textSecondary }]}>
            Only event participants can send messages
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {event.name} Chat
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={loading && page > 1 ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
        ) : null}
        inverted={false}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: newMessage.trim() ? colors.primary : colors.surfaceVariant }
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? '#ffffff' : colors.textSecondary} 
            />
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  notJoinedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notJoinedText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  notJoinedSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '80%',
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingIndicator: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EventChat; 
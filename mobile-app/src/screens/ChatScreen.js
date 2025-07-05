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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import socketService from '../services/socket';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const ChatScreen = ({ navigation, route, user }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { chatId, chatTitle } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Join chat room
    socketService.joinChat(chatId);
    
    // Listen for new messages
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleTypingStatus);
    
    return () => {
      // Clean up
      socketService.leaveChat(chatId);
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleTypingStatus);
      
      // Stop typing when leaving
      if (typing) {
        socketService.stopTyping(chatId);
      }
    };
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.getMessages(chatId);
      if (response.success) {
        setMessages(response.data.messages); // Show messages in correct order (latest at bottom)
        
        // Mark messages as read
        await api.markChatAsRead(chatId);
      } else {
        Alert.alert('Алдаа', 'Мессежүүдийг ачаалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load messages error:', error);
      Alert.alert('Алдаа', 'Мессежүүдийг ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.chatId === chatId) {
      setMessages(prev => [...prev, data.message]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTypingStatus = (data) => {
    if (data.chatId === chatId && data.userId !== user._id) {
      if (data.isTyping) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    if (typing) {
      socketService.stopTyping(chatId);
      setTyping(false);
    }

    try {
      const response = await api.sendMessage(chatId, {
        type: 'text',
        content: { text: messageText }
      });

      if (response.success) {
        const message = response.data.message;
        setMessages(prev => [...prev, message]);
        
        // Emit message to other users
        socketService.sendMessage(chatId, message);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Алдаа', 'Мессеж илгээхэд алдаа гарлаа');
        setNewMessage(messageText); // Restore message
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Алдаа', 'Мессеж илгээхэд алдаа гарлаа');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text) => {
    setNewMessage(text);
    
    // Handle typing indicators
    if (text.length > 0 && !typing) {
      setTyping(true);
      socketService.startTyping(chatId);
    } else if (text.length === 0 && typing) {
      setTyping(false);
      socketService.stopTyping(chatId);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('mn-MN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderMessage = ({ item: message }) => {
    const isMyMessage = message.sender._id === user._id;
    const messageTime = formatMessageTime(message.createdAt);

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <Image
            source={{ 
              uri: message.sender.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }}
            style={[styles.senderAvatar, { backgroundColor: colors.surfaceVariant }]}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surfaceVariant }
        ]}>
          {!isMyMessage && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('UserProfile', {
                  userId: message.sender._id,
                  userName: message.sender.name
                });
              }}
            >
              <Text style={[styles.senderName, { color: colors.textSecondary }]}>{message.sender.name}</Text>
            </TouchableOpacity>
          )}
          
          <Text style={[
            styles.messageText,
            isMyMessage
              ? { color: colors.textInverse }
              : { color: colors.text }
          ]}>
            {message.content.text}
          </Text>
          
          <Text style={[
            styles.messageTime,
            isMyMessage
              ? { color: 'rgba(255,255,255,0.7)' }
              : { color: colors.textTertiary }
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
          <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
          <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
        </View>
        <Text style={[styles.typingText, { color: colors.textSecondary }]}>бичиж байна...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] }>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }] }>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => {
            if (route.params?.onGoBack) route.params.onGoBack();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <TouchableOpacity
            onPress={async () => {
              try {
                const chat = await api.getChat(chatId);
                if (chat.success && chat.data.chat.type === 'direct') {
                  const otherUser = chat.data.chat.participants.find(p => p._id !== user._id);
                  if (otherUser) {
                    navigation.navigate('UserProfile', {
                      userId: otherUser._id,
                      userName: otherUser.name
                    });
                  }
                } else if (chat.success && chat.data.chat.type === 'group') {
                  // Optionally navigate to group info screen here
                  // navigation.navigate('GroupInfo', { chatId });
                }
              } catch (e) {
                // Optionally handle error
              }
            }}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {chatTitle}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Онлайн</Text>
        </View>
        
        <TouchableOpacity style={[styles.headerAction, { backgroundColor: colors.surfaceVariant }] }>
          <Ionicons name="call" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingSpinner, { backgroundColor: colors.surface }] }>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={[...messages].reverse()}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              style={styles.messagesList}
              contentContainerStyle={[styles.messagesContainer]}
              showsVerticalScrollIndicator={false}
              inverted={true}
            />
            {renderTypingIndicator()}
          </>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }] }>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant }] }>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Мессеж бичих..."
              placeholderTextColor={colors.placeholder}
              value={newMessage}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
              editable={!sending}
              keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: (!newMessage.trim() || sending) ? colors.disabled : colors.primary },
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Ionicons name="send" size={20} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    padding: 20,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
  },
  otherMessageText: {
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    textAlign: 'right',
  },
  otherMessageTime: {
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    maxHeight: 100,
    marginRight: 8,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
  },
});

export default ChatScreen; 
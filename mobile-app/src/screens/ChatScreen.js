import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Clipboard,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons, Feather } from '@expo/vector-icons';
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
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lastTap, setLastTap] = useState(null);
  const [reactionAnimations, setReactionAnimations] = useState({});

  useEffect(() => {
    loadMessages();
    
    // Ensure socket is connected and authenticated before joining chat
    const setupSocket = async () => {
      console.log('🔌 Setting up socket for chat:', chatId);
      console.log('👤 Current user:', user._id);
      
      // Check if socket is ready
      if (!socketService.isReady()) {
        console.log('⚠️ Socket not ready, attempting to connect...');
        // Try to connect if not already connected
        socketService.connect(user.token);
        
        // Wait for connection
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (socketService.isReady()) {
              console.log('✅ Socket connected successfully');
              resolve();
            } else {
              console.log('⏳ Waiting for socket connection...');
              setTimeout(checkConnection, 500);
            }
          };
          checkConnection();
        });
      }
      
      // Join chat room with retry logic
      const joinChatWithRetry = (retries = 3) => {
        if (socketService.isReady()) {
          console.log('🎯 Joining chat room:', chatId);
          socketService.joinChat(chatId);
          
          // Verify chat room joining
          setTimeout(() => {
            console.log('🔍 Verifying chat room join...');
            // Test if we can receive events
            socketService.emit('test_chat_join', { chatId, userId: user._id });
          }, 1000);
        } else if (retries > 0) {
          console.log(`🔄 Retrying chat join... (${retries} attempts left)`);
          setTimeout(() => joinChatWithRetry(retries - 1), 1000);
        } else {
          console.error('❌ Failed to join chat room after retries');
        }
      };
      
      joinChatWithRetry();
    };
    
    setupSocket();
    
    // Check socket connection status
    console.log('Socket connection status:', socketService.getConnectionStatus());
    console.log('Socket ready:', socketService.isReady());
    
    // Listen for new messages
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleTypingStatus);
    socketService.on('reaction_added', handleReactionAdded);
    socketService.on('reaction_removed', handleReactionRemoved);
    socketService.on('test_reaction_received', (data) => {
      console.log('🧪 TEST REACTION RECEIVED:', data);
    });
    
    // Listen for chat join confirmation
    socketService.on('chat_joined', (data) => {
      console.log('✅ Chat room joined successfully:', data);
    });
    
    // Listen for reaction acknowledgments
    socketService.on('reaction_added_ack', (data) => {
      console.log('✅ Reaction added acknowledgment:', data);
    });
    
    socketService.on('reaction_removed_ack', (data) => {
      console.log('✅ Reaction removed acknowledgment:', data);
    });
    
    // Listen for test responses
    socketService.on('test_chat_join_response', (data) => {
      console.log('🧪 Chat join test response:', data);
    });
    
    // Listen for user joined chat events
    socketService.on('user_joined_chat', (data) => {
      console.log('👤 User joined chat:', data);
    });
    
    // Test socket connection
    setTimeout(() => {
      console.log('Socket status after 2 seconds:', socketService.getConnectionStatus());
      if (socketService.isReady()) {
        console.log('Socket is ready for real-time reactions');
        // Test the reaction event
        socketService.emit('test_reaction', { chatId, message: 'Testing reaction events' });
      } else {
        console.warn('Socket is not ready - reactions may not sync in real-time');
      }
    }, 2000);
    
    return () => {
      // Clean up
      console.log('🧹 Cleaning up chat screen...');
      socketService.leaveChat(chatId);
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleTypingStatus);
      socketService.off('reaction_added', handleReactionAdded);
      socketService.off('reaction_removed', handleReactionRemoved);
      socketService.off('test_reaction_received');
      socketService.off('chat_joined');
      socketService.off('reaction_added_ack');
      socketService.off('reaction_removed_ack');
      socketService.off('test_chat_join_response');
      socketService.off('user_joined_chat');
      
      // Stop typing when leaving
      if (typing) {
        socketService.stopTyping(chatId);
      }
    };
  }, [chatId]);

  const animateReaction = (messageId, emoji) => {
    const animationKey = `${messageId}-${emoji}`;
    const animatedValue = new Animated.Value(0);
    
    setReactionAnimations(prev => ({
      ...prev,
      [animationKey]: animatedValue
    }));

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddReaction = async (message, emoji) => {
    try {
      console.log('🔥 CLIENT: Adding reaction:', emoji, 'to message:', message._id);
      console.log('🔥 CLIENT: Current chat ID:', chatId);
      console.log('🔥 CLIENT: Current user ID:', user._id);
      console.log('🔥 CLIENT: Socket ready:', socketService.isReady());
      
      // Trigger animation
      animateReaction(message._id, emoji);
      
      // Update the message locally with the reaction
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === message._id) {
            // Initialize reactions array if it doesn't exist
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.userId === user._id);
            
            if (existingReaction) {
              if (existingReaction.emoji === emoji) {
                // Remove reaction if same emoji is tapped
                const newReactions = reactions.filter(r => r.userId !== user._id);
                
                console.log('🔥 CLIENT: Removing reaction, calling socketService.removeReaction');
                // Emit reaction removed event using socket service method
                socketService.removeReaction(chatId, message._id, user._id, existingReaction.emoji);
                
                return {
                  ...msg,
                  reactions: newReactions
                };
              } else {
                // Replace existing reaction with new emoji
                const newReactions = reactions.map(r => 
                  r.userId === user._id 
                    ? { ...r, emoji, userName: user.name }
                    : r
                );
                
                console.log('🔥 CLIENT: Replacing reaction, calling socketService.addReaction');
                // Emit reaction updated event using socket service method
                socketService.addReaction(chatId, message._id, user._id, emoji, user.name);
                
                return {
                  ...msg,
                  reactions: newReactions
                };
              }
            } else {
              // Add new reaction (user has no existing reaction)
              const newReactions = [...reactions, { userId: user._id, emoji, userName: user.name }];
              
              console.log('🔥 CLIENT: Adding new reaction, calling socketService.addReaction');
              // Emit reaction added event using socket service method
              socketService.addReaction(chatId, message._id, user._id, emoji, user.name);
              
              return {
                ...msg,
                reactions: newReactions
              };
            }
          }
          return msg;
        })
      );
      
      // Close the modal after adding reaction
      setShowMessageModal(false);
      
      // Here you would typically send the reaction to your API
      // const response = await api.addMessageReaction(chatId, message._id, emoji);
      
    } catch (error) {
      console.error('❌ CLIENT: Add reaction error:', error);
    }
  };

  const handleReactionAdded = (data) => {
    console.log('Received reaction_added event:', data);
    if (data.chatId === chatId) {
      console.log('Updating message with reaction:', data.messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === data.messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.userId === data.userId);
            
            if (existingReaction) {
              // Replace existing reaction
              const newReactions = reactions.map(r => 
                r.userId === data.userId 
                  ? { ...r, emoji: data.emoji, userName: data.userName }
                  : r
              );
              console.log('Replaced reaction, new reactions:', newReactions);
              return { ...msg, reactions: newReactions };
            } else {
              // Add new reaction
              const newReactions = [...reactions, { 
                userId: data.userId, 
                emoji: data.emoji, 
                userName: data.userName 
              }];
              console.log('Added new reaction, new reactions:', newReactions);
              return { ...msg, reactions: newReactions };
            }
          }
          return msg;
        })
      );
      
      // Animate the reaction if it's not from the current user
      if (data.userId !== user._id) {
        console.log('Animating reaction from other user');
        animateReaction(data.messageId, data.emoji);
      }
    } else {
      console.log('Reaction event for different chat:', data.chatId, 'current chat:', chatId);
    }
  };

  const handleReactionRemoved = (data) => {
    console.log('Received reaction_removed event:', data);
    if (data.chatId === chatId) {
      console.log('Removing reaction from message:', data.messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === data.messageId) {
            const reactions = msg.reactions || [];
            const newReactions = reactions.filter(r => r.userId !== data.userId);
            console.log('Removed reaction, new reactions:', newReactions);
            return { ...msg, reactions: newReactions };
          }
          return msg;
        })
      );
    } else {
      console.log('Reaction removal event for different chat:', data.chatId, 'current chat:', chatId);
    }
  };

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

  const handleLongPressMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const handleCopy = () => {
    if (selectedMessage) {
      Clipboard.setString(selectedMessage.content.text);
      setShowMessageModal(false);
    }
  };

  const handleReply = () => {
    // Implement reply logic here
    setShowMessageModal(false);
  };

  const handleReport = () => {
    // Implement report logic here
    setShowMessageModal(false);
  };

  const renderMessage = ({ item: message }) => {
    const isMyMessage = message.sender._id === user._id;
    const messageTime = formatMessageTime(message.createdAt);
    
    const handleMessagePress = (event) => {
      // Handle double tap for heart reaction (for all messages)
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      
      if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
        // Double tap detected - add heart reaction
        handleAddReaction(message, '❤️');
        setLastTap(null);
      } else {
        setLastTap(now);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleMessagePress}
        onLongPress={() => handleLongPressMessage(message)}
        delayLongPress={300}
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
      >
        {!isMyMessage && (
          message.sender?.avatar ? (
            <Image
              source={{ uri: message.sender.avatar }}
              style={[styles.senderAvatar, { backgroundColor: colors.surfaceVariant }]}
            />
          ) : (
            <View style={[styles.senderAvatar, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
              <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
            </View>
          )
        )}
        
        {/* Display reactions before message bubble for sent messages */}
        {isMyMessage && message.reactions && message.reactions.length > 0 && (
          <View style={[styles.reactionsContainer, styles.myReactionsContainer]}>
            {(() => {
              const reactionGroups = message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {});
              
              return Object.entries(reactionGroups).map(([emoji, count]) => {
                const animationKey = `${message._id}-${emoji}`;
                const animatedValue = reactionAnimations[animationKey] || new Animated.Value(1);
                
                return (
                  <Animated.View 
                    key={emoji} 
                    style={[
                      styles.reactionBadge, 
                      { backgroundColor: colors.surface },
                      { transform: [{ scale: animatedValue }] }
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>{count}</Text>
                  </Animated.View>
                );
              });
            })()}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surfaceVariant }
        ]}>
          {!isMyMessage && (
            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
              {message.sender?.name && typeof message.sender.name === 'string' ? message.sender.name : 'Unknown User'}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage
              ? { color: colors.textInverse }
              : { color: colors.text }
          ]}>
            {message.content?.text && typeof message.content.text === 'string' ? message.content.text : 'Message content unavailable'}
          </Text>
        </View>
        
        {/* Display reactions after message bubble for received messages */}
        {!isMyMessage && message.reactions && message.reactions.length > 0 && (
          <View style={[styles.reactionsContainer, styles.otherReactionsContainer]}>
            {(() => {
              const reactionGroups = message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {});
              
              return Object.entries(reactionGroups).map(([emoji, count]) => (
                <View key={emoji} style={[styles.reactionBadge, { backgroundColor: colors.surface }]}>
                  <Text style={styles.reactionEmoji}>
                    {typeof emoji === 'string' ? emoji : '👍'}
                  </Text>
                  <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>
                    {typeof count === 'number' ? String(count) : '0'}
                  </Text>
                </View>
              ));
            })()}
          </View>
        )}
      </TouchableOpacity>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
                  if (otherUser && otherUser._id) {
                    navigation.navigate('UserProfile', {
                      userId: otherUser._id,
                      userName: otherUser.name && typeof otherUser.name === 'string' ? otherUser.name : 'Unknown User'
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
              {chatTitle && typeof chatTitle === 'string' ? chatTitle : 'Chat'}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={Platform.OS === 'ios'}
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
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: colors.surface, 
            borderTopColor: colors.border,
            ...(Platform.OS === 'android' && {
              paddingBottom: 10, // Extra padding for Android keyboard
            })
          }
        ]}>
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
              returnKeyType="send"
              blurOnSubmit={false}
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
      {/* Message Modal for long press */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'transparent' }} onPress={() => setShowMessageModal(false)}>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 0 }}>
            {/* Emoji Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 }}>
              {['❤️','😂','🔥','👀','🫠','👍'].map((emoji, idx) => (
                <TouchableOpacity key={emoji} style={{ marginHorizontal: 8 }} onPress={() => handleAddReaction(selectedMessage, emoji)}>
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={{ marginHorizontal: 8 }}>
                <Feather name="plus-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {/* Send Time */}
            {selectedMessage && (
              <Text style={{ color: colors.textSecondary, marginBottom: 8, textAlign: 'center', fontSize: 13 }}>
                {formatMessageTime(selectedMessage.createdAt)}
              </Text>
            )}
            {/* Actions */}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 }} onPress={handleReply}>
                <Feather name="corner-up-left" size={20} color={colors.text} style={{ marginRight: 12 }} />
                <Text style={{ color: colors.text, fontSize: 16 }}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 }} onPress={handleCopy}>
                <Feather name="copy" size={20} color={colors.text} style={{ marginRight: 12 }} />
                <Text style={{ color: colors.text, fontSize: 16 }}>Copy</Text>
              </TouchableOpacity>
              {selectedMessage && selectedMessage.sender._id === user._id ? (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 }} onPress={() => {/* Unsend logic here */ setShowMessageModal(false); }}>
                  <MaterialIcons name="undo" size={20} color="#ff3b30" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#ff3b30', fontSize: 16 }}>Unsend</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 }} onPress={handleReport}>
                  <MaterialIcons name="report" size={20} color="#ff3b30" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#ff3b30', fontSize: 16 }}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  otherReactionsContainer: {
    justifyContent: 'flex-end',
    paddingRight: 0,
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
    paddingVertical: 25, // Reduced from 8 to 4 to move it higher
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8, // Increased from 6 to 8
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 80, // Reduced from 100 to 80
    marginRight: 8,
    paddingVertical: 4, // Increased from 2 to 4
  },
  sendButton: {
    width: 32, // Reduced from 36 to 32
    height: 20, // Reduced from 36 to 20
    borderRadius: 16, // Reduced from 18 to 16
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    paddingHorizontal: 1,
  },
  myReactionsContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 0,
  },
  otherReactionsContainer: {
    justifyContent: 'flex-end',
    paddingRight: 0,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
});

export default ChatScreen; 
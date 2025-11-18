import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import socketService from '../services/socket';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigationState } from '../contexts/NavigationContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatListScreen = ({ navigation, user }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { updateNavigationState } = useNavigationState();
  const colors = getThemeColors(theme);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const currentOpenChatId = useRef(null); // Track the currently open chat

  const loadChats = useCallback(async () => {
    try {
      setError('');
      const response = await api.getChats();
      if (response.success) {
        // Filter out chats with deleted users and validate chat data
        const validChats = response.data.chats.filter(chat => {
          if (!chat || !chat._id) {
            console.warn('⚠️ Filtering out invalid chat:', chat);
            return false;
          }
          
          if (chat.type === 'group') {
            // For group chats, check if the group still exists and has valid participants
            if (!chat.participants || !Array.isArray(chat.participants) || chat.participants.length === 0) {
              console.warn('⚠️ Filtering out group chat with invalid participants:', chat._id);
              return false;
            }
            return true;
          } else {
            // For direct chats, check if the other participant still exists
            if (!chat.participants || !Array.isArray(chat.participants)) {
              console.warn('⚠️ Filtering out direct chat with invalid participants:', chat._id);
              return false;
            }
            
            const otherParticipant = chat.participants.find(p => p && p._id && p._id !== user._id);
            if (!otherParticipant) {
              console.warn('⚠️ Filtering out chat with deleted user:', chat._id);
              return false;
            }
            
            // Check if the other participant has valid data (not deleted)
            if (!otherParticipant.name || otherParticipant.name === 'Unknown User') {
              console.warn('⚠️ Filtering out chat with deleted user (no name):', chat._id, otherParticipant);
              return false;
            }
            
            return true;
          }
        });
        
        // Sort valid chats by most recent message
        const sortedChats = validChats.sort((a, b) => {
          const aTime = new Date(a.lastMessage?.timestamp || a.createdAt);
          const bTime = new Date(b.lastMessage?.timestamp || b.createdAt);
          return bTime - aTime;
        });
        
        setChats(sortedChats);
        console.log(`✅ Loaded ${sortedChats.length} valid chats (filtered out ${response.data.chats.length - sortedChats.length} invalid chats)`);
      } else {
        setError(getTranslation('chatsLoadError', language));
      }
    } catch (error) {
      console.error('Load chats error:', error);
      setError(getTranslation('chatsLoadError', language));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language, user._id]);

  useEffect(() => {
    loadChats();
    // Update navigation state when chat list screen is focused
    updateNavigationState('ChatList', null);
  }, [loadChats, updateNavigationState]);

  // Check socket connection status
  useEffect(() => {
    const checkSocketConnection = () => {
      const isConnected = socketService.isConnected;
      const wasConnected = socketConnected;
      
      setSocketConnected(isConnected);
      
      if (!isConnected && wasConnected) {
        console.warn('⚠️ Socket disconnected, attempting to reconnect...');
        // Try to reconnect if not connected
        const token = AsyncStorage.getItem('token');
        if (token) {
          socketService.connect(token);
        }
      } else if (isConnected && !wasConnected) {
        console.log('✅ Socket reconnected, real-time updates restored');
        // Refresh chats when connection is restored
        loadChats();
      } else if (!isConnected) {
        console.warn('⚠️ Socket not connected, attempting to reconnect...');
        // Try to reconnect if not connected
        const token = AsyncStorage.getItem('token');
        if (token) {
          socketService.connect(token);
        }
      } else {
        console.log('✅ Socket is connected and ready for real-time updates');
      }
    };

    // Check immediately
    checkSocketConnection();
    
    // Check periodically
    const connectionCheckInterval = setInterval(checkSocketConnection, 5000);
    
    return () => clearInterval(connectionCheckInterval);
  }, [socketConnected, loadChats]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  // Listen for new messages to update chat list
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      console.log('📨 Received new message:', data);
      const { chatId, message } = data;
      
      if (!chatId || !message) {
        console.warn('⚠️ Invalid message data received:', data);
        return;
      }

      setChats(prevChats => {
        let found = false;
        const updatedChats = prevChats.map(chat => {
          if (chat._id === chatId) {
            found = true;
            const isChatOpen = currentOpenChatId.current === chatId;
            
            // Create updated chat with new message
            const updatedChat = {
              ...chat,
              lastMessage: {
                id: message._id,
                text: message.content?.text || message.text || '',
                sender: message.sender,
                timestamp: message.createdAt || message.timestamp,
                isRead: false
              },
              unreadCount: (!isChatOpen && message.sender._id !== user._id) ? 
                (chat.unreadCount || 0) + 1 : 
                (chat.unreadCount || 0)
            };
            
            console.log('🔄 Updated chat:', {
              chatId,
              newUnreadCount: updatedChat.unreadCount,
              messageText: updatedChat.lastMessage.text,
              sender: message.sender._id,
              currentUser: user._id
            });
            
            return updatedChat;
          }
          return chat;
        });
        
        // Move updated chat to top if found
        if (found) {
          const chatIndex = updatedChats.findIndex(chat => chat._id === chatId);
          const [chatToTop] = updatedChats.splice(chatIndex, 1);
          return [chatToTop, ...updatedChats];
        }
        
        // If chat not found, it might be a new chat - fetch updated list
        console.log('🆕 New chat detected, fetching updated chat list...');
        setTimeout(() => {
          loadChats();
        }, 1000);
        
        return updatedChats;
      });
    };

    const handleChatUpdate = (data) => {
      console.log('🔄 Chat update received:', data);
      const { chatId, updates } = data;
      
      if (chatId && updates) {
        setChats(prevChats => 
          prevChats.map(chat => 
            chat._id === chatId ? { ...chat, ...updates } : chat
          )
        );
      }
    };

    const handleUserStatusUpdate = (data) => {
      console.log('👤 User status update:', data);
      const { userId, status } = data;
      
      if (userId && status) {
        setChats(prevChats => 
          prevChats.map(chat => {
            if (chat.type === 'direct' && chat.participants) {
              const updatedParticipants = chat.participants.map(participant => 
                participant._id === userId ? { ...participant, status } : participant
              );
              return { ...chat, participants: updatedParticipants };
            }
            return chat;
          })
        );
      }
    };

    const handleChatDeleted = (data) => {
      console.log('🗑️ Chat deleted:', data);
      const { chatId } = data;
      
      if (chatId) {
        setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
      }
    };

    // Set up socket event listeners
    console.log('🔌 Setting up socket event listeners for ChatListScreen');
    
    socketService.on('new_message', handleIncomingMessage);
    socketService.on('chat_updated', handleChatUpdate);
    socketService.on('user_status_update', handleUserStatusUpdate);
    socketService.on('chat_deleted', handleChatDeleted);
    
    // Also listen for message events with different names that might be used
    socketService.on('message', handleIncomingMessage);
    socketService.on('chat_message', handleIncomingMessage);

    return () => {
      console.log('🧹 Cleaning up socket event listeners for ChatListScreen');
      socketService.off('new_message', handleIncomingMessage);
      socketService.off('chat_updated', handleChatUpdate);
      socketService.off('user_status_update', handleUserStatusUpdate);
      socketService.off('chat_deleted', handleChatDeleted);
      socketService.off('message', handleIncomingMessage);
      socketService.off('chat_message', handleIncomingMessage);
    };
  }, [user._id, loadChats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const getChatTitle = (chat) => {
    if (!chat) {
      console.warn('⚠️ getChatTitle: chat is null or undefined');
      return 'Unknown Chat';
    }
    
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group';
    } else {
      // Validate participants array exists
      if (!chat.participants || !Array.isArray(chat.participants)) {
        console.warn('⚠️ getChatTitle: chat.participants is invalid:', chat.participants);
        return 'Unknown Chat';
      }
      
      const otherParticipant = chat.participants.find(p => p && p._id && p._id !== user._id);
      if (!otherParticipant) {
        console.warn('⚠️ getChatTitle: No other participant found in chat:', chat._id);
        return 'Deleted User';
      }
      
      return otherParticipant.name || 'Deleted User';
    }
  };

  const getChatAvatar = (chat) => {
    // Add validation to prevent errors with invalid chat objects
    if (!chat) {
      console.warn('⚠️ getChatAvatar: chat is null or undefined');
      return null;
    }
    
    if (chat.type === 'group') {
      // Use chat image if available, otherwise use default group image
      return chat.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop&crop=face';
    } else {
      // Validate participants array exists
      if (!chat.participants || !Array.isArray(chat.participants)) {
        console.warn('⚠️ getChatAvatar: chat.participants is invalid:', chat.participants);
        return null;
      }
      
      const otherParticipant = chat.participants.find(p => p && p._id !== user._id);
      return otherParticipant?.avatar || null;
    }
  };

  const getLastMessageText = (chat) => {
    if (!chat.lastMessage?.text) return 'Message not found';
    
    const sender = chat.lastMessage.sender;
    const isOwnMessage = sender?._id === user._id;
    
    return isOwnMessage ? 'You: ' + (chat.lastMessage.text && typeof chat.lastMessage.text === 'string' ? chat.lastMessage.text : '') : (chat.lastMessage.text && typeof chat.lastMessage.text === 'string' ? chat.lastMessage.text : '');
  };

  const getDisplayDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return String(diffInMinutes) + 'm';
    } else if (diffInHours < 24) {
      return String(diffInHours) + 'h';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return String(diffInDays) + ' days';
    } else {
      return date.toLocaleDateString('mn-MN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleChatPress = async (chat) => {
    try {
      // Validate chat object
      if (!chat || !chat._id) {
        console.error('❌ Invalid chat object:', chat);
        return;
      }

      console.log('🔍 Opening chat:', chat._id);
      currentOpenChatId.current = chat._id; // Set open chat
      
      // Mark chat as read (don't fail if this doesn't work)
      try {
        await api.markChatAsRead(chat._id);
        setChats(prevChats => 
          prevChats.map(c => 
            c._id === chat._id ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (markReadError) {
        console.error('❌ Failed to mark chat as read:', markReadError);
        // Continue anyway, don't block chat opening
      }
      
      // Navigate to chat with proper parameters
      navigation.navigate('Chat', { 
        chatId: chat._id,
        chatTitle: getChatTitle(chat),
        onGoBack: () => { currentOpenChatId.current = null; } // Clear on back
      });
    } catch (error) {
      console.error('❌ Error opening chat:', error);
      // Continue anyway, don't block chat opening
    }
  };

  const handleChatDelete = async (chatId) => {
    Alert.alert(
      getTranslation('confirmDeleteChatTitle', language),
      getTranslation('confirmDeleteChatMessage', language),
      [
        {
          text: getTranslation('cancel', language),
          style: 'cancel',
        },
        {
          text: getTranslation('delete', language),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteChat(chatId);
              setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
              console.log(`✅ Chat ${chatId} deleted successfully.`);
            } catch (deleteError) {
              console.error('❌ Failed to delete chat:', deleteError);
              Alert.alert(
                getTranslation('deleteErrorTitle', language),
                getTranslation('deleteErrorMessage', language),
                [{ text: getTranslation('ok', language) }]
              );
            }
          },
        },
      ],
    );
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const title = getChatTitle(chat).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item: chat }) => {
    // Add validation to prevent rendering invalid chat objects
    if (!chat || !chat._id) {
      console.warn('⚠️ renderChatItem: Invalid chat object:', chat);
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleChatPress(chat)}
        onLongPress={() => handleChatDelete(chat._id)}
        activeOpacity={0.7}
        delayLongPress={500}
      >
        <View style={styles.avatarContainer}>
          {(() => {
            const avatarUrl = getChatAvatar(chat);
            // Add proper validation to prevent undefined.startsWith error
            if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
              return (
                <Image 
                  source={{ uri: avatarUrl }}
                  style={[styles.avatar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                />
              );
            } else {
              return (
                <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
                </View>
              );
            }
          })()}
          {chat.type === 'direct' && (() => {
            const otherParticipant = chat.participants.find(p => p._id !== user._id);
            const isOnline = otherParticipant?.status === 'online';
            return (
              <View style={[
                styles.onlineIndicator,
                { 
                  backgroundColor: isOnline ? colors.success : colors.textTertiary,
                  borderColor: colors.background 
                }
              ]} />
            );
          })()}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
              {getChatTitle(chat)}
            </Text>
            <Text style={[styles.chatTime, { color: colors.textSecondary }]}>
              {getDisplayDate(chat.lastMessage?.timestamp)}
            </Text>
          </View>
          
          <View style={styles.chatFooter}>
            <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
              {getLastMessageText(chat)}
            </Text>
            {chat.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadCount, { color: colors.textInverse }]}>
                  {chat.unreadCount > 9 ? '9+' : String(chat.unreadCount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']} // Don't include bottom to avoid tab bar overlap
    >
      {/* Header with Glass Effect */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: colors.border,
          backgroundColor: theme === 'dark' 
            ? 'rgba(15, 15, 25, 0.6)' 
            : 'rgba(255, 255, 255, 0.75)'
        }
      ]}>
        <BlurView
          pointerEvents="none"
          intensity={80}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderBottomWidth: 0.5,
            borderBottomColor: theme === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
          }}
        />
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot, 
              { backgroundColor: socketConnected ? colors.success : colors.error || '#ef4444' }
            ]} />
            <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
              {socketConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          {!socketConnected && (
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={loadChats}
            >
              <Ionicons name="refresh" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => navigation.navigate('UserSearch')}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingSpinner, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error || '#ef4444' }]}>
            {error && typeof error === 'string' ? error : 'Error occurred'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadChats}
          >
            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'No Results' : 'No Chats Yet'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'No chats found matching your search' : 'No chats yet'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={[styles.newChatButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('UserSearch')}
            >
              <Ionicons name="add" size={24} color={colors.textInverse} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item._id}
            renderItem={renderChatItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.helpTextContainer}>
            <Text style={[styles.helpText, { color: colors.textTertiary }]}>
              💡 Long-press on any chat to delete it
            </Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 0,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearSearch: {
    marginLeft: 8,
    padding: 4,
  },
  chatList: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
    paddingHorizontal: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chatInfo: {
    flex: 1,
    marginRight: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  chatTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
    lineHeight: 20,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingSpinner: {
    padding: 20,
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
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  newChatButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ChatListScreen; 
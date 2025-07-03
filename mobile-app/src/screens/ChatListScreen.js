import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import socketService from '../services/socket';
import { useFocusEffect } from '@react-navigation/native';

const ChatListScreen = ({ navigation, user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const loadChats = useCallback(async () => {
    try {
      setError('');
      const response = await api.getChats();
      if (response.success) {
        // Sort chats by most recent message (standard chat app behavior)
        const sortedChats = response.data.chats.slice().sort((a, b) => {
          const aTime = new Date(a.lastMessage?.timestamp || a.createdAt);
          const bTime = new Date(b.lastMessage?.timestamp || b.createdAt);
          return bTime - aTime;
        });
        setChats(sortedChats);
      } else {
        setError('Чат жагсаалтыг уншихад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load chats error:', error);
      setError('Чат жагсаалтыг уншихад алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  // Listen for new messages to update chat list
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      const { chatId, message } = data;
      
      setChats(prevChats => {
        const chatExists = prevChats.find(chat => chat._id === chatId);
        if (!chatExists) {
          return prevChats;
        }
        
        const updatedChats = prevChats.map(chat => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: {
                id: message._id,
                text: message.content?.text || '',
                sender: message.sender,
                timestamp: message.createdAt,
                isRead: false
              },
              unreadCount: message.sender._id !== user._id ? chat.unreadCount + 1 : chat.unreadCount
            };
          }
          return chat;
        }).sort((a, b) => {
          const aTime = new Date(a.lastMessage?.timestamp || a.createdAt);
          const bTime = new Date(b.lastMessage?.timestamp || b.createdAt);
          return bTime - aTime;
        });
        
        return updatedChats;
      });
    };
    
    socketService.on('new_message', handleIncomingMessage);
    return () => {
      socketService.off('new_message', handleIncomingMessage);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const getChatTitle = (chat) => {
    if (chat.type === 'group') {
      return chat.name;
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop&crop=face';
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    }
  };

  const getLastMessageText = (chat) => {
    if (!chat.lastMessage?.text) return 'Мессеж байхгүй';
    
    const sender = chat.lastMessage.sender;
    const isOwnMessage = sender?._id === user._id;
    
    return isOwnMessage ? `Та: ${chat.lastMessage.text}` : chat.lastMessage.text;
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
      return 'одоо';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}м`;
    } else if (diffInHours < 24) {
      return `${diffInHours}ц`;
    } else if (diffInDays === 1) {
      return 'өчигдөр';
    } else if (diffInDays < 7) {
      return `${diffInDays} өдөр`;
    } else {
      return date.toLocaleDateString('mn-MN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleChatPress = async (chat) => {
    try {
      // Mark chat as read
      await api.markChatAsRead(chat._id);
      
      // Update local state to clear unread count
      setChats(prevChats => 
        prevChats.map(c => 
          c._id === chat._id ? { ...c, unreadCount: 0 } : c
        )
      );

      // Navigate to chat screen
      navigation.navigate('Chat', { 
        chatId: chat._id,
        chatTitle: getChatTitle(chat)
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Алдаа', 'Чатыг нээхэд алдаа гарлаа');
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const title = getChatTitle(chat).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item: chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(chat)}
      onLongPress={() => {
        if (chat.type === 'direct') {
          const otherParticipant = chat.participants.find(p => p._id !== user._id);
          if (otherParticipant) {
            navigation.navigate('UserProfile', {
              userId: otherParticipant._id,
              userName: otherParticipant.name
            });
          }
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: getChatAvatar(chat) }}
          style={styles.avatar}
        />
        {chat.type === 'direct' && (() => {
          const otherParticipant = chat.participants.find(p => p._id !== user._id);
          const isOnline = otherParticipant?.status === 'online';
          return (
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: isOnline ? '#000' : '#999' }
            ]} />
          );
        })()}
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {getChatTitle(chat)}
          </Text>
          <Text style={styles.chatTime}>
            {getDisplayDate(chat.lastMessage?.timestamp)}
          </Text>
        </View>
        
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessageText(chat)}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Чат</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чат</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => navigation.navigate('UserSearch')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Чат хайх..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearSearch}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Chat List */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadChats}
          >
            <Text style={styles.retryButtonText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Чат олдсонгүй' : 'Чат байхгүй байна'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'Өөр нэрээр хайж үзээрэй' 
              : 'Шинэ чат эхлүүлэхийн тулд + товчийг дарна уу'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          style={styles.chatList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000']}
              tintColor="#000"
            />
          }
          showsVerticalScrollIndicator={false}
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
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  clearSearch: {
    marginLeft: 8,
    padding: 4,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#64748b',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#000000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
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
});

export default ChatListScreen; 
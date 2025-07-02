import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import apiService from '../services/api';
import socketService from '../services/socket';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';

const ChatListScreen = ({ navigation, user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Load chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChats();
      
      // Listen for new messages
      socketService.on('new_message', handleNewMessage);
      socketService.on('chat_updated', handleChatUpdated);
      
      return () => {
        socketService.off('new_message', handleNewMessage);
        socketService.off('chat_updated', handleChatUpdated);
      };
    }, [])
  );

  const loadChats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError('');
    
    try {
      const response = await apiService.getChats();
      if (response.success) {
        setChats(response.data.chats);
      } else {
        setError(response.message || 'Чат татахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load chats error:', error);
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNewMessage = useCallback((data) => {
    // Update chat list with new message
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat._id === data.chatId) {
          return {
            ...chat,
            lastMessage: {
              text: data.message.content.text || '',
              sender: data.message.sender,
              timestamp: data.message.createdAt,
            },
            unreadCount: chat.unreadCount + 1,
          };
        }
        return chat;
      });
      
      // Sort chats by last message timestamp
      return updatedChats.sort((a, b) => 
        new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
      );
    });
  }, []);

  const handleChatUpdated = useCallback((data) => {
    // Refresh chat list when chat is updated
    loadChats();
  }, []);

  const handleRefresh = () => {
    loadChats(true);
  };

  const navigateToChat = (chat) => {
    const chatTitle = getChatTitle(chat);
    navigation.navigate('Chat', { 
      chatId: chat._id, 
      chatTitle,
      user 
    });
  };

  const navigateToUserSearch = () => {
    navigation.navigate('UserSearch', { user });
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

  const getLastMessageTime = (chat) => {
    if (!chat.lastMessage?.timestamp) return '';
    
    try {
      return formatDistanceToNow(new Date(chat.lastMessage.timestamp), {
        addSuffix: true,
        locale: mn
      });
    } catch (error) {
      return '';
    }
  };

  const handleDeleteChat = (chat) => {
    Alert.alert(
      'Чат устгах',
      `"${getChatTitle(chat)}" чатыг устгахдаа итгэлтэй байна уу?`,
      [
        { text: 'Цуцлах', style: 'cancel' },
        {
          text: 'Устгах',
          style: 'destructive',
          onPress: () => deleteChat(chat._id),
        },
      ]
    );
  };

  const deleteChat = async (chatId) => {
    try {
      const response = await apiService.deleteChat(chatId);
      if (response.success) {
        setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
        Toast.show({
          type: 'success',
          text1: 'Амжилттай',
          text2: 'Чат устгагдлаа',
        });
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Чат устгахад алдаа гарлаа',
      });
    }
  };

  const renderChatItem = ({ item: chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat(chat)}
      onLongPress={() => handleDeleteChat(chat)}
    >
      <Image source={{ uri: getChatAvatar(chat) }} style={styles.avatar} />
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {getChatTitle(chat)}
          </Text>
          <Text style={styles.timestamp}>
            {getLastMessageTime(chat)}
          </Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessageText(chat)}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#cccccc" />
      <Text style={styles.emptyTitle}>Чат байхгүй байна</Text>
      <Text style={styles.emptySubtitle}>
        Шинэ чат эхлүүлэхийн тулд доорх товчийг дарна уу
      </Text>
      <TouchableOpacity style={styles.newChatButton} onPress={navigateToUserSearch}>
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.newChatButtonText}>Шинэ чат</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Алдаа гарлаа</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadChats()}>
        <Text style={styles.retryButtonText}>Дахин оролдох</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Чат ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чат</Text>
        <TouchableOpacity style={styles.newChatIconButton} onPress={navigateToUserSearch}>
          <Ionicons name="person-add-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={chats.length === 0 ? styles.emptyList : undefined}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  newChatIconButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  unreadBadge: {
    backgroundColor: '#000000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatListScreen; 
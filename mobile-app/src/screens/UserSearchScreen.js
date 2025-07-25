import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const UserSearchScreen = ({ navigation, user }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [creatingChat, setCreatingChat] = useState(null);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      const response = await api.getFollowing();
      if (response.success) {
        setFollowing(response.data.following);
      }
    } catch (error) {
      console.error('Fetch following error:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.searchUsers(query);
      if (response.success) {
        // Filter out current user
        const filteredUsers = response.data.users.filter(u => u._id !== user._id);
        setSearchResults(filteredUsers);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search users error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const searchTimeout = setTimeout(() => {
      searchUsers(text);
    }, 500);
  };

  const handleStartChat = async (targetUser) => {
    setCreatingChat(targetUser._id);
    
    try {
      // Check if chat already exists
      const existingChats = await api.getChats();
      if (existingChats.success) {
        const existingChat = existingChats.data.chats.find(chat => 
          chat.type === 'direct' && 
          chat.participants.some(p => p._id === targetUser._id)
        );
        
        if (existingChat) {
          // Chat already exists, navigate to it
          navigation.navigate('Chat', {
            chatId: existingChat._id,
            chatTitle: targetUser.name
          });
          return;
        }
      }

      // Create new chat
      const response = await api.createChat({
        type: 'direct',
        participants: [targetUser._id]
      });
      
      if (response.success) {
        navigation.navigate('Chat', {
          chatId: response.data.chat._id,
          chatTitle: targetUser.name
        });
      } else {
        Alert.alert('Алдаа', 'Чат үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      Alert.alert('Алдаа', 'Чат үүсгэхэд алдаа гарлаа');
    } finally {
      setCreatingChat(null);
    }
  };

  const handleFollowUser = async (targetUser) => {
    try {
      const response = await api.followUser(targetUser._id);
      if (response.success) {
        // Update following list
        setFollowing(prev => [...prev, targetUser]);
        
        // Update search results to show followed status
        setSearchResults(prev => 
          prev.map(user => 
            user._id === targetUser._id 
              ? { ...user, isFollowing: true }
              : user
          )
        );
      } else {
        Alert.alert('Алдаа', 'Дагахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Follow user error:', error);
      Alert.alert('Алдаа', 'Дагахад алдаа гарлаа');
    }
  };

  const renderUserItem = ({ item: targetUser }) => {
    const isLoading = creatingChat === targetUser._id;
    const isFollowing = following.some(f => f._id === targetUser._id) || targetUser.isFollowing;

    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => {
          navigation.navigate('UserProfile', {
            userId: targetUser._id,
            userName: targetUser.name
          });
        }}
      >
        <Image
          source={{ 
            uri: targetUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
          }}
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {targetUser.name && typeof targetUser.name === 'string' ? targetUser.name : 'Unknown User'}
          </Text>
          <Text style={[styles.userUsername, { color: colors.textSecondary }]} numberOfLines={1}>
            @{targetUser.username && typeof targetUser.username === 'string' ? targetUser.username : 'unknown'}
          </Text>
          {targetUser.bio && typeof targetUser.bio === 'string' && (
            <Text style={[styles.userBio, { color: colors.textTertiary }]} numberOfLines={2}>
              {targetUser.bio}
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          {!isFollowing && (
            <TouchableOpacity
              style={styles.followButton}
              onPress={(e) => {
                e.stopPropagation();
                handleFollowUser(targetUser);
              }}
            >
              <Text style={styles.followButtonText}>Дагах</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.chatButton, isLoading && styles.chatButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              handleStartChat(targetUser);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="chatbubble" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFollowingItem = ({ item: targetUser }) => {
    const isLoading = creatingChat === targetUser._id;

    return (
      <TouchableOpacity
        style={[styles.followingItem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
        onPress={() => {
          navigation.navigate('UserProfile', {
            userId: targetUser._id,
            userName: targetUser.name
          });
        }}
        disabled={isLoading}
      >
        <Image
          source={{ 
            uri: targetUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
          }}
          style={[styles.followingAvatar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderWidth: 1 }]}
        />
        
        <View style={styles.followingInfo}>
          <Text style={[styles.followingName, { color: colors.text }]} numberOfLines={1}>
            {targetUser.name && typeof targetUser.name === 'string' ? targetUser.name : 'Unknown User'}
          </Text>
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: targetUser.status === 'online' ? colors.primary : colors.textTertiary, borderColor: colors.surface }
          ]} />
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }] }>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Хэрэглэгч хайх</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }] }>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surfaceVariant }] }>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Нэр, имэйл хайх..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoFocus
            keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.clearSearch}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {searchQuery ? (
        // Search Results
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <ActivityIndicator size="large" color="#000000" />
              </View>
            </View>
          ) : searchResults.length === 0 && searchQuery ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Хэрэглэгч олдсонгүй</Text>
              <Text style={styles.emptySubtitle}>
                Өөр нэрээр хайж үзээрэй
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        // Following List
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Дагагчид</Text>
            <Text style={styles.sectionSubtitle}>
              Дагасан хүмүүстэйгээ чат эхлүүлээрэй
            </Text>
          </View>

          {loadingFollowing ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <ActivityIndicator size="large" color="#000000" />
              </View>
            </View>
          ) : following.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Дагагч байхгүй</Text>
              <Text style={styles.emptySubtitle}>
                Хэрэглэгчдийг хайж дагаарай
              </Text>
            </View>
          ) : (
            <FlatList
              data={following}
              renderItem={renderFollowingItem}
              keyExtractor={(item) => item._id}
              numColumns={2}
              style={styles.followingList}
              columnWrapperStyle={styles.followingRow}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
    </>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearSearch: {
    marginLeft: 8,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
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
  resultsList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  chatButton: {
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonDisabled: {
    backgroundColor: '#666',
  },
  followingList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  followingRow: {
    justifyContent: 'space-between',
  },
  followingItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  followingAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  followingInfo: {
    alignItems: 'center',
    position: 'relative',
  },
  followingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#f8f8f8',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default UserSearchScreen; 
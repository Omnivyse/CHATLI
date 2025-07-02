import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import apiService from '../services/api';

const UserSearchScreen = ({ navigation, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.searchUsers(searchQuery.trim());
      if (response.success) {
        setSearchResults(response.data.users || []);
      } else {
        setError(response.message || 'Хэрэглэгч хайхад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Search users error:', error);
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (selectedUser) => {
    try {
      setLoading(true);
      const response = await apiService.createChat({
        participants: [selectedUser._id],
        type: 'private'
      });

      if (response.success) {
        const chat = response.data.chat;
        navigation.navigate('Chat', {
          chatId: chat._id,
          chatTitle: selectedUser.name,
          user: user
        });
        Toast.show({
          type: 'success',
          text1: 'Амжилттай',
          text2: `${selectedUser.name}-тай чат эхэллээ`,
        });
      }
    } catch (error) {
      console.error('Create chat error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Чат үүсгэхэд алдаа гарлаа',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item: searchedUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChat(searchedUser)}
      disabled={loading}
    >
      <View style={styles.avatarContainer}>
        {searchedUser.avatar ? (
          <Image source={{ uri: searchedUser.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#666666" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{searchedUser.name}</Text>
        <Text style={styles.userUsername}>@{searchedUser.username}</Text>
        {searchedUser.bio && (
          <Text style={styles.userBio} numberOfLines={1}>
            {searchedUser.bio}
          </Text>
        )}
      </View>
      <View style={styles.actionContainer}>
        <Ionicons name="chatbubble-outline" size={20} color="#000000" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#cccccc" />
          <Text style={styles.emptyTitle}>Хэрэглэгч хайх</Text>
          <Text style={styles.emptySubtitle}>
            Нэр эсвэл хэрэглэгчийн нэрээр хайна уу
          </Text>
        </View>
      );
    }

    if (searchQuery.trim().length > 0 && searchResults.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#cccccc" />
          <Text style={styles.emptyTitle}>Хэрэглэгч олдсонгүй</Text>
          <Text style={styles.emptySubtitle}>
            "{searchQuery}" гэсэн хайлтад тохирох хэрэглэгч олдсонгүй
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Алдаа гарлаа</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={searchUsers}>
        <Text style={styles.retryButtonText}>Дахин оролдох</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Хэрэглэгч хайх..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#cccccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Хайж байна...</Text>
          </View>
        )}

        {error && !loading && renderError()}

        {!loading && !error && (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={searchResults.length === 0 ? styles.emptyList : undefined}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
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
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  userBio: {
    fontSize: 12,
    color: '#999999',
  },
  actionContainer: {
    padding: 8,
  },
});

export default UserSearchScreen; 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import apiService from '../services/api';

const PostFeedScreen = ({ navigation, user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError('');
    
    try {
      const response = await apiService.getPosts();
      if (response.success) {
        setPosts(response.data.posts);
      } else {
        setError(response.message || 'Пост татахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Load posts error:', error);
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  const navigateToCreatePost = () => {
    navigation.navigate('CreatePost', { user });
  };

  const renderPostItem = ({ item: post }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <Text style={styles.authorName}>{post.author?.name || 'Unknown'}</Text>
        <Text style={styles.postDate}>
          {new Date(post.createdAt).toLocaleDateString('mn-MN')}
        </Text>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color="#666666" />
          <Text style={styles.actionText}>{post.likes?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666666" />
          <Text style={styles.actionText}>{post.comments?.length || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#cccccc" />
      <Text style={styles.emptyTitle}>Пост байхгүй байна</Text>
      <Text style={styles.emptySubtitle}>
        Анхны постоо үүсгэхийн тулд доорх товчийг дарна уу
      </Text>
      <TouchableOpacity style={styles.createPostButton} onPress={navigateToCreatePost}>
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.createPostButtonText}>Пост үүсгэх</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Алдаа гарлаа</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadPosts()}>
        <Text style={styles.retryButtonText}>Дахин оролдох</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Пост ачаалж байна...</Text>
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
        <Text style={styles.headerTitle}>Фийд</Text>
        <TouchableOpacity style={styles.createPostIconButton} onPress={navigateToCreatePost}>
          <Ionicons name="add-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.postsList}
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
  createPostIconButton: {
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
  postsList: {
    padding: 16,
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
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  postItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  postDate: {
    fontSize: 12,
    color: '#666666',
  },
  postContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666666',
  },
});

export default PostFeedScreen; 
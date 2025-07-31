import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Post from '../components/Post';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

const PostFeedScreen = ({ navigation, user, onGoToVerification }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef(null);

  const fetchPosts = async (pageNum = 1, isRefresh = false) => {
    try {
      setError(null);
      
      console.log('🔍 FetchPosts - User state:', {
        userExists: !!user,
        emailVerified: user?.emailVerified,
        userId: user?._id
      });
      
      // If user is not verified, don't fetch posts to avoid auth errors
      if (user && !user.emailVerified) {
        console.log('⚠️ User not verified, skipping posts fetch');
        setPosts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('📡 Fetching posts...');
      const response = await apiService.getPosts(pageNum);
      
      if (response.success) {
        const newPosts = response.data.posts || [];
        console.log('✅ Posts fetched successfully:', newPosts.length, 'posts');
        
        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMore(newPosts.length > 0);
        setPage(pageNum);
      } else {
        console.log('❌ Posts fetch failed:', response.message);
        setError(response.message || 'Постуудыг ачаалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      
      // Handle authentication errors for unverified users
      if (error.message && error.message.includes('Нэвтрэх эрх дууссан')) {
        if (user && !user.emailVerified) {
          setError('Имэйл хаягаа баталгаажуулна уу');
        } else {
          setError('Нэвтрэх эрх дууссан. Дахин нэвтэрнэ үү.');
        }
      } else {
        setError('Серверийн алдаа гарлаа');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, user?.emailVerified]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchPosts(page + 1);
    }
  };

  const handlePostAction = async (postId, action, data = {}) => {
    try {
      // If user is not verified, show verification prompt
      if (user && !user.emailVerified) {
        Alert.alert(
          'Имэйл баталгаажуулалт',
          'Энэ үйлдлийг хийхийн тулд имэйл хаягаа баталгаажуулна уу',
          [
            { text: 'Цуцлах', style: 'cancel' },
            { text: 'Баталгаажуулах', onPress: () => onGoToVerification && onGoToVerification() }
          ]
        );
        return;
      }

      let response;
      switch (action) {
        case 'like':
          response = await apiService.likePost(postId);
          break;
        case 'comment':
          response = await apiService.commentOnPost(postId, data.content);
          break;
        case 'delete':
          response = await apiService.deletePost(postId);
          break;
        default:
          return;
      }

      if (response.success) {
        // Refresh posts to show updated data
        handleRefresh();
        Toast.show({
          type: 'success',
          text1: 'Амжилттай',
          text2: action === 'like' ? 'Лайк хийгдлээ' : 
                 action === 'comment' ? 'Сэтгэгдэл нэмэгдлээ' : 'Пост устгагдлаа'
        });
      }
    } catch (error) {
      console.error('Post action error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: 'Дахин оролдоно уу'
      });
    }
  };

  const renderPost = ({ item }) => (
    <Post
      post={item}
      currentUser={user}
      onLike={() => handlePostAction(item._id, 'like')}
      onComment={(content) => handlePostAction(item._id, 'comment', { content })}
      onDelete={() => handlePostAction(item._id, 'delete')}
      navigation={navigation}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Постуудыг ачаалж байна...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show different messages based on user verification status
    if (user && !user.emailVerified) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Имэйл хаягаа баталгаажуулна уу</Text>
          <Text style={styles.emptySubtext}>Постуудыг харахын тулд имэйл хаягаа баталгаажуулна уу</Text>
        </View>
      );
    }

    // Show welcome message for new users or when no posts exist
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Тавтай морил!</Text>
        <Text style={styles.emptySubtext}>
          {posts.length === 0 
            ? 'Одоогоор постууд байхгүй байна. Эхний постоо үүсгэж эхлээрэй!' 
            : 'Постуудыг харахын тулд дээрээс доош чирнэ үү'
          }
        </Text>
        <TouchableOpacity 
          style={styles.createPostButton} 
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostButtonText}>Пост үүсгэх</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingMoreText, { color: colors.textSecondary }]}>
                Илүү ихийг ачаалж байна...
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  verifyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createPostButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    minWidth: 200,
    alignItems: 'center',
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default PostFeedScreen; 
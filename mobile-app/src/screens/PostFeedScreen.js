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
      
      // If user is not verified, don't fetch posts to avoid auth errors
      if (user && !user.emailVerified) {
        setPosts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await apiService.getPosts(pageNum);
      
      if (response.success) {
        const newPosts = response.data.posts || [];
        
        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMore(newPosts.length > 0);
        setPage(pageNum);
      } else {
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
  }, [user]);

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
    if (user && !user.emailVerified) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="mail-unread" size={64} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Имэйл хаягаа баталгаажуулна уу
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Постуудыг харахын тулд имэйл хаягаа баталгаажуулна уу
          </Text>
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: colors.primary }]}
            onPress={() => onGoToVerification && onGoToVerification()}
          >
            <Text style={[styles.verifyButtonText, { color: colors.textInverse }]}>
              Баталгаажуулах
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Постуудыг ачаалж байна...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Алдаа гарлаа
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>
              Дахин оролдох
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="document-text" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Пост байхгүй байна
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Эхний пост үүсгэж эхлээрэй
        </Text>
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
});

export default PostFeedScreen; 
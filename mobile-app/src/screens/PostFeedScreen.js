import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../services/api';
import Post from '../components/Post';

const PostFeedScreen = ({ user, navigation }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const fetchPosts = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    
    try {
      const response = await apiService.getPosts();
      if (response.success) {
        setPosts(response.data.posts);
      } else {
        setError(response.message || 'Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      setError('Сүлжээний алдаа гарлаа');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  const handlePostUpdate = () => {
    fetchPosts();
  };

  // Get responsive styles based on current dimensions
  const getResponsiveStyles = () => {
    const { width, height } = dimensions;
    const isTablet = width >= 768;
    const isLandscape = width > height;
    const isSmallPhone = width < 375;

    return {
      headerPadding: isTablet ? 24 : isSmallPhone ? 16 : 20,
      scrollPadding: isTablet ? 16 : isSmallPhone ? 6 : 8,
      fabSize: isTablet ? 64 : 56,
      fabBottom: isTablet ? 50 : isLandscape ? 10 : 20,
      fabRight: isTablet ? 24 : isSmallPhone ? 16 : 20,
      appNameSize: isTablet ? 28 : isSmallPhone ? 20 : 24,
      searchButtonSize: isTablet ? 28 : 24,
      maxContentWidth: isTablet ? 600 : width,
    };
  };

  const responsiveStyles = getResponsiveStyles();

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <View style={[styles.loadingSpinner, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Пост байхгүй байна</Text>
        </View>
      );
    }

    return (
      <View style={styles.postsContainer}>
        {posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            user={user}
            onPostUpdate={handlePostUpdate}
            navigation={navigation}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        paddingHorizontal: responsiveStyles.headerPadding,
        maxWidth: responsiveStyles.maxContentWidth,
        alignSelf: 'center',
        width: '100%',
        backgroundColor: colors.surface,
        borderBottomColor: colors.border
      }]}>
        <Text style={[styles.appName, { 
          fontSize: responsiveStyles.appNameSize,
          color: colors.text 
        }]}>CHATLI</Text>
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.navigate('UserSearch')}
        >
          <Ionicons name="search" size={responsiveStyles.searchButtonSize} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, {
          paddingHorizontal: responsiveStyles.scrollPadding,
          maxWidth: responsiveStyles.maxContentWidth,
          alignSelf: 'center',
          width: '100%'
        }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, {
          width: responsiveStyles.fabSize,
          height: responsiveStyles.fabSize,
          borderRadius: responsiveStyles.fabSize / 2,
          bottom: responsiveStyles.fabBottom,
          right: responsiveStyles.fabRight,
          backgroundColor: colors.primary,
        }]}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="add" 
          size={responsiveStyles.fabSize > 56 ? 32 : 28} 
          color={colors.textInverse} 
        />
      </TouchableOpacity>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  appName: {
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 20, // Reduced padding for bottom tab navigator
  },
  postsContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
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
  errorText: {
    fontSize: 16,
    color: '#ef4444', // red-500
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b', // text-secondary
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default PostFeedScreen; 
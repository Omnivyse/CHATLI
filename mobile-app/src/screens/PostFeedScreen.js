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
  Modal,
  Animated,
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
  
  // Dropdown and filter states
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState('latest'); // 'latest', 'top'
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all', 'week', 'month'
  const [dropdownAnimation] = useState(new Animated.Value(0));

  const fetchPosts = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    
    try {
      const response = await apiService.getPosts();
      if (response.success) {
        let fetchedPosts = response.data.posts;
        
        // Apply sorting based on selected feed type
        if (selectedFeed === 'top') {
          fetchedPosts = sortPostsByReactions(fetchedPosts);
        }
        
        // Apply time period filter
        if (selectedPeriod !== 'all') {
          fetchedPosts = filterPostsByPeriod(fetchedPosts, selectedPeriod);
        }
        
        setPosts(fetchedPosts);
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

  // Sort posts by reactions (likes + comments)
  const sortPostsByReactions = (postsToSort) => {
    return [...postsToSort].sort((a, b) => {
      const aReactions = (a.likes?.length || 0) + (a.comments?.length || 0);
      const bReactions = (b.likes?.length || 0) + (b.comments?.length || 0);
      return bReactions - aReactions; // Highest first
    });
  };

  // Filter posts by time period
  const filterPostsByPeriod = (postsToFilter, period) => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (period) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return postsToFilter;
    }
    
    return postsToFilter.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= filterDate;
    });
  };

  useEffect(() => {
    fetchPosts();
    
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, [selectedFeed, selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  // Animate dropdown
  useEffect(() => {
    Animated.timing(dropdownAnimation, {
      toValue: showDropdown ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showDropdown]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  const handlePostUpdate = () => {
    fetchPosts();
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const selectFeed = (feedType) => {
    setSelectedFeed(feedType);
    setShowDropdown(false);
    fetchPosts();
  };

  const selectPeriod = (period) => {
    setSelectedPeriod(period);
    fetchPosts();
  };

  const getFeedTitle = () => {
    if (selectedFeed === 'top') {
      return 'Top Feeds';
    }
    return 'CHATLI';
  };

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case 'week':
        return '7 хоног';
      case 'month':
        return '1 сар';
      default:
        return 'Бүх';
    }
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
    // Debug: Check if user prop is valid
    if (!user || typeof user !== 'object') {
      console.warn('PostFeedScreen: Invalid user prop:', user);
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            User data is invalid
          </Text>
        </View>
      );
    }

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
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error && typeof error === 'string' ? error : 'Алдаа гарлаа'}
          </Text>
        </View>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Пост байхгүй байна</Text>
        </View>
      );
    }

    // Debug: Check posts data
    const validPosts = posts.filter(post => {
      if (!post || typeof post !== 'object') {
        console.warn('PostFeedScreen: Invalid post:', post);
        return false;
      }
      if (!post._id || typeof post._id !== 'string') {
        console.warn('PostFeedScreen: Post missing _id:', post);
        return false;
      }
      if (!post.author || typeof post.author !== 'object') {
        console.warn('PostFeedScreen: Post missing author:', post);
        return false;
      }
      return true;
    });

    if (validPosts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No valid posts to show</Text>
        </View>
      );
    }

    return (
      <View style={styles.postsContainer}>
        {validPosts.map((post) => (
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
        {/* CHATLI Title with Dropdown */}
        <TouchableOpacity 
          style={styles.titleContainer}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <Text style={[styles.appName, { 
            fontSize: responsiveStyles.appNameSize,
            color: colors.text 
          }]}>{getFeedTitle()}</Text>
          <Ionicons 
            name={showDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.text} 
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>



        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.navigate('UserSearch')}
        >
          <Ionicons name="search" size={responsiveStyles.searchButtonSize} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Backdrop for closing dropdowns */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            setShowDropdown(false);
          }}
        />
      )}

      {/* Dropdown Menu */}
      <Animated.View 
        style={[
          styles.dropdown,
          {
            opacity: dropdownAnimation,
            transform: [{
              translateY: dropdownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              })
            }],
            backgroundColor: colors.surface,
            borderColor: colors.border,
            position: 'absolute',
            top: 80, // Position below header
            left: responsiveStyles.headerPadding,
            right: responsiveStyles.headerPadding,
            zIndex: 9999,
            maxWidth: responsiveStyles.maxContentWidth,
            alignSelf: 'center',
          }
        ]}
        pointerEvents={showDropdown ? 'auto' : 'none'}
      >
        <TouchableOpacity 
          style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
          onPress={() => selectFeed('latest')}
          activeOpacity={0.7}
        >
          <Ionicons name="time" size={20} color={colors.text} />
          <Text style={[styles.dropdownItemText, { color: colors.text }]}>Latest Posts</Text>
          {selectedFeed === 'latest' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
          onPress={() => selectFeed('top')}
          activeOpacity={0.7}
        >
          <Ionicons name="trending-up" size={20} color={colors.text} />
          <Text style={[styles.dropdownItemText, { color: colors.text }]}>Top Feeds</Text>
          {selectedFeed === 'top' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
          onPress={() => {
            setShowDropdown(false);
            // Navigate to Events (you can implement this)
            Alert.alert('Events', 'Events functionality will be implemented here');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={20} color={colors.text} />
          <Text style={[styles.dropdownItemText, { color: colors.text }]}>Events</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Time Category Filter - Fixed at top */}
      {selectedFeed === 'top' && (
        <View style={[styles.timeFilterContainer, { 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border 
        }]}>
          <View style={[styles.timeFilterContent, {
            maxWidth: responsiveStyles.maxContentWidth,
            alignSelf: 'center',
            width: '100%',
            paddingHorizontal: responsiveStyles.headerPadding,
          }]}>
            <TouchableOpacity 
              style={[
                styles.timeFilterButton,
                selectedPeriod === 'all' && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary 
                },
                { borderColor: colors.border }
              ]}
              onPress={() => selectPeriod('all')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeFilterButtonText,
                { color: selectedPeriod === 'all' ? colors.textInverse : colors.text }
              ]}>
                Бүх
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.timeFilterButton,
                selectedPeriod === 'week' && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary 
                },
                { borderColor: colors.border }
              ]}
              onPress={() => selectPeriod('week')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeFilterButtonText,
                { color: selectedPeriod === 'week' ? colors.textInverse : colors.text }
              ]}>
                7 хоног
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.timeFilterButton,
                selectedPeriod === 'month' && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary 
                },
                { borderColor: colors.border }
              ]}
              onPress={() => selectPeriod('month')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeFilterButtonText,
                { color: selectedPeriod === 'month' ? colors.textInverse : colors.text }
              ]}>
                1 сар
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
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
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    position: 'relative',
    zIndex: 9997,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  appName: {
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
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
  dropdown: {
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 200,
    marginHorizontal: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 56,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 9998,
  },
  timeFilterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
  },
  timeFilterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PostFeedScreen; 
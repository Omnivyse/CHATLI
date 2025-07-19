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
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);
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
    setShowPeriodFilter(false);
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

    if (!posts || posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Пост байхгүй байна</Text>
        </View>
      );
    }

    return (
      <View style={styles.postsContainer}>
        {Array.isArray(posts) && posts.filter(post => post && post._id && post.author).length > 0 ? (
          posts.filter(post => post && post._id && post.author).map((post) => (
            <Post
              key={post._id}
              post={post}
              user={user}
              onPostUpdate={handlePostUpdate}
              navigation={navigation}
            />
          ))
        ) : (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts to show</Text>
          </View>
        )}
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

        {/* Period Filter Button */}
        {selectedFeed === 'top' && (
          <TouchableOpacity 
            style={[styles.periodButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => setShowPeriodFilter(!showPeriodFilter)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodButtonText, { color: colors.text }]}>
              {getPeriodTitle()}
            </Text>
            <Ionicons 
              name={showPeriodFilter ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.text} 
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.navigate('UserSearch')}
        >
          <Ionicons name="search" size={responsiveStyles.searchButtonSize} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Backdrop for closing dropdowns */}
      {(showDropdown || showPeriodFilter) && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            setShowDropdown(false);
            setShowPeriodFilter(false);
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
            left: 0,
            right: 0,
            zIndex: 9999,
          }
        ]}
        pointerEvents={showDropdown ? 'auto' : 'none'}
      >
        <TouchableOpacity 
          style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
          onPress={() => selectFeed('latest')}
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
        >
          <Ionicons name="trending-up" size={20} color={colors.text} />
          <Text style={[styles.dropdownItemText, { color: colors.text }]}>Top Feeds</Text>
          {selectedFeed === 'top' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dropdownItem}
          onPress={() => {
            setShowDropdown(false);
            // Navigate to Event update code (you can implement this)
            Alert.alert('Event Update', 'Event update code functionality will be implemented here');
          }}
        >
          <Ionicons name="code" size={20} color={colors.text} />
          <Text style={[styles.dropdownItemText, { color: colors.text }]}>Event Update Code</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Period Filter Dropdown */}
      {showPeriodFilter && selectedFeed === 'top' && (
        <Animated.View 
          style={[
            styles.periodDropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              position: 'absolute',
              top: 80, // Position below header
              left: 0,
              right: 0,
              zIndex: 9999,
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.periodDropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => selectPeriod('all')}
          >
            <Text style={[styles.periodDropdownItemText, { color: colors.text }]}>Бүх</Text>
            {selectedPeriod === 'all' && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.periodDropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => selectPeriod('week')}
          >
            <Text style={[styles.periodDropdownItemText, { color: colors.text }]}>7 хоног</Text>
            {selectedPeriod === 'week' && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.periodDropdownItem}
            onPress={() => selectPeriod('month')}
          >
            <Text style={[styles.periodDropdownItemText, { color: colors.text }]}>1 сар</Text>
            {selectedPeriod === 'month' && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </Animated.View>
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
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 10,
  },
  periodButtonText: {
    fontSize: 14,
    marginRight: 5,
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 50,
  },
  dropdownItemText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  periodDropdown: {
    zIndex: 9999,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
    maxHeight: 150,
  },
  periodDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 45,
  },
  periodDropdownItemText: {
    fontSize: 16,
    marginLeft: 10,
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
});

export default PostFeedScreen; 
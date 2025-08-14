import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Post from '../components/Post';
import Event from '../components/Event';
import EventCreationModal from '../components/EventCreationModal';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigationState } from '../contexts/NavigationContext';
import { useBottomTab } from '../contexts/BottomTabContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

const PostFeedScreen = ({ navigation, user, onGoToVerification }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { updateNavigationState } = useNavigationState();
  const { updateBottomTabVisibility, showBottomTab } = useBottomTab();
  const colors = getThemeColors(theme);
  const [posts, setPosts] = useState([]);
  const [topWeeklyPosts, setTopWeeklyPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('CHATLI');
  const [showEventModal, setShowEventModal] = useState(false);
  const [topPostsLastUpdated, setTopPostsLastUpdated] = useState(null);
  const flatListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const safeScrollHandler = (event) => {
    try {
      // Persist the event to prevent it from being reused
      event.persist();
      
      // Check if event and nativeEvent exist to prevent errors
      if (!event || !event.nativeEvent || !event.nativeEvent.contentOffset) {
        return;
      }
      
      const currentScrollY = event.nativeEvent.contentOffset.y;
      
      // Validate scroll position
      if (typeof currentScrollY !== 'number' || isNaN(currentScrollY)) {
        return;
      }
      
      // Show bottom tab immediately when at the top or very close to top
      if (currentScrollY <= 50) {
        showBottomTab();
      } else {
        // Update visibility for all other scrolls
        updateBottomTabVisibility(currentScrollY);
      }
    } catch (error) {
      // Silently handle any scroll errors to prevent crashes
      console.warn('Scroll handler error:', error);
    }
  };

  const debouncedScrollHandler = (event) => {
    // Check if event exists before processing
    if (!event) {
      return;
    }
    
    // Persist the event immediately to prevent synthetic event issues
    event.persist();
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      safeScrollHandler(event);
    }, 10); // Very short delay for responsiveness
  };

  // Alternative scroll handler that doesn't use debouncing to avoid synthetic event issues
  const directScrollHandler = (event) => {
    try {
      // Persist the event immediately
      event.persist();
      
      // Check if event and nativeEvent exist
      if (!event || !event.nativeEvent || !event.nativeEvent.contentOffset) {
        return;
      }
      
      const currentScrollY = event.nativeEvent.contentOffset.y;
      
      // Validate scroll position
      if (typeof currentScrollY !== 'number' || isNaN(currentScrollY)) {
        return;
      }
      
      // Show bottom tab immediately when at the top or very close to top
      if (currentScrollY <= 50) {
        showBottomTab();
      } else {
        // Update visibility for all other scrolls
        updateBottomTabVisibility(currentScrollY);
      }
    } catch (error) {
      // Silently handle any scroll errors to prevent crashes
      console.warn('Direct scroll handler error:', error);
    }
  };

  const removeDuplicatePosts = (postsArray) => {
    if (!Array.isArray(postsArray)) {
      return [];
    }
    const seen = new Set();
    return postsArray.filter(post => {
      if (!post || !post._id || seen.has(post._id)) {
        return false;
      }
      seen.add(post._id);
      return true;
    });
  };

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
        
        // Debug: Log first post structure
        if (newPosts.length > 0) {
          console.log('🔍 First post structure:', {
            id: newPosts[0]._id,
            author: newPosts[0].author,
            content: newPosts[0].content?.substring(0, 50) + '...',
            hasAuthor: !!newPosts[0].author,
            authorType: typeof newPosts[0].author
          });
        }
        
        if (isRefresh || pageNum === 1) {
          setPosts(removeDuplicatePosts(newPosts));
        } else {
          setPosts(prev => removeDuplicatePosts([...prev, ...newPosts]));
        }
        
        setHasMore(newPosts.length > 0);
        setPage(pageNum);
      } else {
        console.log('❌ Posts fetch failed:', response.message);
        setError(response.message || getTranslation('postsLoadError', language));
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      
      // Handle authentication errors for unverified users
      if (error.message && error.message.includes('Нэвтрэх эрх дууссан')) {
        if (user && !user.emailVerified) {
          setError('Please verify your email address');
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

  const fetchTopWeeklyPosts = async () => {
    try {
      console.log('📡 Fetching top weekly posts...');
      const response = await apiService.getTopWeeklyPosts();
      
      if (response.success) {
        const newTopPosts = response.data.posts || [];
        console.log('✅ Top weekly posts fetched successfully:', newTopPosts.length, 'posts');
        
        setTopWeeklyPosts(removeDuplicatePosts(newTopPosts));
        setTopPostsLastUpdated(new Date());
        
        // Log week info for debugging
        if (response.data.weekInfo) {
          console.log('📅 Week info:', response.data.weekInfo);
        }
      } else {
        console.log('❌ Top weekly posts fetch failed:', response.message);
        // Don't set error state, just log it
      }
    } catch (error) {
      console.error('Fetch top weekly posts error:', error);
      // Don't set error for top posts, just log it and keep existing data
      // This prevents the error from breaking the main feed functionality
    }
  };

  const shouldRefreshTopPosts = () => {
    if (!topPostsLastUpdated) return true;
    
    const now = new Date();
    const lastUpdate = new Date(topPostsLastUpdated);
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    
    // Refresh if it's been more than 7 days or if it's a new week
    const isNewWeek = now.getDay() === 1 && daysSinceUpdate >= 1; // Monday
    const isOverWeek = daysSinceUpdate >= 7;
    
    return isNewWeek || isOverWeek;
  };

  useEffect(() => {
    fetchPosts();
    // Update navigation state when post feed screen is focused
    updateNavigationState('PostFeed', null);
    updateBottomTabVisibility(true); // Ensure tab is visible on mount
    
    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, [user, user?.emailVerified, updateNavigationState, updateBottomTabVisibility]);

  useEffect(() => {
    fetchEvents();
  }, [user, user?.emailVerified]);

  useEffect(() => {
    // Fetch top posts on mount and when user changes
    if (user && user.emailVerified) {
      fetchTopWeeklyPosts();
    }
  }, [user, user?.emailVerified]);

  // Check for weekly refresh every time the component mounts or user changes
  useEffect(() => {
    if (user && user.emailVerified && shouldRefreshTopPosts()) {
      console.log('🔄 Refreshing top posts due to weekly refresh...');
      fetchTopWeeklyPosts();
    }
  }, [user, user?.emailVerified]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, true);
    
    // Also refresh top posts on manual refresh
    if (user && user.emailVerified) {
      fetchTopWeeklyPosts();
    }
  };

  const handleLoadMore = () => {
    // Don't load more if we're in a filtered view with no posts
    const filteredPosts = getFilteredPosts();
    if (selectedFilter !== 'CHATLI' && filteredPosts.length === 0) {
      return; // Don't load more for empty filtered views
    }
    
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchPosts(page + 1);
    }
  };

  const handleScrollBeginDrag = () => {
    // Show bottom tab when user starts scrolling
    showBottomTab();
  };

  const handleScrollEndDrag = () => {
    // Optional: Add any logic when user stops scrolling
  };

  const handleScreenTap = () => {
    // Show bottom tab when user taps on the screen
    showBottomTab();
    
    // Close dropdown if it's open
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  // Filter posts based on selected filter
  const getFilteredPosts = () => {
    console.log('🔍 getFilteredPosts called with filter:', selectedFilter);
    console.log('📊 Data counts - posts:', posts.length, 'events:', events.length, 'topWeeklyPosts:', topWeeklyPosts.length);
    
    if (selectedFilter === 'Events') {
      // Return events for Events filter
      const filteredEvents = removeDuplicatePosts(events);
      console.log('📅 Events filter - returning events:', filteredEvents.length);
      return filteredEvents;
    }
    
    let filteredPosts = [];
    
    if (selectedFilter === 'CHATLI') {
      filteredPosts = posts; // Show all posts
      console.log('🏠 CHATLI filter - returning posts:', filteredPosts.length);
    } else if (selectedFilter === 'Top Feeds') {
      // Use the top weekly posts data, fallback to regular posts if empty
      if (topWeeklyPosts.length > 0) {
        filteredPosts = topWeeklyPosts;
        console.log('⭐ Top Feeds filter - using top weekly posts:', filteredPosts.length);
      } else {
        // Fallback: show posts with high engagement from regular posts
        filteredPosts = posts.filter(post => {
          const engagement = (post.likes?.length || 0) + (post.comments?.length || 0);
          return engagement >= 3; // Posts with 3+ total interactions
        });
        console.log('⭐ Top Feeds filter - fallback to high engagement posts:', filteredPosts.length);
      }
    } else {
      filteredPosts = posts;
      console.log('❓ Unknown filter - returning posts:', filteredPosts.length);
    }
    
    // Remove duplicates based on _id
    const finalPosts = removeDuplicatePosts(filteredPosts);
    console.log('✅ Final filtered posts count:', finalPosts.length);
    return finalPosts;
  };

  const handlePostAction = async (postId, action, data = {}) => {
    try {
      // If user is not verified, show verification prompt
      if (user && !user.emailVerified) {
        Alert.alert(
          'Email Verification',
          'Please verify your email address to perform this action',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify', onPress: onGoToVerification }
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
                 action === 'comment' ? 'Comment added' : 'Post deleted'
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

  // Event-related functions
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await apiService.createEvent(eventData);
      
      if (response.success) {
        // Refresh events to show the new event
        fetchEvents();
      } else {
        throw new Error(response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Create event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Failed to create event'
      });
      throw error;
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await apiService.getEvents();
      if (response.success) {
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.error('Fetch events error:', error);
    }
  };

  const handleJoinEvent = async (eventId, password = null) => {
    try {
      const response = await apiService.joinEvent(eventId, password);
      
      if (response.success) {
        // Refresh events to show updated data
        fetchEvents();
      } else {
        throw new Error(response.message || 'Failed to join event');
      }
    } catch (error) {
      console.error('Join event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Failed to join event'
      });
      throw error;
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      const response = await apiService.leaveEvent(eventId);
      
      if (response.success) {
        // Refresh events to show updated data
        fetchEvents();
      } else {
        throw new Error(response.message || 'Failed to leave event');
      }
    } catch (error) {
      console.error('Leave event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Failed to leave event'
      });
      throw error;
    }
  };

  const handleKickEventUser = async (eventId, userId) => {
    try {
      const response = await apiService.kickEventUser(eventId, userId);

      if (response.success) {
        // Refresh events to show updated data
        fetchEvents();
      } else {
        throw new Error(response.message || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Kick event user error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Failed to remove user'
      });
      throw error;
    }
  };

  const handleLikeEvent = async (eventId) => {
    try {
      const response = await apiService.likeEvent(eventId);
      
      if (response.success) {
        // Refresh events to show updated data
        fetchEvents();
      } else {
        throw new Error(response.message || 'Лайк хийхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Like event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Лайк хийхэд алдаа гарлаа'
      });
      throw error;
    }
  };

  const handleCommentEvent = async (eventId, commentText) => {
    try {
      const response = await apiService.commentOnEvent(eventId, commentText);
      if (response.success) {
        // Refresh events to show the new comment
        await fetchEvents();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Алдаа',
          text2: response.message || 'Сэтгэгдэл бичихэд алдаа гарлаа'
        });
      }
    } catch (error) {
      console.error('Comment event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Сэтгэгдэл бичихэд алдаа гарлаа'
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await apiService.deleteEvent(eventId);
      if (response.success) {
        // Remove the deleted event from the events list
        setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Алдаа',
          text2: response.message || 'Failed to delete event'
        });
      }
    } catch (error) {
      console.error('Delete event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Event устгахад алдаа гарлаа'
      });
    }
  };

  const renderEvent = ({ item }) => (
    <Event
      event={item}
      user={user}
      onJoinEvent={handleJoinEvent}
      onLeaveEvent={handleLeaveEvent}
      onLikeEvent={handleLikeEvent}
      onCommentEvent={handleCommentEvent}
      onDeleteEvent={handleDeleteEvent}
      onKickEventUser={handleKickEventUser}
      navigation={navigation}
    />
  );

  const renderPost = ({ item: post, index }) => {
    // If Events filter is selected, render Event component
    if (selectedFilter === 'Events') {
      return (
        <Event
          event={post}
          user={user}
          onJoinEvent={handleJoinEvent}
          onLeaveEvent={handleLeaveEvent}
          onLikeEvent={handleLikeEvent}
          onCommentEvent={handleCommentEvent}
          onDeleteEvent={handleDeleteEvent}
          onKickEventUser={handleKickEventUser}
          navigation={navigation}
        />
      );
    }
    
    // Otherwise render Post component
    return (
      <Post
        post={post}
        user={user}
        onPostUpdate={() => handleRefresh()}
        navigation={navigation}
      />
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.emptyText}>
            {selectedFilter === 'Events' ? 'Loading events...' : 
             selectedFilter === 'Top Feeds' ? 'Loading top posts...' : 'Loading posts...'}
          </Text>
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
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'Events' ? 'Event-үүдийг харахын тулд имэйл хаягаа баталгаажуулна уу' : 
             selectedFilter === 'Top Feeds' ? 'Top posts-ийг харахын тулд имэйл хаягаа баталгаажуулна уу' :
             'Постуудыг харахын тулд имэйл хаягаа баталгаажуулна уу'}
          </Text>
        </View>
      );
    }

    // Show welcome message for new users or when no content exists
    const isEventsFilter = selectedFilter === 'Events';
    const isTopFeedsFilter = selectedFilter === 'Top Feeds';
    const filteredData = getFilteredPosts();
    const hasContent = filteredData.length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Тавтай морил!</Text>
        <Text style={styles.emptySubtext}>
          {!hasContent 
            ? (isEventsFilter 
                ? 'Одоогоор event-үүд байхгүй байна. Эхний event-ээ үүсгэж эхлээрэй!' 
                : isTopFeedsFilter
                ? 'Одоогоор энэ долоо хоногт лайктай постууд байхгүй байна. Постуудаа лайк хийж эхлээрэй!'
                : 'Одоогоор постууд байхгүй байна. Эхний постоо үүсгэж эхлээрэй!')
            : (isEventsFilter 
                ? 'Event-үүдийг харахын тулд дээрээс доош чирнэ үү'
                : isTopFeedsFilter
                ? 'Энэ долоо хоногийн хамгийн лайктай постуудыг харахын тулд дээрээс доош чирнэ үү'
                : 'Постуудыг харахын тулд дээрээс доош чирнэ үү')
          }
        </Text>
        <TouchableOpacity 
          style={styles.createPostButton} 
          onPress={() => isEventsFilter ? setShowEventModal(true) : navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostButtonText}>
            {isEventsFilter ? 'Create Event' : 'Create Post'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={[styles.content, { backgroundColor: 'transparent' }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.titleContainer}
                onPress={() => {
                  // Small delay to ensure proper state update
                  setTimeout(() => setShowDropdown(!showDropdown), 50);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerTitle, { color: colors.text }]}>{selectedFilter}</Text>
                {selectedFilter === 'Top Feeds' && topPostsLastUpdated && (
                  <Text style={[styles.weekInfo, { color: colors.textSecondary }]}>
                    {`Week of ${new Date(topPostsLastUpdated).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}`}
                  </Text>
                )}
                <Ionicons 
                  name={showDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.text} 
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedFilter('CHATLI');
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>CHATLI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedFilter('Top Feeds');
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>Top Feeds</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedFilter('Events');
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>Events</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => navigation.navigate('UserSearch')}
              >
                <Ionicons name="search" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {topWeeklyPosts.length > 0 && selectedFilter === 'Top Feeds' && (
            <View style={[styles.topPostsSection, { marginTop: 4 }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {getTranslation('topWeeklyPosts', language) || 'Top Weekly Posts'}
              </Text>
              <FlatList
                data={removeDuplicatePosts(topWeeklyPosts)}
                renderItem={({ item }) => (
                  <Post
                    post={item}
                    user={user}
                    onPostUpdate={() => handleRefresh()}
                    isTopPost={true}
                  />
                )}
                keyExtractor={(item, index) => `top-${item._id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topPostsContainer}
                onScroll={directScrollHandler}
                scrollEventThrottle={32}
              />
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={getFilteredPosts()}
            renderItem={renderPost}
            keyExtractor={(item, index) => `post-${item._id}-${index}`}
            style={styles.postsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            onEndReached={selectedFilter === 'CHATLI' ? handleLoadMore : null}
            onEndReachedThreshold={selectedFilter === 'CHATLI' ? 0.1 : null}
            onScroll={directScrollHandler}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={32}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              loadingMore && selectedFilter === 'CHATLI' ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text style={[styles.loadingMoreText, { color: colors.textSecondary }]}>
                    Loading more...
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={getFilteredPosts().length === 0 ? styles.emptyListContainer : null}
          />

          {/* Floating Action Button for Add Post/Event */}
          <TouchableOpacity 
            style={[
              styles.fab, 
              { 
                backgroundColor: '#ffffff', 
                borderWidth: 2, 
                borderColor: '#000000',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 8
              }
            ]}
            onPress={() => {
              if (selectedFilter === 'Events') {
                setShowEventModal(true);
              } else {
                navigation.navigate('CreatePost');
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="#000000" />
          </TouchableOpacity>

          {/* Event Creation Modal */}
          <EventCreationModal
            visible={showEventModal}
            onClose={() => setShowEventModal(false)}
            onCreateEvent={handleCreateEvent}
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent', // This will inherit from parent
  },
  header: {
    paddingTop: 20, // Reduced from 40 to make header more compact
    paddingBottom: 12, // Reduced from 16
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9998, // Added to ensure dropdown appears above all content
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0, // Reduced from 16 since header already has padding
    zIndex: 9999, // Added to ensure dropdown appears above all content
  },
  headerTitle: {
    fontSize: 22, // Reduced from 24
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10000, // Added to ensure dropdown trigger appears above all content
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 60, // Increased from 45 to make it visible below the header
    left: 16,
    right: 80,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999, // Increased from 1000 to ensure it appears above all content
  },
  dropdownItem: {
    paddingVertical: 10, // Reduced from 12
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 15, // Reduced from 16
    fontWeight: '500',
  },
  searchButton: {
    padding: 6, // Reduced from 8
  },
  fab: {
    position: 'absolute',
    bottom: 50, // Increased from 20 to move it higher above bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000, // Added to ensure FAB appears above all content
    // Remove theme-dependent shadow properties - they're now inline
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
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    minWidth: 200,
    alignItems: 'center',
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  weekInfo: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
  topPostsSection: {
    marginTop: 4,
    marginBottom: 12, // Reduced from 16
    paddingHorizontal: 16,
    zIndex: 1, // Added to ensure it stays below the dropdown
  },
  sectionTitle: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    marginBottom: 6, // Reduced from 8
  },
  topPostsContainer: {
    paddingVertical: 8,
  },
  postsList: {
    flex: 1,
    zIndex: 1, // Added to ensure it stays below the dropdown
  },
});

export default PostFeedScreen; 
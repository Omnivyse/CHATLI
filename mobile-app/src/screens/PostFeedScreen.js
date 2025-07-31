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

import { Ionicons } from '@expo/vector-icons';
import Post from '../components/Post';
import Event from '../components/Event';
import EventCreationModal from '../components/EventCreationModal';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

const PostFeedScreen = ({ navigation, user, onGoToVerification }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [posts, setPosts] = useState([]);
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

  useEffect(() => {
    fetchEvents();
  }, [user, user?.emailVerified]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, true);
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

  // Filter posts based on selected filter
  const getFilteredPosts = () => {
    if (selectedFilter === 'Events') {
      // Return events for Events filter
      return events;
    }
    
    let filteredPosts = [];
    
    if (selectedFilter === 'CHATLI') {
      filteredPosts = posts; // Show all posts
    } else if (selectedFilter === 'Top Feeds') {
      // Filter posts with high engagement (likes, comments)
      filteredPosts = posts.filter(post => {
        const engagement = (post.likes?.length || 0) + (post.comments?.length || 0);
        return engagement >= 5; // Posts with 5+ total interactions
      });
    } else {
      filteredPosts = posts;
    }
    
    // Remove duplicates based on _id
    const uniquePosts = filteredPosts.filter((post, index, self) => 
      index === self.findIndex(p => p._id === post._id)
    );
    
    return uniquePosts;
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

  // Event-related functions
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await apiService.createEvent(eventData);
      
      if (response.success) {
        // Refresh events to show the new event
        fetchEvents();
      } else {
        throw new Error(response.message || 'Event үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Create event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Event үүсгэхэд алдаа гарлаа'
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
        throw new Error(response.message || 'Event-д нэгдэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Join event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Event-д нэгдэхэд алдаа гарлаа'
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
        throw new Error(response.message || 'Event-ээс гарахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Leave event error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа гарлаа',
        text2: error.message || 'Event-ээс гарахад алдаа гарлаа'
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
          text2: response.message || 'Event устгахад алдаа гарлаа'
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
      navigation={navigation}
    />
  );

  const renderPost = ({ item }) => (
    <Post
      post={item}
      user={user}
      onPostUpdate={() => handleRefresh()}
      navigation={navigation}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.emptyText}>
            {selectedFilter === 'Events' ? 'Event-үүдийг ачаалж байна...' : 'Постуудыг ачаалж байна...'}
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
            {selectedFilter === 'Events' ? 'Event-үүдийг харахын тулд имэйл хаягаа баталгаажуулна уу' : 'Постуудыг харахын тулд имэйл хаягаа баталгаажуулна уу'}
          </Text>
        </View>
      );
    }

    // Show welcome message for new users or when no content exists
    const isEventsFilter = selectedFilter === 'Events';
    const hasContent = isEventsFilter ? events.length > 0 : posts.length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Тавтай морил!</Text>
        <Text style={styles.emptySubtext}>
          {!hasContent 
            ? (isEventsFilter 
                ? 'Одоогоор event-үүд байхгүй байна. Эхний event-ээ үүсгэж эхлээрэй!' 
                : 'Одоогоор постууд байхгүй байна. Эхний постоо үүсгэж эхлээрэй!')
            : (isEventsFilter 
                ? 'Event-үүдийг харахын тулд дээрээс доош чирнэ үү'
                : 'Постуудыг харахын тулд дээрээс доош чирнэ үү')
          }
        </Text>
        <TouchableOpacity 
          style={styles.createPostButton} 
          onPress={() => isEventsFilter ? setShowEventModal(true) : navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostButtonText}>
            {isEventsFilter ? 'Event үүсгэх' : 'Пост үүсгэх'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.titleContainer}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]}>{selectedFilter}</Text>
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
                style={styles.dropdownItem}
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

      <FlatList
        ref={flatListRef}
        data={getFilteredPosts()}
        renderItem={selectedFilter === 'Events' ? renderEvent : renderPost}
        keyExtractor={(item, index) => `${selectedFilter}-${item._id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#000000']}
            tintColor={'#000000'}
          />
        }
        onEndReached={selectedFilter === 'CHATLI' ? handleLoadMore : null}
        onEndReachedThreshold={selectedFilter === 'CHATLI' ? 0.1 : null}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loadingMore && selectedFilter === 'CHATLI' ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={[styles.loadingMoreText, { color: colors.textSecondary }]}>
                Илүү ихийг ачаалж байна...
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : null}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50, // Status bar height
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 80,
    backgroundColor: '#ffffff',
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
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default PostFeedScreen; 
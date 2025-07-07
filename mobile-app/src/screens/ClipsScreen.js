import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import api from '../services/api';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 72; // matches App.js tabBarStyle height

const ClipsScreen = ({ navigation, user, route }) => {
  const insets = useSafeAreaInsets();
  const CLIP_CONTAINER_HEIGHT = windowHeight - TAB_BAR_HEIGHT - insets.bottom;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pausedVideos, setPausedVideos] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});
  const [heartAnimations, setHeartAnimations] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [navigatedFromPostFeed, setNavigatedFromPostFeed] = useState(false);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const longPressTimers = useRef({});
  const doubleTapTimers = useRef({});
  const lastTapTime = useRef({});
  const heartAnimationRefs = useRef({});
  const scrollViewRef = useRef(null);

  // Handle initial video from route params
  useEffect(() => {
    const handleInitialVideo = async () => {
      if (route.params?.initialVideo) {
        const { initialVideo } = route.params;
        console.log('Initial video received:', initialVideo);
        
        // Clear the route params to prevent re-triggering
        navigation.setParams({ initialVideo: undefined });
        
        // Load posts and then scroll to the specific video
        await loadPosts();
        
        // Find the post in the loaded posts
        const postIndex = posts.findIndex(post => post._id === initialVideo.post._id);
        if (postIndex !== -1) {
          setCurrentIndex(postIndex);
          // Scroll to the specific video
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: postIndex,
              animated: true,
              viewPosition: 0.5
            });
          }, 500);
        }
      } else {
        loadPosts();
      }
    };

    handleInitialVideo();
    
    // Cleanup function to pause all videos when component unmounts
    return () => {
      pauseAllVideos();
      clearAllTimers();
    };
  }, []);

  // Handle route parameter changes for initial video
  useEffect(() => {
    if (route.params?.initialVideo && posts.length > 0) {
      const { initialVideo } = route.params;
      console.log('Route params changed, looking for video:', initialVideo.post._id);
      
      // Clear the route params to prevent re-triggering
      navigation.setParams({ initialVideo: undefined });
      
      // Set flag that we navigated from Post Feed
      setNavigatedFromPostFeed(true);
      
      // Find the post in the loaded posts
      const postIndex = posts.findIndex(post => post._id === initialVideo.post._id);
      if (postIndex !== -1) {
        setCurrentIndex(postIndex);
        // Scroll to the specific video
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: postIndex,
            animated: true,
            viewPosition: 0.5
          });
        }, 500);
      }
    }
  }, [route.params?.initialVideo, posts.length]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Scroll to bottom when keyboard shows
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Handle screen focus/blur
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - resume current video if it was playing
      if (posts.length > 0 && currentIndex < posts.length) {
        const currentPost = posts[currentIndex];
        if (currentPost && !pausedVideos[currentPost._id]) {
          const videoRef = videoRefs.current[currentPost._id];
          if (videoRef) {
            videoRef.playAsync();
          }
        }
      }
      
      return () => {
        // Screen is blurred - pause all videos
        pauseAllVideos();
        clearAllTimers();
      };
    }, [posts, currentIndex, pausedVideos])
  );

  // Handle tab press to refresh when already in Clips section
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      // Check if we're already on the Clips tab
      if (navigation.isFocused()) {
        // Prevent default behavior and refresh instead
        e.preventDefault();
        handleRefresh();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const pauseAllVideos = () => {
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.pauseAsync();
      }
    });
  };

  const clearAllTimers = () => {
    Object.values(longPressTimers.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    Object.values(doubleTapTimers.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    // Clear the timer objects
    longPressTimers.current = {};
    doubleTapTimers.current = {};
  };

  const openCommentModal = async (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setCommentText('');
    setCommentLoading(true);
    
    try {
      // Load comments for this post
      const response = await api.getComments(post._id);
      if (response.success) {
        // Comments are included in the post data
        setComments(response.data.post.comments || []);
      }
    } catch (error) {
      console.error('Load comments error:', error);
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setComments([]);
    setCommentText('');
  };

  const submitComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    setCommentLoading(true);
    try {
      const response = await api.addComment(selectedPost._id, commentText.trim());
      if (response.success) {
        // Add new comment to the list (comments are returned in response.data.comments)
        setComments(response.data.comments || []);
        setCommentText('');
        
        // Update post comment count
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === selectedPost._id
              ? { ...post, comments: response.data.comments || [] }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Add comment error:', error);
      Alert.alert('Алдаа', 'Сэтгэгдэл нэмэхэд алдаа гарлаа');
    } finally {
      setCommentLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.getPosts();
      if (response.success) {
        // Filter posts that have ONLY videos (no images)
        const videoPosts = response.data.posts.filter(post => 
          post.media && 
          post.media.length > 0 && 
          post.media[0].type === 'video'
        );
        setPosts(videoPosts);
      }
    } catch (error) {
      console.error('Load posts error:', error);
      Alert.alert('Алдаа', 'Видео клипуудыг ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId) => {
    try {
      const response = await api.likePost(postId);
      if (response.success) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? { ...post, likes: response.data.likes }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Like post error:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);
      
      // Pause all videos
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pauseAsync();
        }
      });
      
      // Play current video if it exists and not manually paused
      const currentPost = posts[index];
      if (currentPost && currentPost.media[0].type === 'video') {
        const videoRef = videoRefs.current[currentPost._id];
        if (videoRef && !pausedVideos[currentPost._id]) {
          videoRef.playAsync();
        }
      }
    }
  }).current;

  // Handle video starting from beginning when navigated from Post Feed
  useEffect(() => {
    if (navigatedFromPostFeed && posts.length > 0 && currentIndex < posts.length) {
      const currentPost = posts[currentIndex];
      if (currentPost && currentPost.media[0].type === 'video') {
        const videoRef = videoRefs.current[currentPost._id];
        if (videoRef) {
          // Start video from beginning
          videoRef.setPositionAsync(0);
          setNavigatedFromPostFeed(false); // Reset flag after use
        }
      }
    }
  }, [navigatedFromPostFeed, currentIndex, posts.length]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const handleVideoTap = async (postId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms for double tap detection
    
    // Check if this is a double tap
    if (lastTapTime.current[postId] && (now - lastTapTime.current[postId]) < DOUBLE_TAP_DELAY) {
      // Double tap detected - like the post
      clearTimeout(doubleTapTimers.current[postId]);
      delete lastTapTime.current[postId];
      delete doubleTapTimers.current[postId];
      
      // Like the post
      await handleLike(postId);
      
      // Show heart animation
      setHeartAnimations(prev => ({ ...prev, [postId]: true }));
      
      // Create animation
      const animatedValue = new Animated.Value(0);
      heartAnimationRefs.current[postId] = animatedValue;
      
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setHeartAnimations(prev => ({ ...prev, [postId]: false }));
        delete heartAnimationRefs.current[postId];
      });
      
      return;
    }
    
    // Single tap - play/pause video
    lastTapTime.current[postId] = now;
    doubleTapTimers.current[postId] = setTimeout(() => {
      // Single tap confirmed after delay
      const videoRef = videoRefs.current[postId];
      if (videoRef) {
        const isPaused = pausedVideos[postId];
        if (isPaused) {
          videoRef.playAsync();
          setPausedVideos(prev => ({ ...prev, [postId]: false }));
        } else {
          videoRef.pauseAsync();
          setPausedVideos(prev => ({ ...prev, [postId]: true }));
        }
      }
      delete lastTapTime.current[postId];
      delete doubleTapTimers.current[postId];
    }, DOUBLE_TAP_DELAY);
  };

  const handleMuteToggle = async (postId) => {
    const videoRef = videoRefs.current[postId];
    if (videoRef) {
      const isMuted = mutedVideos[postId];
      if (isMuted) {
        await videoRef.setIsMutedAsync(false);
        setMutedVideos(prev => ({ ...prev, [postId]: false }));
      } else {
        await videoRef.setIsMutedAsync(true);
        setMutedVideos(prev => ({ ...prev, [postId]: true }));
      }
    }
  };

  const handleLongPress = async (postId) => {
    const videoRef = videoRefs.current[postId];
    if (videoRef && !pausedVideos[postId]) {
      await videoRef.pauseAsync();
      longPressTimers.current[postId] = setTimeout(async () => {
        if (!pausedVideos[postId]) {
          await videoRef.playAsync();
        }
      }, 2000); // Resume after 2 seconds
    }
  };

  const handlePressOut = async (postId) => {
    if (longPressTimers.current[postId]) {
      clearTimeout(longPressTimers.current[postId]);
      delete longPressTimers.current[postId];
      
      const videoRef = videoRefs.current[postId];
      if (videoRef && !pausedVideos[postId]) {
        await videoRef.playAsync();
      }
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      if (!dateString) return '0с';
      const now = new Date();
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '0с';
      
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return `${diffInSeconds}с`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}м`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}ц`;
      return `${Math.floor(diffInSeconds / 86400)}ө`;
    } catch (error) {
      console.warn('formatTimeAgo error:', error, 'dateString:', dateString);
      return '0с';
    }
  };

  const formatViewCount = (likesCount) => {
    try {
      if (likesCount === null || likesCount === undefined) return '0';
      const count = Number(likesCount) || 0;
      if (count < 1000) return count.toString();
      if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
      return `${(count / 1000000).toFixed(1)}M`;
    } catch (error) {
      console.warn('formatViewCount error:', error, 'likesCount:', likesCount);
      return '0';
    }
  };

  // Utility to always return a string for any value
  const safeText = (val) => {
    try {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return String(val);
      if (typeof val === 'object') {
        // Handle objects more carefully
        if (val.toString && typeof val.toString === 'function') {
          return val.toString();
        }
        return JSON.stringify(val);
      }
      return String(val);
    } catch (error) {
      console.warn('safeText error:', error, 'value:', val);
      return '';
    }
  };

    const renderClipItem = ({ item, index }) => {
    const media = item.media[0];
    const isLiked = item.likes.includes(user._id);
    
    return (
      <View style={styles.clipContainer}>
        {/* Full-screen Video */}
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={() => handleVideoTap(item._id)}
          onLongPress={() => handleLongPress(item._id)}
          onPressOut={() => handlePressOut(item._id)}
          activeOpacity={1}
        >
          <Video
            ref={(ref) => {
              videoRefs.current[item._id] = ref;
            }}
            source={{ uri: media.url }}
            style={styles.video}
            shouldPlay={index === currentIndex && !pausedVideos[item._id]}
            isLooping
            isMuted={mutedVideos[item._id] || false}
            resizeMode="contain"
            onError={(error) => {
              console.error('Video error:', error);
            }}
            onLoadStart={() => {
              // Optional: Add loading indicator
            }}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.durationMillis) {
                const progress = status.positionMillis / status.durationMillis;
                setVideoProgress(prev => ({ ...prev, [item._id]: progress }));
              }
            }}
          />
          
          {/* Dark overlay for better text readability */}
          <View style={styles.darkOverlay} />
          
          {pausedVideos[item._id] && (
            <View style={styles.playPauseOverlay}>
              <View style={styles.playIcon}>
                <Ionicons name="play" size={50} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          )}
          
          {/* Heart Animation for Double Tap */}
          {heartAnimations[item._id] && (
            <View style={styles.heartAnimationContainer}>
              <Animated.View 
                style={[
                  styles.heartAnimation,
                  {
                    transform: [
                      { 
                        scale: heartAnimationRefs.current[item._id] || new Animated.Value(0)
                      }
                    ],
                    opacity: heartAnimationRefs.current[item._id] || new Animated.Value(0)
                  }
                ]}
              >
                <Ionicons name="heart" size={80} color="#ff3040" />
              </Animated.View>
            </View>
          )}
          
          {/* Overlays */}
          <SafeAreaView style={styles.overlaySafeArea} pointerEvents="box-none">
            {/* Top Watermark */}
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>CHATLI clips</Text>
            </View>
            
            {/* Mute/Unmute Button - Top Right */}
            <TouchableOpacity
              style={styles.muteButton}
              onPress={() => handleMuteToggle(item._id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={mutedVideos[item._id] ? 'volume-mute' : 'volume-high'}
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>
            
            {/* Right Side Actions - positioned in center-right */}
            <View style={styles.rightActions}>
              <TouchableOpacity
                style={[styles.actionButton, isLiked && styles.likedButton]}
                onPress={() => handleLike(item._id)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={28}
                    color={isLiked ? '#ff3040' : '#ffffff'}
                  />
                </View>
                <Text style={[styles.actionText, isLiked && styles.likedText]}>
                  {safeText(formatViewCount(item.likes?.length || 0))}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => openCommentModal(item)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="chatbubble-outline" size={26} color="#ffffff" />
                </View>
                <Text style={styles.actionText}>{safeText(formatViewCount(item.comments?.length || 0))}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    'Нэмэлт сонголт', 
                    'Энэ функц удахгүй нэмэгдэнэ',
                    [
                      { text: 'Ойлголоо', style: 'default' }
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="ellipsis-horizontal" size={26} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Bottom Info - positioned at bottom */}
            <View style={styles.bottomInfo}>
              <View style={styles.publisherRow}>
                <Image
                  source={{ uri: item.author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
                  style={styles.userAvatar}
                />
                <View style={styles.publisherDetails}>
                  <View style={styles.publisherNameRow}>
                    <Text style={styles.userName}>{safeText(item.author?.name || 'Unknown')}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.timeAgo}>{safeText(formatTimeAgo(item.createdAt))}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.viewCount}>{safeText(formatViewCount(item.likes?.length || 0))} үзсэн</Text>
                  </View>
                  <Text style={styles.postContent}>{safeText(item.content || '')}</Text>
                </View>
              </View>
              {/* Only show follow button if it's not the current user's post */}
              {item.author._id !== user._id && (
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>Дагах</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.rootContainer}>
        <View style={[styles.loadingContainer, { backgroundColor: '#000' }]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.rootContainer}>
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Видео клип олдсонгүй</Text>
          <Text style={styles.emptySubtext}>Эхний видео клипээ үүсгээрэй</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={item => (item && item._id ? String(item._id) : String(Math.random()))}
        renderItem={renderClipItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        style={{ flex: 1, backgroundColor: '#000' }}
        contentContainerStyle={{ backgroundColor: '#000' }}
        snapToInterval={windowHeight - TAB_BAR_HEIGHT - 10}
        decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
        getItemLayout={(data, index) => ({ length: windowHeight - TAB_BAR_HEIGHT - 10, offset: (windowHeight - TAB_BAR_HEIGHT - 10) * index, index })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#ffffff']}
            tintColor="#ffffff"
            title="Шинэчлэх..."
            titleColor="#ffffff"
            progressBackgroundColor="rgba(0, 0, 0, 0.3)"
          />
        }
      />
      
      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={closeCommentModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeCommentModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Сэтгэгдэл</Text>
              <View style={styles.placeholder} />
            </View>
            
            {/* Comments List */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.commentsContainer}
              contentContainerStyle={styles.commentsContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {commentLoading ? (
                <View style={styles.loadingComments}>
                  <ActivityIndicator size="large" color="#666" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyCommentsText}>Сэтгэгдэл байхгүй</Text>
                  <Text style={styles.emptyCommentsSubtext}>Эхний сэтгэгдлээ үлдэээрэй</Text>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.commentItem}>
                      <Image
                        source={{ uri: item.author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentAuthor}>{safeText(item.author?.name || 'Unknown')}</Text>
                          <Text style={styles.commentTime}>{safeText(formatTimeAgo(item.createdAt))}</Text>
                        </View>
                        <Text style={styles.commentText}>{safeText(item.content)}</Text>
                      </View>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </ScrollView>
            
            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Сэтгэгдэл бичих..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={submitComment}
                disabled={!commentText.trim() || commentLoading}
              >
                {commentLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  clipContainer: {
    width: windowWidth,
    height: windowHeight - TAB_BAR_HEIGHT - 20, // Slightly smaller to ensure proper snapping
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 10, // Small space between videos
  },
  videoContainer: {
    width: windowWidth,
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    width: windowWidth,
    height: '100%',
    backgroundColor: '#000',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartAnimationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  heartAnimation: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlaySafeArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'space-between',
    width: '100%',
  },
  watermark: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
  },
  muteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 100, // Position above the bottom user info
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 80, // Leave space for right actions
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  publisherDetails: {
    marginLeft: 10,
    flex: 1,
  },
  publisherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 2,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dot: {
    color: '#ffffff',
    fontSize: 12,
    marginHorizontal: 4,
    opacity: 0.6,
  },
  timeAgo: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  viewCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  postContent: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginLeft: 10,
  },
  followButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 48,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  likedButton: {
    transform: [{ scale: 1.05 }],
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  likedText: {
    color: '#ff3040',
  },
  // Comment Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    maxHeight: '70%',
  },
  commentsContentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 1,
    paddingBottom: Platform.OS === 'ios',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    minHeight: 60,
    marginTop: 'auto',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical:12,
    minHeight: 20,
    maxHeight: 100,
    fontSize: 14,
    color: '#000',
    marginRight: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ClipsScreen; 
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import api from '../services/api';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const GAP = 8; // px between videos
const ASPECT_RATIO = 9 / 16;
const VIDEO_BOX_WIDTH = windowWidth;
const VIDEO_BOX_HEIGHT = VIDEO_BOX_WIDTH / ASPECT_RATIO;
const GAP_BETWEEN_VIDEOS = 100;

const ClipsScreen = ({ navigation, user }) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 72; // matches App.js tabBarStyle height
  const CLIP_CONTAINER_HEIGHT = windowHeight - TAB_BAR_HEIGHT - insets.bottom;
  const ITEM_HEIGHT = CLIP_CONTAINER_HEIGHT + GAP;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pausedVideos, setPausedVideos] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const longPressTimers = useRef({});

  useEffect(() => {
    loadPosts();
  }, []);

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

  const handleVideoTap = async (postId) => {
    const videoRef = videoRefs.current[postId];
    if (videoRef) {
      const isPaused = pausedVideos[postId];
      if (isPaused) {
        await videoRef.playAsync();
        setPausedVideos(prev => ({ ...prev, [postId]: false }));
      } else {
        await videoRef.pauseAsync();
        setPausedVideos(prev => ({ ...prev, [postId]: true }));
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
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}с`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}м`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}ц`;
    return `${Math.floor(diffInSeconds / 86400)}ө`;
  };

  const formatViewCount = (likesCount) => {
    if (likesCount < 1000) return likesCount.toString();
    if (likesCount < 1000000) return `${(likesCount / 1000).toFixed(1)}k`;
    return `${(likesCount / 1000000).toFixed(1)}M`;
  };

  const getViewMultiplier = (postId) => {
    // Create consistent view multiplier based on post ID
    const hash = postId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 100) + 10; // 10-109x multiplier for more realistic views
  };

  // Utility to always return a string for any value
  const safeText = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    try {
      return JSON.stringify(val);
    } catch {
      return '';
    }
  };

  const renderClipItem = ({ item, index }) => {
    const media = item.media[0];
    const isLiked = item.likes.includes(user._id);
    // Center the 9:16 box vertically
    const verticalPadding = Math.max(0, (CLIP_CONTAINER_HEIGHT - VIDEO_BOX_HEIGHT) / 2);
    // Add gap below except for last item
    const isLast = index === posts.length - 1;
    return (
      <View style={[styles.clipContainer, { height: CLIP_CONTAINER_HEIGHT, marginBottom: isLast ? 0 : GAP_BETWEEN_VIDEOS }]}> {/* Add gap below except last */}
        {/* Transparent Text to prevent RN error */}
        <Text style={{opacity: 0, height: 0}}> </Text>
        {/* Black space above */}
        {verticalPadding > 0 && <View style={{ height: verticalPadding, width: '100%', backgroundColor: '#000' }} />}
        {/* 9:16 Video Box */}
        <View style={styles.videoBox}>
          <Video
            ref={(ref) => {
              videoRefs.current[item._id] = ref;
            }}
            source={{ uri: media.url }}
            style={styles.video}
            shouldPlay={index === currentIndex && !pausedVideos[item._id]}
            isLooping
            isMuted={false}
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
          {pausedVideos[item._id] && (
            <View style={styles.playPauseOverlay}>
              <View style={styles.playIcon}>
                <Ionicons name="play" size={50} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          )}
          {/* Overlays: SafeAreaView for icons and info, positioned absolutely over the 9:16 box */}
          <SafeAreaView style={styles.overlaySafeArea} pointerEvents="box-none">
            {/* Top Watermark */}
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>CHATLI clips</Text>
            </View>
            {/* Right Side Actions (centered vertically in 9:16 box) */}
            <View style={[styles.rightActionsFixed, { top: VIDEO_BOX_HEIGHT / 2 - 90 }]}> {/* 90 = half the icon stack height */}
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
                  {safeText(formatViewCount(item.likes?.length))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert('Сэтгэгдэл', 'Сэтгэгдэл функц удахгүй нэмэгдэнэ');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="chatbubble-outline" size={26} color="#ffffff" />
                </View>
                <Text style={styles.actionText}>{safeText(formatViewCount(item.comments?.length))}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    'Нэмэлт сонголт', 
                    'Энэ клип дээр юу хийх вэ?',
                    [
                      { text: 'Хадгалах', onPress: () => console.log('Save pressed') },
                      { text: 'Репорт', onPress: () => console.log('Report pressed') },
                      { text: 'Болих', style: 'cancel' }
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
            {/* Bottom Left: Publisher Info & Description (just above nav) */}
            <View style={[styles.bottomInfoFixed, { bottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]}> {/* 16px padding above nav */}
              <View style={styles.publisherRow}>
                <Image
                  source={{ uri: item.author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
                  style={styles.userAvatar}
                />
                <View style={styles.publisherDetails}>
                  <View style={styles.publisherNameRow}>
                    <Text style={styles.userName}>{safeText(item.author?.name) || '@'}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.timeAgo}>{safeText(formatTimeAgo(item.createdAt))}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.viewCount}>{safeText(formatViewCount(item.likes?.length))} үзсэн</Text>
                  </View>
                  <Text style={styles.postContent}>{safeText(item.content)}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Дагах</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
        {/* Brighter gap below */}
        {!isLast && <View style={{ height: GAP_BETWEEN_VIDEOS, width: '100%', backgroundColor: 'transparent' }} />}
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
      <Text style={{opacity: 0, height: 0}}> </Text>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={item => (item && item._id ? String(item._id) : Math.random().toString())}
        renderItem={renderClipItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        initialNumToRender={2}
        windowSize={3}
        style={{ flex: 1, backgroundColor: '#000' }}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: '#000', paddingBottom: 0, marginBottom: 0 }}
        snapToInterval={CLIP_CONTAINER_HEIGHT}
        decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
        getItemLayout={(data, index) => ({ length: CLIP_CONTAINER_HEIGHT, offset: CLIP_CONTAINER_HEIGHT * index, index })}
      />
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoBox: {
    width: VIDEO_BOX_WIDTH,
    height: VIDEO_BOX_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: {
    width: VIDEO_BOX_WIDTH,
    height: VIDEO_BOX_HEIGHT,
    backgroundColor: '#000',
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
  rightActionsFixed: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomInfoFixed: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '70%',
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
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
});

export default ClipsScreen; 
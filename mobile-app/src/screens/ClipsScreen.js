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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const ClipsScreen = ({ navigation, user }) => {
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



  const renderClipItem = ({ item, index }) => {
    const media = item.media[0]; // Use first media item
    const isLiked = item.likes.includes(user._id);

    return (
      <View style={styles.clipContainer}>
        {/* Video Content */}
        <TouchableOpacity
          style={styles.videoContainer}
          activeOpacity={1}
          onPress={() => handleVideoTap(item._id)}
          onLongPress={() => handleLongPress(item._id)}
          onPressOut={() => handlePressOut(item._id)}
          delayLongPress={500}
        >
          <Video
            ref={(ref) => {
              videoRefs.current[item._id] = ref;
            }}
            source={{ uri: media.url }}
            style={styles.media}
            shouldPlay={index === currentIndex && !pausedVideos[item._id]}
            isLooping
            isMuted={false}
            resizeMode="cover"
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
        </TouchableOpacity>

        {/* Top Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          style={styles.topGradientOverlay}
        />

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradientOverlay}
        />

        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            {/* Like Button */}
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
                {formatViewCount(item.likes.length)}
              </Text>
            </TouchableOpacity>

            {/* Comment Button */}
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
              <Text style={styles.actionText}>{formatViewCount(item.comments.length)}</Text>
            </TouchableOpacity>

            {/* More Options */}
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

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            {/* User Info */}
            <View style={styles.userInfoContainer}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{
                      uri: item.author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.liveIndicator} />
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>@{item.author.username}</Text>
                  </View>
                  <View style={styles.metaInfo}>
                    <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.viewCount}>{formatViewCount(item.likes.length * getViewMultiplier(item._id))} үзсэн</Text>
                  </View>
                </View>
              </View>

              {/* Follow Button - Only show for other users */}
              {item.author._id !== user._id && (
                <TouchableOpacity style={styles.followButton} activeOpacity={0.8}>
                  <Text style={styles.followButtonText}>Дагах</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Post Content */}
            {item.content && (
              <View style={styles.contentContainer}>
                <Text style={styles.postContent} numberOfLines={2}>
                  {item.content}
                </Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.seeMore}>дэлгэрэнгүй</Text>
                </TouchableOpacity>
              </View>
            )}


          </View>
        </View>



        {/* CHATLI Watermark */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>CHATLI clips</Text>
        </View>

        {/* Video Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(videoProgress[item._id] || 0) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Видео клипууд ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Видео клип олдсонгүй</Text>
          <Text style={styles.emptySubtext}>Эхний видео клипээ үүсгээрэй</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderClipItem}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
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
    width: width,
    height: height,
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -80 }],
    alignItems: 'center',
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
  bottomInfo: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 75,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00ff88',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeAgo: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  dot: {
    color: '#ffffff',
    fontSize: 12,
    marginHorizontal: 4,
    opacity: 0.6,
  },
  viewCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
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
  contentContainer: {
    marginBottom: 12,
  },
  postContent: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeMore: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 2,
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
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: 3,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#ffffff',
  },
});

export default ClipsScreen; 
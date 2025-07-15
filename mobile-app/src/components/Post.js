import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import ImageViewerModal from './ImageViewerModal';
import CommentSection from './CommentSection';
import socketService from '../services/socket';

const { width: screenWidth } = Dimensions.get('window');

const Post = ({ post, user, onPostUpdate, navigation }) => {
  if (
    !post ||
    typeof post !== 'object' ||
    !post.author ||
    typeof post.author !== 'object'
  ) {
    return <Text>Invalid post data</Text>;
  }
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [localPost, setLocalPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const videoRef = useRef(null);
  const likeTimeoutRef = useRef(null);
  
  // Update local post when post prop changes
  React.useEffect(() => {
    if (post) {
      setLocalPost(post);
    }
  }, [post]);

  // Real-time socket listeners - optimized to prevent excessive re-renders
  useEffect(() => {
    // Listen for real-time like updates
    const handlePostLiked = (data) => {
      if (data.postId === post._id) {
        setLocalPost(prevPost => {
          // Only update if likes actually changed
          if (JSON.stringify(prevPost.likes) !== JSON.stringify(data.likes)) {
            const updatedPost = {
              ...prevPost,
              likes: data.likes
            };
            return updatedPost;
          }
          return prevPost;
        });
      }
    };
    
    // Listen for real-time comment updates
    const handleCommentAdded = (data) => {
      if (data.postId === post._id) {
        setLocalPost(prevPost => {
          // Only update if comments actually changed
          if (JSON.stringify(prevPost.comments) !== JSON.stringify(data.comments)) {
            return {
              ...prevPost,
              comments: data.comments
            };
          }
          return prevPost;
        });
      }
    };
    
    // Listen for real-time post updates
    const handlePostUpdated = (data) => {
      if (data.postId === post._id) {
        setLocalPost(prevPost => {
          // Only update if there are actual changes
          const hasChanges = Object.keys(data.updates).some(key => 
            JSON.stringify(prevPost[key]) !== JSON.stringify(data.updates[key])
          );
          if (hasChanges) {
            return {
              ...prevPost,
              ...data.updates
            };
          }
          return prevPost;
        });
      }
    };
    
    socketService.onPostLiked(handlePostLiked);
    socketService.onCommentAdded(handleCommentAdded);
    socketService.onPostUpdated(handlePostUpdated);
    
    return () => {
      // Cleanup socket listeners
      socketService.offPostLiked(handlePostLiked);
      socketService.offCommentAdded(handleCommentAdded);
      socketService.offPostUpdated(handlePostUpdated);
    };
  }, [post._id]);

  // Sync with image viewer when it's open
  React.useEffect(() => {
    if (imageViewerVisible && localPost) {
      // Ensure the image viewer has the latest post data
      // The socket events will handle real-time updates
    }
  }, [imageViewerVisible, localPost]);
  
  // Sync state when image viewer closes
  React.useEffect(() => {
    if (!imageViewerVisible && localPost) {
      // When image viewer closes, ensure we have the latest state
      // The socket events will handle real-time updates
    }
  }, [imageViewerVisible, localPost]);
  
  // Cleanup timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current);
        likeTimeoutRef.current = null;
      }
    };
  }, []);
  
  const isOwner = localPost.author._id === user._id;
  const isLiked = localPost.likes.includes(user._id);
  
  const handleLike = async () => {
    if (liking) return;
    
    // Clear any existing timeout
    if (likeTimeoutRef.current) {
      clearTimeout(likeTimeoutRef.current);
    }
    
    setLiking(true);
    try {
      const response = await apiService.likePost(localPost._id);
      if (response.success) {
        // Update local state immediately for better UX
        setLocalPost(prevPost => ({
          ...prevPost,
          likes: response.data.likes
        }));
        
        // Emit socket event for real-time updates
        socketService.likePost(
          localPost._id,
          user._id,
          localPost.author._id
        );
      }
    } catch (error) {
      console.error('Like post error:', error);
      // Don't show alert for network errors, just log them
      if (!error.message.includes('Network') && !error.message.includes('timeout')) {
        Alert.alert('Алдаа', 'Лайк хийхэд алдаа гарлаа');
      }
    } finally {
      setLiking(false);
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Устгах',
      'Постыг устгах уу?',
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Устгах',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deletePost(localPost._id);
              onPostUpdate && onPostUpdate();
            } catch (error) {
              Alert.alert('Алдаа', 'Пост устгахад алдаа гарлаа');
            }
          },
        },
      ]
    );
  };

  const formatRelativeTime = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'яг одоо';
      if (minutes < 60) return `${minutes}м`;
      if (hours < 24) return `${hours}ц`;
      if (days < 7) return `${days}ө`;
      return date.toLocaleDateString('mn-MN');
    } catch (error) {
      return 'яг одоо';
    }
  };

  const getMediaToShow = () => {
    try {
      if (Array.isArray(localPost.media) && localPost.media.length > 0) {
        return localPost.media;
      }
      // Fallback for legacy posts
      if (localPost.image) {
        return [{ type: 'image', url: localPost.image }];
      }
      if (localPost.video) {
        return [{ type: 'video', url: localPost.video }];
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const mediaArray = getMediaToShow();

  const handleImagePress = () => {
    console.log('Image pressed! Opening image viewer...');
    setImageViewerVisible(true);
  };

  const renderMedia = () => {
    // If no media and no content, don't show anything
    if (mediaArray.length === 0) {
      return null;
    }

    const currentMediaItem = mediaArray[currentMedia];
    if (!currentMediaItem) {
      return null;
    }
    
    // Calculate aspect ratio for better display
    const aspectRatio = currentMediaItem.width && currentMediaItem.height 
      ? currentMediaItem.width / currentMediaItem.height 
      : 1.5; // Default aspect ratio
    
    return (
      <View style={styles.mediaContainer}>
        <View style={[styles.mediaWrapper, { width: '100%' }]}> {/* Ensure wrapper is 100% width */}
          {currentMediaItem.type === 'image' ? (
            imageLoadError ? (
              <View style={[styles.mediaImage, styles.imageErrorContainer, { 
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border 
              }]}> 
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.imageErrorText, { color: colors.textSecondary }]}>Зураг ачаалахад алдаа гарлаа</Text>
                <Text style={[styles.imageErrorText, { color: colors.textSecondary, fontSize: 12 }]}>
                  URL: {currentMediaItem.url || 'Unknown URL'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
                <Image
                  source={{ 
                    uri: currentMediaItem.url,
                    cache: 'default'
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: aspectRatio,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  resizeMode="cover"
                  defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }}
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                  onLoadStart={() => setImageLoadError(false)}
                />
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity 
              onPress={() => {
                // Navigate to Clips section with this video
                if (navigation) {
                  navigation.navigate('Clips', {
                    initialVideo: {
                      post: localPost,
                      mediaIndex: currentMedia,
                      mediaItem: currentMediaItem
                    }
                  });
                }
              }}
              activeOpacity={0.9}
            >
              <Video
                ref={videoRef}
                source={{ uri: currentMediaItem.url }}
                style={{
                  width: '100%',
                  aspectRatio: aspectRatio || 16 / 9,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: '#111',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                useNativeControls
                resizeMode="contain"
                isLooping={false}
              />
              {/* Play button overlay */}
              <View style={styles.videoPlayOverlay}>
                <View style={styles.videoPlayButton}>
                  <Ionicons name="play-circle" size={50} color="#ffffff" />
                  <Text style={styles.videoPlayText}>Clips-д үзэх</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Media Navigation */}
          {mediaArray.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.mediaNavButton, styles.mediaNavLeft]}
                onPress={() => setCurrentMedia((currentMedia - 1 + mediaArray.length) % mediaArray.length)}
              >
                <Ionicons name="chevron-back" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mediaNavButton, styles.mediaNavRight]}
                onPress={() => setCurrentMedia((currentMedia + 1) % mediaArray.length)}
              >
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Media Indicators */}
        {mediaArray.length > 1 && (
          <View style={styles.mediaIndicators}>
            {mediaArray.map((item, index) =>
              item ? (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.mediaIndicator,
                    { backgroundColor: colors.border },
                    index === currentMedia && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setCurrentMedia(index)}
                />
              ) : null
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface, 
      borderColor: colors.border,
      shadowColor: colors.shadow 
    }]}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => {
            if (navigation && localPost.author?._id !== user._id) {
              navigation.navigate('UserProfile', {
                userId: localPost.author?._id || '',
                userName: localPost.author?.name || 'Unknown User'
              });
            }
          }}
        >
          {localPost.author.avatar ? (
            <Image source={{ uri: localPost.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>{localPost.author?.name || 'Unknown User'}</Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>{formatRelativeTime(localPost.createdAt || new Date())}</Text>
          </View>
        </TouchableOpacity>
        
        {isOwner && (
          <TouchableOpacity style={styles.moreButton} onPress={handleDeletePost}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      {localPost.content && (
        <Text style={[styles.content, { color: colors.text }]}>{localPost.content || ''}</Text>
      )}

      {/* Post Media */}
      {renderMedia()}

      {/* Post Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={liking}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? colors.error : colors.textSecondary}
            style={liking ? { opacity: 0.5 } : {}}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{String(localPost.likes.length)}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setCommentModalVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{String(localPost.comments?.length || 0)}</Text>
        </TouchableOpacity>
        </View>
        
        {/* Image Viewer Modal */}
        <ImageViewerModal
          images={mediaArray.filter(item => item.type === 'image')}
          initialIndex={currentMedia || 0}
          onClose={() => setImageViewerVisible(false)}
          visible={imageViewerVisible}
          post={localPost}
          user={user}
          onPostUpdate={() => {
            // Sync the post state when image viewer updates
            // The socket events will handle real-time updates
          }}
        />

        {/* Comment Modal */}
        <Modal
          visible={commentModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <CommentSection
            post={localPost}
            user={user}
            onClose={() => setCommentModalVisible(false)}
            onCommentAdded={(updatedComments) => {
              setLocalPost(prevPost => ({
                ...prevPost,
                comments: updatedComments
              }));
            }}
          />
        </Modal>
      </View>
    );
  };

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
    borderRadius: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  mediaContainer: {
    marginBottom: 8,
  },
  mediaWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  mediaImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageErrorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  mediaVideo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
  },
  mediaNavButton: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  mediaNavLeft: {
    left: 8,
  },
  mediaNavRight: {
    right: 8,
  },
  mediaIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  mediaIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  videoPlayButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default Post; 
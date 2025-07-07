import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import ImageViewerModal from './ImageViewerModal';

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
  const videoRef = useRef(null);
  
  // Debug log the post structure
  console.log('Post data structure:', {
    id: post._id,
    hasMedia: !!post.media,
    mediaLength: post.media?.length,
    hasImage: !!post.image,
    hasVideo: !!post.video,
    media: post.media,
    image: post.image,
    video: post.video
  });
  
  const isOwner = localPost.author._id === user._id;
  const isLiked = localPost.likes.includes(user._id);

  const handleLike = async () => {
    if (liking) return;
    
    setLiking(true);
    try {
      const response = await apiService.likePost(localPost._id);
      if (response.success) {
        setLocalPost(prevPost => ({
          ...prevPost,
          likes: response.data.likes
        }));
      }
    } catch (error) {
      console.error('Like post error:', error);
      Alert.alert('Алдаа', 'Лайк хийхэд алдаа гарлаа');
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
    if (mediaArray.length === 0) {
      return (
        <View style={[styles.mediaContainer, { 
          backgroundColor: '#f0f0f0', 
          padding: 20, 
          alignItems: 'center',
          borderRadius: 8
        }]}> 
          <Text style={{ color: '#666', fontSize: 14 }}>No media found in this post</Text>
        </View>
      );
    }

    const currentMediaItem = mediaArray[currentMedia];
    if (!currentMediaItem) {
      return (
        <View style={[styles.mediaContainer, { backgroundColor: '#f0f0f0', padding: 20, alignItems: 'center', borderRadius: 8 }]}> 
          <Text style={{ color: '#666', fontSize: 14 }}>No media found in this post</Text>
        </View>
      );
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
                <Ionicons name="play-circle" size={50} color="#ffffff" />
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
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{String(localPost.likes.length)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
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
        />
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
});

export default Post; 
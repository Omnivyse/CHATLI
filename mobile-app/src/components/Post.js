import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import socketService from '../services/socket';
import apiService from '../services/api';
import CommentSection from './CommentSection';
import ImageViewerModal from './ImageViewerModal';
import TempClipsModal from './TempClipsModal';
import SecretPostPasswordModal from './SecretPostPasswordModal';

const { width: screenWidth } = Dimensions.get('window');

const Post = ({ post, user, onPostUpdate, navigation }) => {
  const isWeb = Platform.OS === 'web';
  
  // Debug: Validate props
  if (!post || typeof post !== 'object') {
    console.warn('Post component: Invalid post prop:', post);
    return null;
  }

  // User prop can be undefined during initial render, so we'll handle it gracefully
  if (user && typeof user !== 'object') {
    console.warn('Post component: Invalid user prop:', user);
    return null;
  }

  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  const [localPost, setLocalPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [tempClipsModalVisible, setTempClipsModalVisible] = useState(false);
  const [profileImageViewerVisible, setProfileImageViewerVisible] = useState(false);
  const [secretPasswordModalVisible, setSecretPasswordModalVisible] = useState(false);
  const [isSecretPostUnlocked, setIsSecretPostUnlocked] = useState(false);
  const videoRef = useRef(null);
  const likeTimeoutRef = useRef(null);
  
  // Check for invalid post data after hooks are declared
  if (
    !post ||
    typeof post !== 'object' ||
    !post.author ||
    typeof post.author !== 'object'
  ) {
    console.warn('Post component: Invalid post author:', post?.author);
    return null;
  }
  
  // Update local post when post prop changes
  React.useEffect(() => {
    if (post) {
      setLocalPost(post);
      
      // Check if this is a secret post and user is already verified
      if (post.isSecret && post.author._id !== user?._id) {
        const isUserVerified = post.passwordVerifiedUsers && post.passwordVerifiedUsers.includes(user?._id);
        if (isUserVerified) {
          console.log('🔓 User already verified for secret post:', post._id);
          setIsSecretPostUnlocked(true);
        }
      }
    }
  }, [post, user?._id]);

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
  
  const isOwner = localPost.author?._id === user?._id;
  const isLiked = Array.isArray(localPost.likes) && user?._id && localPost.likes.includes(user._id);
  
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
        if (localPost._id && user?._id && localPost.author?._id) {
          socketService.likePost(
            localPost._id,
            user._id,
            localPost.author._id
          );
        }
      }
    } catch (error) {
      console.error('Like post error:', error);
      // Don't show alert for network errors, just log them
      if (!error.message.includes('Network') && !error.message.includes('timeout')) {
        Alert.alert('Error', 'Failed to like post');
      }
    } finally {
      setLiking(false);
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      getTranslation('deletePost', language),
      getTranslation('deletePostConfirm', language),
      [
        { text: getTranslation('cancel', language), style: 'cancel' },
        {
          text: getTranslation('delete', language),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deletePost(post._id);
              if (response.success) {
                onPostUpdate();
              }
            } catch (error) {
              console.error('Delete post error:', error);
            }
          },
        },
      ]
    );
  };

  const handleSecretPostPassword = async (password) => {
    try {
      console.log('🔐 Verifying password for post:', post._id);
      const response = await apiService.verifySecretPostPassword(post._id, password);
      console.log('🔐 Server response:', response);
      if (response.success) {
        // Update local post with server response to include the user in passwordVerifiedUsers
        console.log('✅ Password verified, updating local post with:', response.data.post);
        setLocalPost(response.data.post);
        setIsSecretPostUnlocked(true);
        setSecretPasswordModalVisible(false);
      }
    } catch (error) {
      console.error('❌ Password verification failed:', error);
      throw new Error(error.message || 'Failed to verify password');
    }
  };

  const handleSecretPostPress = () => {
    // Check if user is the author or already verified
    if (String(post.author._id) === String(user?._id)) {
      setIsSecretPostUnlocked(true);
      return;
    }
    
    // Check if user has already verified this post
    const isUserVerified = localPost.passwordVerifiedUsers && localPost.passwordVerifiedUsers.includes(user?._id);
    if (isUserVerified) {
      setIsSecretPostUnlocked(true);
      return;
    }
    
    // Show password modal for verification
    setSecretPasswordModalVisible(true);
  };

  const formatRelativeTime = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return String(minutes) + 'm';
      if (hours < 24) return String(hours) + 'h';
      if (days < 7) return String(days) + 'd';
      return date.toLocaleDateString('en-US');
    } catch (error) {
      return 'just now';
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

  const handleVideoPress = () => {
    setTempClipsModalVisible(true);
  };

  const renderMedia = () => {
    // If no media and no content, don't show anything
    if (mediaArray.length === 0) {
      return null;
    }

    // Simple approach: Show all images in a grid or single image/video
    if (mediaArray.length === 1) {
      // Single media item
      const mediaItem = mediaArray[0];
      return (
        <View style={styles.mediaContainer}>
          {mediaItem.type === 'image' ? (
            <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
              <Image
                source={{ 
                  uri: mediaItem.url,
                  cache: 'default'
                }}
                style={{
                  width: '100%',
                  height: 250,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                resizeMode="cover"
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleVideoPress}
              activeOpacity={0.9}
              style={[styles.videoContainer, { borderColor: colors.border }]}
            >
              <Video
                source={{ uri: mediaItem.url }}
                style={styles.videoPlayer}
                useNativeControls={false}
                resizeMode="cover"
                shouldPlay={false}
                isLooping={false}
                isMuted={true}
                shouldCorrectPitch={false}
              />
              <View style={styles.videoPlayOverlay}>
                <Ionicons name="play-circle" size={48} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    } else {
      // Multiple media items - show grid or dots
      const images = mediaArray.filter(item => item.type === 'image');
      const videos = mediaArray.filter(item => item.type === 'video');
      
      // If all are images, show grid
      if (videos.length === 0 && images.length > 1) {
        return (
          <View style={styles.mediaContainer}>
            <View style={styles.imageGrid}>
              {images.slice(0, 4).map((image, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={handleImagePress} 
                  activeOpacity={0.9}
                  style={[
                    styles.gridImage,
                    { 
                      borderColor: colors.border,
                      width: images.length === 2 ? '48%' : images.length === 3 ? '32%' : '48%',
                      height: images.length === 2 ? 150 : images.length === 3 ? 100 : 100,
                    }
                  ]}
                >
                  <Image
                    source={{ uri: image.url }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 6,
                    }}
                    resizeMode="cover"
                  />
                  {index === 3 && images.length > 4 && (
                    <View style={styles.moreImagesOverlay}>
                      <Text style={styles.moreImagesText}>+{images.length - 4}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {/* Show dots for multiple images */}
            <View style={styles.mediaIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.mediaIndicator,
                    { backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      } else {
        // Mixed content or videos - show first item with dots
        const firstItem = mediaArray[0];
        return (
          <View style={styles.mediaContainer}>
            {firstItem.type === 'image' ? (
              <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
                <Image
                  source={{ uri: firstItem.url }}
                  style={{
                    width: '100%',
                    height: 250,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={handleVideoPress}
                activeOpacity={0.9}
                style={[styles.videoContainer, { borderColor: colors.border }]}
              >
                <Video
                  source={{ uri: firstItem.url }}
                  style={styles.videoPlayer}
                  useNativeControls={false}
                  resizeMode="cover"
                  shouldPlay={false}
                  isLooping={false}
                  isMuted={true}
                />
                <View style={styles.videoPlayOverlay}>
                  <Ionicons name="play-circle" size={48} color="#ffffff" />
                </View>
              </TouchableOpacity>
            )}
            {/* Show dots for multiple media */}
            <View style={styles.mediaIndicators}>
              {mediaArray.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.mediaIndicator,
                    { backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      }
    }
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
            if (navigation && localPost.author?._id && user?._id && localPost.author._id !== user._id) {
              navigation.navigate('UserProfile', {
                userId: localPost.author._id,
                userName: localPost.author?.name && typeof localPost.author.name === 'string' ? localPost.author.name : 'Unknown User'
              });
            }
          }}
        >
          {localPost.author?.avatar ? (
            <TouchableOpacity 
              onPress={() => setProfileImageViewerVisible(true)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: localPost.author.avatar }} style={styles.avatar} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {localPost.author?.name && typeof localPost.author.name === 'string' ? localPost.author.name : 'Unknown User'}
              </Text>
              {localPost.author?.isVerified && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={colors.primary} 
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>
              {formatRelativeTime(localPost.createdAt || new Date())}
            </Text>
          </View>
        </TouchableOpacity>
        
        {isOwner && (
          <TouchableOpacity style={styles.moreButton} onPress={handleDeletePost}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      {localPost.content && typeof localPost.content === 'string' && localPost.content.trim() !== '' && (
        <TouchableOpacity
          onPress={localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id ? handleSecretPostPress : undefined}
          activeOpacity={localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id ? 0.7 : 1}
          style={localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id ? styles.secretContentContainer : null}
        >
          <View style={styles.contentContainer}>
            {localPost.isSecret && localPost.author._id !== user?._id && (
              <View style={styles.lockIconContainer}>
                <Ionicons 
                  name="lock-closed" 
                  size={16} 
                  color={isSecretPostUnlocked ? colors.primary : colors.textSecondary} 
                />
              </View>
            )}
            <Text style={[styles.content, { color: colors.text }]}>
              {(() => {
                // Convert showDescription to boolean to handle different data types
                const shouldShowDescription = Boolean(localPost.showDescription);
                const shouldHideContent = localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id && !shouldShowDescription;
                
                // Enhanced debugging
                console.log(`🔍 DEBUG Post ${localPost._id} (${isWeb ? 'WEB' : 'MOBILE'}):`, {
                  platform: isWeb ? 'WEB' : 'MOBILE',
                  isSecret: localPost.isSecret,
                  isSecretPostUnlocked,
                  authorId: localPost.author?._id,
                  userId: user?._id,
                  isAuthor: localPost.author._id === user?._id,
                  showDescription: localPost.showDescription,
                  showDescriptionType: typeof localPost.showDescription,
                  shouldShowDescription,
                  shouldHideContent,
                  originalContent: localPost.content?.substring(0, 50) + '...',
                  finalContent: shouldHideContent ? 'Content hidden' : localPost.content
                });
                
                return shouldHideContent ? 'Content hidden' : localPost.content;
              })()}
            </Text>
          </View>
          {/* Only show secret overlay if description should be hidden */}
          {localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id && !Boolean(localPost.showDescription) && (
            <View style={styles.secretOverlay}>
              <View style={styles.secretOverlayContent}>
                <Ionicons name="lock-closed" size={24} color="#ffffff" />
                <Text style={[styles.secretText, { color: "#ffffff" }]}>Tap to enter password</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Post Media - Always hidden when secret post is locked (regardless of showDescription) */}
      {localPost.isSecret && !isSecretPostUnlocked && mediaArray.length > 0 ? (
        <TouchableOpacity
          onPress={handleSecretPostPress}
          activeOpacity={0.7}
          style={styles.secretMediaContainer}
        >
          <View style={styles.secretMediaPlaceholder}>
            <View style={[styles.secretMediaIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
            </View>
            <Text style={[styles.secretMediaText, { color: colors.text }]}>Media hidden</Text>
            <Text style={[styles.secretMediaSubtext, { color: colors.textSecondary }]}>Enter password to view</Text>
          </View>
        </TouchableOpacity>
      ) : (
        renderMedia()
      )}

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
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {Array.isArray(localPost.likes) ? String(localPost.likes.length) : '0'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setCommentModalVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {Array.isArray(localPost.comments) ? String(localPost.comments.length) : '0'}
          </Text>
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

      {/* Temporary Clips Modal */}
      <TempClipsModal
        visible={tempClipsModalVisible}
        onClose={() => setTempClipsModalVisible(false)}
        clickedVideo={{
          _id: localPost._id,
          url: mediaArray[currentMedia]?.url,
          title: localPost.content || 'Untitled Video',
          author: localPost.author
        }}
        allVideos={[]} // We'll enhance this later to show all videos
        user={user}
        post={localPost}
      />

      {/* Profile Image Viewer Modal */}
      <Modal
        visible={profileImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileImageViewerVisible(false)}
      >
        <TouchableOpacity
          style={styles.profileImageModalOverlay}
          activeOpacity={1}
          onPress={() => setProfileImageViewerVisible(false)}
        >
          <TouchableOpacity
            style={styles.profileImageModalContent}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping the image
          >
            {localPost.author?.avatar ? (
              <Image
                source={{ uri: localPost.author.avatar }}
                style={styles.profileImageModalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.profileImageModalPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="person" size={80} color={colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.profileImageModalCloseButton}
              onPress={() => setProfileImageViewerVisible(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Secret Post Password Modal */}
      <SecretPostPasswordModal
        visible={secretPasswordModalVisible}
        onClose={() => setSecretPasswordModalVisible(false)}
        onPasswordSubmit={handleSecretPostPassword}
        postAuthor={localPost.author?.name}
        showDescription={localPost.showDescription}
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
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    marginLeft: 2,
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridImage: {
    marginBottom: 8,
    borderRadius: 6,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileImageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageModalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImageModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  profileImageModalPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageModalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 0,
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  secretContentContainer: {
    position: 'relative',
  },
  secretOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    zIndex: 1,
  },
  secretOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secretText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  secretMediaContainer: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secretMediaPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  secretMediaIconContainer: {
    borderRadius: 24,
    padding: 10,
  },
  secretMediaText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  secretMediaSubtext: {
    marginTop: 4,
    fontSize: 12,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lockIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
});

export default Post; 
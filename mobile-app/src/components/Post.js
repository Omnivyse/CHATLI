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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';
import socketService from '../services/socket';
import apiService from '../services/api';
import CommentSection from './CommentSection';
import ImageViewerModal from './ImageViewerModal';
// import TempClipsModal from './TempClipsModal'; // Temporarily hidden
import SecretPostPasswordModal from './SecretPostPasswordModal';
// Post feed uses a compact music attachment (no autoplay).

const { width: screenWidth } = Dimensions.get('window');

const Post = ({ 
  post, 
  user, 
  onPostUpdate = () => {}, 
  navigation, 
  isTopPost, 
  isHighlighted,
  isGlobalMusicMuted = false,
  onToggleGlobalMusicMute,
  feedFocused = true,
}) => {
  const insets = useSafeAreaInsets();
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
  // const [tempClipsModalVisible, setTempClipsModalVisible] = useState(false); // Temporarily hidden
  const [profileImageViewerVisible, setProfileImageViewerVisible] = useState(false);
  const [secretPasswordModalVisible, setSecretPasswordModalVisible] = useState(false);
  const [isSecretPostUnlocked, setIsSecretPostUnlocked] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);

  // Music preview state (post attachment)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const musicSoundRef = useRef(null);
  
  // Video state management
  const [videoPlaying, setVideoPlaying] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [videoDuration, setVideoDuration] = useState({});
  const [videoLoading, setVideoLoading] = useState({});
  
  // Video view modal state
  const [videoViewModalVisible, setVideoViewModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const modalVideoRef = useRef(null);
  const [modalVideoPlaying, setModalVideoPlaying] = useState(true);
  const [modalVideoMuted, setModalVideoMuted] = useState(false);
  
  const videoRef = useRef(null);
  const likeTimeoutRef = useRef(null);
  const progressUpdateTimeoutRef = useRef(null);
  
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
          setIsSecretPostUnlocked(true);
        }
      }
      
      // Reset video states when post changes
      setVideoPlaying({});
      setVideoProgress({});
      setVideoDuration({});
      setVideoLoading({});
    }
  }, [post, user]);

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
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
        progressUpdateTimeoutRef.current = null;
      }
    };
  }, []);

  // Cleanup music preview when component unmounts / post changes
  React.useEffect(() => {
    return () => {
      if (musicSoundRef.current) {
        // Best-effort cleanup
        musicSoundRef.current.stopAsync().catch(() => null);
        musicSoundRef.current.unloadAsync().catch(() => null);
        musicSoundRef.current = null;
      }
      setIsMusicPlaying(false);
      setMusicLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPost?._id]);

  // Pause all videos when component unmounts
  React.useEffect(() => {
    return () => {
      // Pause all videos when component unmounts
      setVideoPlaying({});
      // Close video view modal
      setVideoViewModalVisible(false);
      setSelectedVideo(null);
    };
  }, []);

  // Removed problematic useEffect that was causing infinite loops
  
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

     const handleHidePost = async () => {
     try {
       const isCurrentlyHidden = localPost.isHidden;
       
       // If post was hidden due to privacy settings, user cannot show it until they change privacy
       if (isCurrentlyHidden && localPost.hiddenReason === 'privacy_change') {
         Alert.alert(
           getTranslation('cannotShowPost', language),
           getTranslation('cannotShowPostPrivacyReason', language),
           [
             { text: getTranslation('ok', language), style: 'default' },
             { 
               text: getTranslation('goToPrivacySettings', language), 
               onPress: () => {
                 if (navigation) {
                   navigation.navigate('Settings');
                 }
               }
             }
           ]
         );
         return;
       }
       
       const newHiddenState = !isCurrentlyHidden;
       
       const response = await apiService.hidePost(post._id, newHiddenState);
       if (response.success) {
         setLocalPost(prevPost => ({
           ...prevPost,
           isHidden: newHiddenState,
           hiddenReason: newHiddenState ? 'manual' : null
         }));
         onPostUpdate();
       }
     } catch (error) {
       console.error('Hide post error:', error);
     }
   };

  const handleSecretPostPassword = async (password) => {
    try {
      console.log('🔐 Verifying password for post:', localPost._id);
      const response = await apiService.verifySecretPostPassword(localPost._id, password);
      console.log('🔐 Server response:', response);
      if (response.success) {
        // Update local post with server response to include the user in passwordVerifiedUsers
        console.log('✅ Password verified, updating local post with:', response.data.post);
        setLocalPost(response.data.post);
        setIsSecretPostUnlocked(true);
        setSecretPasswordModalVisible(false);
        setSecretPassword('');
      }
    } catch (error) {
      console.error('❌ Password verification failed:', error);
      
      // Handle rate limiting responses
      if (error.status === 429) {
        // Rate limited - show retry after message
        const retryAfter = error.data?.retryAfter || 480; // Default to 8 minutes
        const minutes = Math.ceil(retryAfter / 60);
        Alert.alert(
          getTranslation('tooManyAttempts', language),
          getTranslation('tryAgainInMinutes', language).replace('{minutes}', minutes),
          [{ text: getTranslation('ok', language) }]
        );
      } else if (error.status === 401) {
        // Wrong password - show attempts remaining
        const attemptsRemaining = error.data?.attemptsRemaining || 0;
        if (attemptsRemaining > 0) {
          Alert.alert(
            getTranslation('incorrectPassword', language),
            getTranslation('attemptsRemaining', language).replace('{count}', attemptsRemaining),
            [{ text: getTranslation('ok', language) }]
          );
        } else {
          Alert.alert(
            getTranslation('error', language),
            error.message || getTranslation('passwordVerificationFailed', language)
          );
        }
      } else {
        // Other errors
        Alert.alert(
          getTranslation('error', language),
          error.message || getTranslation('passwordVerificationFailed', language)
        );
      }
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

  const handleVideoPress = (videoId) => {
    // Open video view modal
    setSelectedVideo({
      url: videoId,
      title: localPost.content || 'Untitled Video',
      author: localPost.author
    });
    setModalVideoPlaying(true);
    setModalVideoMuted(false);
    setVideoViewModalVisible(true);
  };

  const handleModalVideoStatus = (status) => {
    if (!status.isLoaded) {
      return;
    }
    setModalVideoPlaying(status.isPlaying);
    setModalVideoMuted(status.isMuted);
    if (status.didJustFinish) {
      setModalVideoPlaying(false);
      // Reset to start so play button restarts video
      if (modalVideoRef.current) {
        modalVideoRef.current.setPositionAsync(0);
      }
    }
  };

  const toggleModalVideoPlay = () => {
    if (!modalVideoRef.current) return;
    if (modalVideoPlaying) {
      modalVideoRef.current.pauseAsync();
    } else {
      modalVideoRef.current.playAsync();
    }
  };

  const toggleModalVideoMute = () => {
    if (!modalVideoRef.current) return;
    modalVideoRef.current.setIsMutedAsync(!modalVideoMuted);
    setModalVideoMuted(!modalVideoMuted);
  };

  const handleVideoViewComment = () => {
    // Close video view modal and open comment modal
    setVideoViewModalVisible(false);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setCommentModalVisible(true);
    }, 100);
  };

  const handleVideoLoad = (videoId, status) => {
    if (status.isLoaded) {
      setVideoDuration(prev => ({
        ...prev,
        [videoId]: status.durationMillis
      }));
      setVideoLoading(prev => ({
        ...prev,
        [videoId]: false
      }));
    }
  };

  // Initialize loading state for videos
  React.useEffect(() => {
    const videos = mediaArray.filter(item => item.type === 'video');
    const loadingState = {};
    videos.forEach(video => {
      loadingState[video.url] = true;
    });
    setVideoLoading(loadingState);
  }, [mediaArray.length]); // Only depend on length to prevent unnecessary re-runs

  const handleVideoProgress = (videoId, status) => {
    if (status.isLoaded && status.positionMillis !== undefined) {
      // Clear existing timeout
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
      
      // Debounce progress updates to reduce re-renders
      progressUpdateTimeoutRef.current = setTimeout(() => {
        setVideoProgress(prev => {
          // Only update if the position actually changed
          if (prev[videoId] !== status.positionMillis) {
            return {
              ...prev,
              [videoId]: status.positionMillis
            };
          }
          return prev;
        });
      }, 100); // Update every 100ms instead of every frame
    }
  };

  const handleVideoError = (videoId, error) => {
    console.error('Video error:', error);
    setVideoLoading(prev => ({
      ...prev,
      [videoId]: false
    }));
  };

  const formatVideoTime = (milliseconds) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const stopMusicPreview = async () => {
    try {
      if (musicSoundRef.current) {
        await musicSoundRef.current.stopAsync().catch(() => null);
        await musicSoundRef.current.unloadAsync().catch(() => null);
        musicSoundRef.current = null;
      }
    } finally {
      setIsMusicPlaying(false);
    }
  };

  const startMusicPreview = async () => {
    const track = localPost?.spotifyTrack;
    if (!track?.previewUrl) {
      Alert.alert('No Preview', 'This track does not have a preview available.');
      return;
    }

    if (musicLoading) return;

    try {
      setMusicLoading(true);

      // On iOS: allow music to play when device is in silent/muted mode (ring switch)
      if (Platform.OS === 'ios') {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            interruptionModeIOS: 1, // DuckOthers
            shouldDuckAndroid: true,
            interruptionModeAndroid: 1,
            playThroughEarpieceAndroid: false,
          });
        } catch (e) {
          if (__DEV__) console.warn('Audio mode set failed:', e);
        }
      }

      // If we already have a loaded sound, just resume it
      if (musicSoundRef.current) {
        const existing = musicSoundRef.current;
        const status = await existing.getStatusAsync().catch(() => null);
        if (status?.isLoaded) {
          try {
            await existing.setIsMutedAsync(isGlobalMusicMuted);
          } catch (_) {}
          await existing.playAsync();
          setIsMusicPlaying(true);
          return;
        } else {
          musicSoundRef.current = null;
        }
      }

      // Otherwise create a new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true, volume: 1, isMuted: isGlobalMusicMuted }
      );
      musicSoundRef.current = sound;

      // Ensure mute state is applied (in case platform ignores initial flag)
      try {
        await sound.setIsMutedAsync(isGlobalMusicMuted);
      } catch (_) {}
      setIsMusicPlaying(true);

      // Auto-stop at 30s (or when preview ends)
      const stopAtMs = 30000;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status?.isLoaded) return;
        if (status.didJustFinish) {
          stopMusicPreview();
          return;
        }
        if (typeof status.positionMillis === 'number' && status.positionMillis >= stopAtMs) {
          stopMusicPreview();
        }
      });
    } catch (error) {
      console.error('Music preview error:', error);
      Alert.alert('Playback Error', 'Could not play the preview.');
      await stopMusicPreview();
    } finally {
      setMusicLoading(false);
    }
  };

  // Stop music when user leaves Feed tab (e.g. goes to Chats, Notifications, Profile)
  useEffect(() => {
    if (!feedFocused) {
      stopMusicPreview();
    }
  }, [feedFocused]);

  // Auto-play music preview when this post is highlighted (center of feed)
  // and global mute is OFF. Stop when not highlighted or when globally muted.
  useEffect(() => {
    const track = localPost?.spotifyTrack;
    if (!track?.previewUrl) {
      stopMusicPreview();
      return;
    }

    if (isHighlighted && !isGlobalMusicMuted && feedFocused) {
      startMusicPreview();
    } else {
      stopMusicPreview();
    }
  }, [isHighlighted, isGlobalMusicMuted, feedFocused, localPost?.spotifyTrack?.previewUrl]);

  const getVideoProgressPercentage = (videoId) => {
    const progress = videoProgress[videoId] || 0;
    const duration = videoDuration[videoId] || 1;
    return (progress / duration) * 100;
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
            <View style={[styles.videoContainer, { borderColor: colors.border }]}>
              <Video
                ref={videoRef}
                source={{ uri: mediaItem.url }}
                style={styles.videoPlayer}
                useNativeControls={false}
                resizeMode="cover"
                shouldPlay={videoPlaying[mediaItem.url] || false}
                isLooping={false}
                isMuted={true}
                shouldCorrectPitch={false}
                onLoad={(status) => handleVideoLoad(mediaItem.url, status)}
                onPlaybackStatusUpdate={(status) => handleVideoProgress(mediaItem.url, status)}
                onError={(error) => handleVideoError(mediaItem.url, error)}
              />
              
              {/* Video Controls Overlay - Only show play button when video is not playing */}
              {!videoPlaying[mediaItem.url] && (
                <TouchableOpacity 
                  onPress={() => handleVideoPress(mediaItem.url)}
                  activeOpacity={0.9}
                  style={styles.videoControlsOverlay}
                >
                  <View style={styles.videoPlayButton}>
                    <Ionicons 
                      name="play-circle" 
                      size={48} 
                      color="#ffffff" 
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
               <View style={[styles.videoContainer, { borderColor: colors.border }]}>
                 <Video
                   ref={videoRef}
                   source={{ uri: firstItem.url }}
                   style={styles.videoPlayer}
                   useNativeControls={false}
                   resizeMode="cover"
                   shouldPlay={videoPlaying[firstItem.url] || false}
                   isLooping={false}
                   isMuted={true}
                   onLoad={(status) => handleVideoLoad(firstItem.url, status)}
                   onPlaybackStatusUpdate={(status) => handleVideoProgress(firstItem.url, status)}
                   onError={(error) => handleVideoError(firstItem.url, error)}
                 />
                 
                 {/* Video Controls Overlay - Only show play button when video is not playing */}
                 {!videoPlaying[firstItem.url] && (
                   <TouchableOpacity 
                     onPress={() => handleVideoPress(firstItem.url)}
                     activeOpacity={0.9}
                     style={styles.videoControlsOverlay}
                   >
                     <View style={styles.videoPlayButton}>
                       <Ionicons 
                         name="play-circle" 
                         size={48} 
                         color="#ffffff" 
                       />
                     </View>
                   </TouchableOpacity>
                 )}
               </View>
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: 'transparent',
          shadowColor: colors.shadow,
        },
      ]}
    >
      
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
          <TouchableOpacity style={styles.moreButton} onPress={() => setShowPostMenu(true)}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Anchored dropdown for post menu */}
      {showPostMenu && (
        <>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setShowPostMenu(false)}
          />
          <View style={[
            styles.postMenuDropdown,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}>
            <TouchableOpacity
              style={styles.postMenuItem}
              onPress={() => {
                setShowPostMenu(false);
                handleHidePost();
              }}
            >
              <Ionicons 
                name={localPost.isHidden ? 'eye' : 'eye-off'} 
                size={20} 
                color={colors.text} 
              />
                             <Text style={[styles.postMenuItemText, { color: colors.text }]}>
                 {localPost.isHidden 
                   ? (localPost.hiddenReason === 'privacy_change' 
                       ? getTranslation('postHiddenByPrivacy', language) 
                       : getTranslation('showPost', language))
                   : getTranslation('hidePost', language)
                 }
               </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postMenuItem}
              onPress={() => {
                setShowPostMenu(false);
                handleDeletePost();
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.postMenuItemText, { color: colors.error }]}>
                {getTranslation('delete', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

             {/* Hidden Post Banner */}
       {localPost.isHidden && (
         <View style={[styles.hiddenPostBanner, { backgroundColor: colors.surfaceVariant }]}>
           <Ionicons name="eye-off" size={16} color={colors.textSecondary} />
           <Text style={[styles.hiddenPostBannerText, { color: colors.textSecondary }]}>
             {localPost.hiddenReason === 'privacy_change' 
               ? getTranslation('hiddenPostPrivacyChange', language)
               : getTranslation('hiddenPost', language)
             }
           </Text>
         </View>
       )}

      {/* Spotify Track (mini label above content) - tappable to play/pause */}
      {localPost.spotifyTrack && 
       typeof localPost.spotifyTrack === 'object' && 
       localPost.spotifyTrack.name && 
       localPost.spotifyTrack.artist && (
        <View style={styles.spotifyContainer}>
          <TouchableOpacity
            style={[styles.musicCard, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => {
              if (!localPost.spotifyTrack?.previewUrl) return;
              if (isMusicPlaying) {
                stopMusicPreview();
              } else {
                startMusicPreview();
              }
            }}
            activeOpacity={0.7}
            disabled={!localPost.spotifyTrack?.previewUrl}
          >
            <View style={styles.musicLabelLeft}>
              <Ionicons
                name={isMusicPlaying ? 'pause' : 'musical-notes'}
                size={14}
                color={colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.musicTitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {localPost.spotifyTrack.name} · {localPost.spotifyTrack.artist}
              </Text>
            </View>
            {localPost.spotifyTrack.previewUrl && onToggleGlobalMusicMute ? (
              <TouchableOpacity
                style={styles.musicMuteButton}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onToggleGlobalMusicMute();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isGlobalMusicMuted ? 'volume-mute' : 'volume-high'}
                  size={14}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : localPost.spotifyTrack.previewUrl ? (
              <Ionicons
                name={isMusicPlaying ? 'pause-circle' : 'play-circle'}
                size={20}
                color={colors.primary}
                style={{ marginLeft: 8 }}
              />
            ) : null}
          </TouchableOpacity>
        </View>
      )}

      {/* Post Content */}
      {localPost.content && typeof localPost.content === 'string' && localPost.content.trim() !== '' && (() => {
        const isLockedPost = localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id;
        const shouldHideContent = isLockedPost && !Boolean(localPost.showDescription);

        if (shouldHideContent) {
          return (
            <View style={[styles.lockedContentContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
              <Text style={[styles.lockedContentText, { color: colors.text }]}>
                {getTranslation('descriptionLocked', language)}
              </Text>
              <TouchableOpacity
                style={[styles.unlockButton, { backgroundColor: colors.primary }]}
                onPress={handleSecretPostPress}
                activeOpacity={0.85}
              >
                <Ionicons name="key-outline" size={16} color="#fff" style={styles.unlockButtonIcon} />
                <Text style={styles.unlockButtonText}>{getTranslation('unlock', language) || 'Unlock'}</Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <View style={styles.contentContainer}>
            {isLockedPost && (
              <View style={styles.lockIconContainer}>
                <Ionicons 
                  name="lock-closed" 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </View>
            )}
            <Text style={[styles.content, { color: colors.text }]}>
              {localPost.content}
            </Text>
          </View>
        );
      })()}

      {/* Post Media */}
      {localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user?._id ? (
        // Show locked media placeholder for secret posts (regardless of showDescription)
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
            <Text style={[styles.secretMediaSubtext, { color: colors.textSecondary }]}>
              Enter password to view
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        // Show actual media for non-secret posts or unlocked secret posts
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

      {/* Temporary Clips Modal - Temporarily hidden
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
      */}

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

      {/* Video View Modal */}
      <Modal
        visible={videoViewModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setVideoViewModalVisible(false)}
      >
        <View style={styles.videoViewModalContainer}>
          {/* Video View Header */}
          <View style={[styles.videoViewHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.videoViewCloseButton}
              onPress={() => setVideoViewModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            {selectedVideo && (
              <View style={styles.videoViewInfo}>
                <Text style={styles.videoViewTitle} numberOfLines={1}>
                  {selectedVideo.title}
                </Text>
                <Text style={styles.videoViewAuthor}>
                  {selectedVideo.author?.name || 'Unknown User'}
                </Text>
              </View>
            )}
          </View>

          {/* Full Screen Video Player */}
          {selectedVideo && (
            <View style={styles.videoViewPlayerContainer}>
              <Video
                ref={modalVideoRef}
                source={{ uri: selectedVideo.url }}
                style={styles.videoViewPlayer}
                useNativeControls={false}
                resizeMode="contain"
                shouldPlay={videoViewModalVisible}
                isLooping={false}
                onPlaybackStatusUpdate={handleModalVideoStatus}
                onError={(error) => {
                  console.error('Video error in view modal:', error);
                }}
              />
              <View style={styles.videoViewControls}>
                <TouchableOpacity
                  style={styles.videoViewControlButton}
                  onPress={toggleModalVideoPlay}
                >
                  <Ionicons
                    name={modalVideoPlaying ? 'pause' : 'play'}
                    size={20}
                    color="#ffffff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.videoViewControlButton}
                  onPress={toggleModalVideoMute}
                >
                  <Ionicons
                    name={modalVideoMuted ? 'volume-mute' : 'volume-high'}
                    size={20}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Video View Actions */}
          <View style={styles.videoViewActions}>
            <TouchableOpacity 
              style={styles.videoViewActionButton}
              onPress={handleLike}
              disabled={liking}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#ff4757" : "#ffffff"} 
                style={liking ? { opacity: 0.5 } : {}}
              />
              <Text style={[styles.videoViewActionText, liking ? { opacity: 0.5 } : {}]}>
                {Array.isArray(localPost.likes) ? String(localPost.likes.length) : '0'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.videoViewActionButton}
              onPress={handleVideoViewComment}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
              <Text style={styles.videoViewActionText}>
                {Array.isArray(localPost.comments) ? String(localPost.comments.length) : '0'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Removed old centered Post Menu Modal in favor of anchored dropdown */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 0,
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
    position: 'relative',
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
  lockedContentContainer: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  lockedContentText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  unlockButtonIcon: {
    marginRight: 6,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  videoPlayButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 8,
  },
  videoLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 16,
  },
  videoProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  videoProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  videoProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  videoTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTimeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
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
  videoViewModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoViewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  videoViewCloseButton: {
    padding: 10,
  },
  videoViewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  videoViewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoViewAuthor: {
    color: '#888',
    fontSize: 14,
  },
  videoViewPlayerContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoViewPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoViewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 12,
  },
  videoViewControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoViewActions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  videoViewActionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  videoViewActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  highlightBar: {},
  
  // Hidden Post Banner Styles
  hiddenPostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  hiddenPostBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hiddenPostBannerSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
  
  // Post Menu Styles
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  postMenuDropdown: {
    position: 'absolute',
    top: 32,
    right: 8,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  postMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  spotifyContainer: {
    marginTop: 12,
    marginHorizontal: 0,
  },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  musicLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  musicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  musicArt: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  musicArtFallback: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicInfo: {
    flex: 1,
    marginLeft: 10,
  },
  musicTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  musicArtist: {
    fontSize: 12,
    fontWeight: '500',
  },
  musicMuteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Post; 
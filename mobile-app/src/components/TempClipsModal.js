import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import socketService from '../services/socket';
import apiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TempClipsModal = ({ 
  visible = false, 
  onClose, 
  clickedVideo = null,
  allVideos = [],
  user = null,
  post = null
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [selectedVideo, setSelectedVideo] = useState(clickedVideo);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (clickedVideo) {
      setSelectedVideo(clickedVideo);
      setIsPlaying(true);
    }
  }, [clickedVideo]);

  // Load comments when post changes
  useEffect(() => {
    if (post && post._id) {
      loadComments();
    }
  }, [post]);

  // Socket listeners for real-time comments
  useEffect(() => {
    if (post && post._id) {
      // Join post room for real-time updates
      socketService.joinPostRoom(post._id);
      
      // Listen for real-time comment additions
      const handleCommentAdded = (data) => {
        if (data.postId === post._id) {
          setComments(prevComments => {
            // Check if comment already exists to avoid duplicates
            const commentExists = prevComments.some(comment => comment._id === data.comment._id);
            if (commentExists) {
              return prevComments;
            }
            return [data.comment, ...prevComments];
          });
        }
      };
      
      socketService.onCommentAdded(handleCommentAdded);
      
      return () => {
        socketService.offCommentAdded(handleCommentAdded);
        socketService.leavePostRoom(post._id);
      };
    }
  }, [post]);

  const loadComments = async () => {
    if (!post || !post._id) return;
    
    try {
      setLoadingComments(true);
      const response = await apiService.getComments(post._id);
      if (response.success) {
        setComments(response.data.post.comments || []);
      } else {
        console.error('Failed to load comments:', response.message);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !user || !post) return;
    
    setSubmitting(true);
    try {
      const response = await apiService.addComment(post._id, commentText.trim());
      if (response.success) {
        // Comment will be added via socket real-time update
        setCommentText('');
      } else {
        console.error('Failed to submit comment:', response.message);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
      <View style={styles.commentAvatar}>
        {item.author?.avatar ? (
          <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
          </View>
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: colors.text }]}>
            {item.author?.name || 'Unknown User'}
          </Text>
          <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  const formatTimeAgo = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'яг одоо';
      if (minutes < 60) return String(minutes) + 'м';
      if (hours < 24) return String(hours) + 'ц';
      if (days < 7) return String(days) + 'ө';
      return date.toLocaleDateString('mn-MN');
    } catch (error) {
      return 'яг одоо';
    }
  };

  const renderVideoItem = (video, index) => {
    const isSelected = selectedVideo && selectedVideo._id === video._id;
    
    return (
      <TouchableOpacity
        key={video._id || index}
        style={[
          styles.videoItem,
          { 
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : colors.border 
          }
        ]}
        onPress={() => handleVideoSelect(video)}
        activeOpacity={0.7}
      >
        <Video
          source={{ uri: video.url }}
          style={styles.videoThumbnail}
          resizeMode="cover"
          shouldPlay={false}
          isMuted={true}
          isLooping={false}
        />
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={24} color="#ffffff" />
        </View>
        <View style={styles.videoInfo}>
          <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
            {video.title || 'Untitled Video'}
          </Text>
          <Text style={[styles.videoAuthor, { color: colors.textSecondary }]}>
            {video.author?.name || 'Unknown Author'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Clips
          </Text>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Main Video Player */}
          {selectedVideo && (
            <View style={styles.mainVideoContainer}>
              <TouchableOpacity 
                style={styles.videoWrapper}
                onPress={handleVideoPress}
                activeOpacity={1}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.url }}
                  style={styles.mainVideo}
                  resizeMode="contain"
                  shouldPlay={isPlaying}
                  isLooping={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded) {
                      setIsPlaying(status.isPlaying);
                    }
                  }}
                />
                
                {/* Custom Video Controls Overlay */}
                {showControls && (
                  <View style={styles.videoControlsOverlay}>
                    <TouchableOpacity 
                      style={styles.playPauseButton}
                      onPress={togglePlayPause}
                    >
                      <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={40} 
                        color="#ffffff" 
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Video Info Overlay */}
                <View style={[
                  styles.mainVideoInfo,
                  { opacity: isPlaying ? 0.3 : 1 }
                ]}>
                  <Text style={styles.mainVideoTitle}>
                    {selectedVideo.title || 'Untitled Video'}
                  </Text>
                  <Text style={styles.mainVideoAuthor}>
                    {selectedVideo.author?.name || 'Unknown Author'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Comments Section */}
          <View style={[styles.commentsSection, { backgroundColor: colors.background }]}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>
              Comments ({comments.length})
            </Text>
            
            {loadingComments ? (
              <View style={styles.loadingComments}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading comments...
                </Text>
              </View>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  mainVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playPauseButton: {
    padding: 20,
  },
  mainVideoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  mainVideoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  mainVideoAuthor: {
    fontSize: 14,
    color: '#cccccc',
  },
  videoList: {
    flex: 1,
  },
  videoListContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  videoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: 120,
    height: 80,
    backgroundColor: '#111',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoAuthor: {
    fontSize: 12,
  },
  commentsSection: {
    flex: 1,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  commentInputContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingComments: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});

export default TempClipsModal; 
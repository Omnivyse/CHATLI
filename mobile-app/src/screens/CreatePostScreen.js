import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Audio } from 'expo-av';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import ImageViewerModal from '../components/ImageViewerModal';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import SpotifyMusicPicker from '../components/SpotifyMusicPicker';
import SpotifyTrack from '../components/SpotifyTrack';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const CreatePostScreen = ({ navigation, user }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { language } = useLanguage();
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSecretPost, setIsSecretPost] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [testCounter, setTestCounter] = useState(0);
  const [privacySettings, setPrivacySettings] = useState(null);
  const [loadingPrivacySettings, setLoadingPrivacySettings] = useState(false);
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState(null);
  const [showSpotifyPicker, setShowSpotifyPicker] = useState(false);
  const [showMusicEdit, setShowMusicEdit] = useState(false);
  const [musicStartTime, setMusicStartTime] = useState(0); // Start time in seconds
  const [musicPosition, setMusicPosition] = useState(0); // Current playback position
  const [musicDuration, setMusicDuration] = useState(0); // Total track duration
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const musicSoundRef = useRef(null);
  const musicPositionIntervalRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressBarWidth = useRef(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Monitor showDescription state changes
  useEffect(() => {
    console.log('showDescription state changed to:', showDescription);
  }, [showDescription]);

  // Monitor test counter state changes
  useEffect(() => {
    console.log('testCounter state changed to:', testCounter);
  }, [testCounter]);

  // Initialize music duration when track is selected
  useEffect(() => {
    if (selectedSpotifyTrack) {
      const duration = selectedSpotifyTrack.duration || 
                      selectedSpotifyTrack.durationMs || 
                      selectedSpotifyTrack.trackTimeMillis || 
                      30000; // Default 30 seconds for preview
      setMusicDuration(duration / 1000); // Convert to seconds
      setMusicStartTime(0);
      setMusicPosition(0);
    }
  }, [selectedSpotifyTrack]);

  // Cleanup music playback when component unmounts or track changes
  useEffect(() => {
    return () => {
      stopMusicPlayback();
    };
  }, []);

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle music play/pause
  const handleMusicPlayPause = async () => {
    if (!selectedSpotifyTrack?.previewUrl) {
      Alert.alert('No Preview', 'This track does not have a preview available.');
      return;
    }

    if (isMusicPlaying) {
      await pauseMusicPlayback();
    } else {
      await startMusicPlayback();
    }
  };

  // Start music playback
  const startMusicPlayback = async () => {
    try {
      if (!selectedSpotifyTrack?.previewUrl) return;

      // If sound exists, resume it
      if (musicSoundRef.current) {
        await musicSoundRef.current.playAsync();
        setIsMusicPlaying(true);
        startPositionTracking();
        return;
      }

      // Create new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: selectedSpotifyTrack.previewUrl },
        { shouldPlay: true, volume: 1 }
      );
      musicSoundRef.current = sound;
      setIsMusicPlaying(true);

      // Seek to start position
      if (musicStartTime > 0) {
        await sound.setPositionAsync(musicStartTime * 1000);
      }

      // Set up playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          const positionSeconds = status.positionMillis / 1000;
          setMusicPosition(positionSeconds);

          // Stop if reached end of 15-second segment or end of track
          if (positionSeconds >= musicStartTime + 15 || status.didJustFinish) {
            pauseMusicPlayback();
          }
        }
      });

      startPositionTracking();
    } catch (error) {
      console.error('Error playing music:', error);
      Alert.alert('Playback Error', 'Could not play the preview.');
    }
  };

  // Pause music playback
  const pauseMusicPlayback = async () => {
    try {
      if (musicSoundRef.current) {
        await musicSoundRef.current.pauseAsync();
        setIsMusicPlaying(false);
        stopPositionTracking();
      }
    } catch (error) {
      console.error('Error pausing music:', error);
    }
  };

  // Stop music playback
  const stopMusicPlayback = async () => {
    try {
      if (musicPositionIntervalRef.current) {
        clearInterval(musicPositionIntervalRef.current);
        musicPositionIntervalRef.current = null;
      }
      if (musicSoundRef.current) {
        await musicSoundRef.current.stopAsync();
        await musicSoundRef.current.unloadAsync();
        musicSoundRef.current = null;
      }
      setIsMusicPlaying(false);
      setMusicPosition(0);
    } catch (error) {
      console.error('Error stopping music:', error);
    }
  };

  // Seek to position
  const seekToPosition = async (seconds) => {
    try {
      if (musicSoundRef.current) {
        await musicSoundRef.current.setPositionAsync(seconds * 1000);
        setMusicPosition(seconds);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  // Start position tracking
  const startPositionTracking = () => {
    if (musicPositionIntervalRef.current) {
      clearInterval(musicPositionIntervalRef.current);
    }
    musicPositionIntervalRef.current = setInterval(async () => {
      if (musicSoundRef.current && isMusicPlaying) {
        try {
          const status = await musicSoundRef.current.getStatusAsync();
          if (status.isLoaded) {
            const positionSeconds = status.positionMillis / 1000;
            setMusicPosition(positionSeconds);

            // Auto-pause if reached end of 15-second segment
            if (positionSeconds >= musicStartTime + 15) {
              await pauseMusicPlayback();
            }
          }
        } catch (error) {
          console.error('Error getting position:', error);
        }
      }
    }, 100); // Update every 100ms
  };

  // Stop position tracking
  const stopPositionTracking = () => {
    if (musicPositionIntervalRef.current) {
      clearInterval(musicPositionIntervalRef.current);
      musicPositionIntervalRef.current = null;
    }
  };

  // Load user's privacy settings
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        setLoadingPrivacySettings(true);
        const response = await api.getPrivacySettings();
        if (response.success && response.data) {
          setPrivacySettings(response.data);
          
          // If user has private account and is trying to create secret post, reset it
          if (response.data.isPrivateAccount && isSecretPost) {
            setIsSecretPost(false);
            setSecretPassword('');
            setShowPasswordInput(false);
            setShowDescription(false);
          }
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      } finally {
        setLoadingPrivacySettings(false);
      }
    };

    loadPrivacySettings();
  }, []);

  // Monitor privacy settings changes and reset secret post if needed
  useEffect(() => {
    if (privacySettings?.isPrivateAccount && isSecretPost) {
      setIsSecretPost(false);
      setSecretPassword('');
      setShowPasswordInput(false);
      setShowDescription(false);
    }
  }, [privacySettings?.isPrivateAccount, isSecretPost]);

  // Initialize music duration when track is selected
  useEffect(() => {
    if (selectedSpotifyTrack) {
      const duration = selectedSpotifyTrack.duration || 
                      selectedSpotifyTrack.durationMs || 
                      selectedSpotifyTrack.trackTimeMillis || 
                      30000; // Default 30 seconds for preview
      setMusicDuration(duration / 1000); // Convert to seconds
      setMusicStartTime(0);
      setMusicPosition(0);
    }
  }, [selectedSpotifyTrack]);

  // Cleanup music playback when component unmounts
  useEffect(() => {
    return () => {
      stopMusicPlayback();
    };
  }, []);

  // Handle progress bar touch
  const handleProgressBarPress = (evt) => {
    if (progressBarWidth.current > 0 && musicDuration > 15) {
      const x = evt.nativeEvent.locationX;
      const percentage = Math.max(0, Math.min(1, x / progressBarWidth.current));
      // Map percentage to full duration, then clamp to ensure 15-second segment fits
      const maxStartTime = Math.max(0, musicDuration - 15);
      const newStartTime = Math.max(0, Math.min(maxStartTime, percentage * musicDuration));
      console.log('Progress bar touch - x:', x, 'percentage:', percentage, 'newStartTime:', newStartTime, 'duration:', musicDuration);
      setMusicStartTime(newStartTime);
      seekToPosition(newStartTime);
    }
  };

  // Store initial touch position and container position for drag calculation
  const initialTouchX = useRef(0);
  const initialStartTime = useRef(0);
  const containerX = useRef(0);
  const progressBarContainerRef = useRef(null);

  // PanResponder for dragging the progress bar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        // Get container position
        if (progressBarContainerRef.current) {
          progressBarContainerRef.current.measure((x, y, width, height, pageX, pageY) => {
            containerX.current = pageX;
          });
        }
        console.log('PanResponder Grant - locationX:', evt.nativeEvent.locationX, 'pageX:', evt.nativeEvent.pageX);
        setIsDragging(true);
        if (isMusicPlaying) {
          pauseMusicPlayback();
        }
        // Store initial values - use locationX for container-relative position
        initialTouchX.current = evt.nativeEvent.locationX;
        initialStartTime.current = musicStartTime;
        handleProgressBarPress(evt);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (progressBarWidth.current > 0 && musicDuration > 15) {
          // Calculate new position based on drag distance from initial touch
          const currentX = initialTouchX.current + gestureState.dx;
          const clampedX = Math.max(0, Math.min(progressBarWidth.current, currentX));
          const percentage = Math.max(0, Math.min(1, clampedX / progressBarWidth.current));
          const maxStartTime = Math.max(0, musicDuration - 15);
          const newStartTime = Math.max(0, Math.min(maxStartTime, percentage * musicDuration));
          console.log('Dragging - dx:', gestureState.dx, 'currentX:', currentX, 'newStartTime:', newStartTime);
          setMusicStartTime(newStartTime);
          seekToPosition(newStartTime);
        }
      },
      onPanResponderRelease: () => {
        console.log('PanResponder Release');
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        console.log('PanResponder Terminate');
        setIsDragging(false);
      },
    })
  ).current;

  const handleSelectMedia = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission', 'Media library permission is required to select photos/videos.');
        return;
      }

      // Launch image picker with multiple selection enabled
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false, // Disable editing for multiple selection
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: true, // Enable multiple selection
        selectionLimit: 5, // Allow up to 5 images/videos
      });

      if (!result.canceled && result.assets?.length > 0) {
        // Handle multiple selected assets
        const newMediaItems = [];
        
        for (const asset of result.assets) {
          let thumbnail = null;
          if (asset.type === 'video') {
            try {
              const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
                time: 1000,
              });
              thumbnail = uri;
            } catch (e) {
              console.log('Error generating thumbnail:', e);
            }
          }

          const newMedia = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
            uri: asset.uri,
            type: asset.type,
            width: asset.width,
            height: asset.height,
            thumbnail: thumbnail,
          };

          newMediaItems.push(newMedia);
        }

        // Add all selected media to the existing selection
        setSelectedMedia(prev => [...prev, ...newMediaItems]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media file');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission', 'Camera permission is required to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        
        const newMedia = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          thumbnail: null,
        };

        setSelectedMedia(prev => [...prev, newMedia]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const removeMedia = (mediaId) => {
    setSelectedMedia(prev => prev.filter(media => media.id !== mediaId));
  };

  const uploadMedia = async (mediaItem) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: mediaItem.uri,
        type: mediaItem.type === 'image' ? 'image/jpeg' : 'video/mp4',
        name: 'media_' + String(Date.now()) + '.' + (mediaItem.type === 'image' ? 'jpg' : 'mp4'),
      });

      const response = await api.uploadFile(formData);
      if (response.success) {
        return {
          url: response.data.url,
          type: mediaItem.type,
          thumbnail: mediaItem.thumbnail,
        };
      }
      throw new Error(response.message || 'Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && selectedMedia.length === 0) {
      Alert.alert('Error', 'Please add some content or media to your post.');
      return;
    }

    // Check if user is trying to create a secret post with private account
    if (isSecretPost && privacySettings?.isPrivateAccount) {
      Alert.alert(
        getTranslation('privateAccountRestriction', language),
        getTranslation('privateAccountRestrictionMessage', language) + ' Please change your account to public in Privacy Settings to use this feature.',
        [
          { text: getTranslation('cancel', language), style: 'cancel' },
          { 
            text: 'Go to Privacy Settings', 
            onPress: () => navigation.navigate('Settings')
          }
        ]
      );
      return;
    }

    // Validate secret post password
    if (isSecretPost && (!secretPassword || secretPassword.length !== 4)) {
      Alert.alert('Error', 'Secret posts require a 4-digit password.');
      return;
    }

    if (isSecretPost && !/^\d{4}$/.test(secretPassword)) {
      Alert.alert('Error', 'Password must contain only digits.');
      return;
    }

    setLoading(true);
    try {
      // Upload media first
      const uploadedMedia = [];
      if (selectedMedia.length > 0) {
        setUploadingMedia(true);
        for (const media of selectedMedia) {
          const uploadedItem = await uploadMedia(media);
          if (uploadedItem) {
            uploadedMedia.push(uploadedItem);
          }
        }
        setUploadingMedia(false);
      }

      // Create post data
      const postData = {
        content: content.trim(),
        media: uploadedMedia,
        spotifyTrack: selectedSpotifyTrack,
        isSecret: isSecretPost,
        secretPassword: isSecretPost ? secretPassword : undefined,
        showDescription: isSecretPost ? showDescription : undefined
      };
      
      console.log('📤 Creating post with data:', {
        content: postData.content.substring(0, 50) + '...',
        isSecret: postData.isSecret,
        showDescription: postData.showDescription,
        showDescriptionType: typeof postData.showDescription,
        hasPassword: !!postData.secretPassword,
        spotifyTrack: selectedSpotifyTrack ? {
          name: selectedSpotifyTrack.name,
          artist: selectedSpotifyTrack.artist,
          duration: selectedSpotifyTrack.duration,
          formattedDuration: selectedSpotifyTrack.formattedDuration,
          trackId: selectedSpotifyTrack.trackId,
          allKeys: Object.keys(selectedSpotifyTrack)
        } : null
      });

      const response = await api.createPost(postData);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          isSecretPost ? 'Secret post created successfully!' : 'Post created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setContent('');
                setSelectedMedia([]);
                setSelectedSpotifyTrack(null);
                setIsSecretPost(false);
                setSecretPassword('');
                setShowPasswordInput(false);
                setShowDescription(false);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (index) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const renderMediaItem = (media, index) => (
    <View key={media.id} style={styles.mediaItem}>
      <TouchableOpacity 
        onPress={() => media.type === 'image' && handleImagePress(index)}
        activeOpacity={media.type === 'image' ? 0.9 : 1}
      >
        <Image
          source={{ uri: media.type === 'video' ? media.thumbnail : media.uri }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      
      {media.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={32} color="rgba(255, 255, 255, 0.8)" />
        </View>
      )}
      
      <TouchableOpacity
        style={styles.removeMediaButton}
        onPress={() => removeMedia(media.id)}
      >
        <Ionicons name="close-circle" size={24} color="rgba(255, 255, 255, 0.9)" />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="#fff" />
      <View style={[styles.container, { backgroundColor: colors.background }] }>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.postButton,
            { backgroundColor: colors.primary },
            (!content.trim() && selectedMedia.length === 0) && styles.postButtonDisabled,
            (isSecretPost && privacySettings?.isPrivateAccount) && styles.postButtonDisabled
          ]}
          onPress={handleCreatePost}
          disabled={loading || (!content.trim() && selectedMedia.length === 0) || (isSecretPost && privacySettings?.isPrivateAccount)}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (isSecretPost && privacySettings?.isPrivateAccount) ? (
            <Text style={[styles.postButtonText, { color: colors.textInverse }]}>{getTranslation('privateAccount', language)}</Text>
          ) : (
            <Text style={[styles.postButtonText, { color: colors.textInverse }]}>{getTranslation('publish', language)}</Text>
          )}
        </TouchableOpacity>
      </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* User Info */}
            <View style={styles.userSection}>
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={[styles.userAvatar, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                  <Image source={require('../../assets/logo.png')} style={styles.userAvatarLogo} resizeMode="contain" />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
          {user.name && typeof user.name === 'string' ? user.name : 'Unknown User'}
        </Text>
                <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
          @{user.username && typeof user.username === 'string' ? user.username : 'unknown'}
        </Text>
              </View>
            </View>

            {/* Content Input */}
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.contentInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder="What are you thinking?"
                placeholderTextColor={colors.placeholder}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                maxLength={2000}
                editable={!loading}
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
              />
              
              {/* Character Count */}
              <View style={styles.characterCount}>
                <Text style={[
                  styles.characterCountText,
                  { color: colors.textTertiary },
                  content.length > 1800 && styles.characterCountWarning,
                  content.length >= 2000 && styles.characterCountError
                ]}>
                  {String(content.length)}/2000
                </Text>
              </View>
            </View>

                        {/* Secret Post Toggle */}
            <View style={[styles.secretPostSection, { backgroundColor: colors.surfaceVariant }]}>
              {loadingPrivacySettings && (
                <View style={styles.privacySettingsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.privacySettingsLoadingText, { color: colors.textSecondary }]}>
                    {getTranslation('loading', language)}...
                  </Text>
                </View>
              )}
              
              {/* Disabled overlay for private accounts */}
              {privacySettings?.isPrivateAccount && !loadingPrivacySettings && (
                <View style={[styles.secretPostDisabledOverlay, { backgroundColor: colors.surfaceVariant }]}>
                  <Ionicons name="lock-closed" size={24} color={colors.error} />
                  <Text style={[styles.secretPostDisabledText, { color: colors.error }]}>
                    {getTranslation('privateAccountRestriction', language)}
                  </Text>
                  <Text style={[styles.secretPostDisabledSubtext, { color: colors.textSecondary }]}>
                    {getTranslation('privateAccountRestrictionMessage', language)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.goToPrivacySettingsButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Text style={[styles.goToPrivacySettingsButtonText, { color: colors.textInverse }]}>
                      {getTranslation('goToPrivacySettings', language)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Info icon for private account restriction */}
              {privacySettings?.isPrivateAccount && !loadingPrivacySettings && (
                <TouchableOpacity
                  style={styles.infoIcon}
                  onPress={() => {
                    Alert.alert(
                      getTranslation('privateAccountRestriction', language),
                      getTranslation('privateAccountRestrictionMessage', language) + '\n\n' + getTranslation('secretPostHelpText', language),
                      [
                        { text: getTranslation('cancel', language), style: 'cancel' },
                        { 
                          text: getTranslation('goToPrivacySettings', language), 
                          onPress: () => navigation.navigate('Settings')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="information-circle" size={20} color={colors.info} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                  style={[
                    styles.secretPostToggle,
                    privacySettings?.isPrivateAccount && { opacity: 0.5 }
                  ]}
                  onPress={() => {
                    // Check if user has private account
                    if (privacySettings?.isPrivateAccount) {
                      Alert.alert(
                        getTranslation('privateAccountRestriction', language),
                        getTranslation('privateAccountRestrictionMessage', language) + ' Please change your account to public in Privacy Settings to use this feature.',
                        [
                          { text: getTranslation('cancel', language), style: 'cancel' },
                          { 
                            text: 'Go to Privacy Settings', 
                            onPress: () => navigation.navigate('Settings')
                          }
                        ]
                      );
                      return;
                    }

                    setIsSecretPost(!isSecretPost);
                    if (!isSecretPost) {
                      setShowPasswordInput(true);
                    } else {
                      setSecretPassword('');
                      setShowPasswordInput(false);
                    }
                  }}
                  activeOpacity={privacySettings?.isPrivateAccount ? 1 : 0.7}
                  disabled={privacySettings?.isPrivateAccount}
                >
                  {privacySettings?.isPrivateAccount && (
                    <View style={[styles.privateAccountOverlay, { backgroundColor: colors.surfaceVariant }]}>
                      <Ionicons name="lock-closed" size={16} color={colors.error} />
                      <Text style={[styles.privateAccountOverlayText, { color: colors.error }]}>
                        {getTranslation('privateProfile', language)}
                      </Text>
                    </View>
                  )}
                <View style={styles.secretPostToggleContent}>
                  <View style={[styles.secretPostIconContainer, { backgroundColor: colors.surface }]}>
                    <Ionicons 
                      name={isSecretPost ? "lock-closed" : "lock-open"} 
                      size={20} 
                      color={isSecretPost ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.secretPostTextContainer}>
                    <Text style={[styles.secretPostText, { color: colors.text }]}>
                      Secret Post
                    </Text>
                    <Text style={[styles.secretPostSubtext, { color: colors.textSecondary }]}>
                      {isSecretPost ? 'Password protected' : 'Public post'}
                    </Text>
                    {privacySettings?.isPrivateAccount && (
                      <Text style={[styles.secretPostRestrictionText, { color: colors.error }]}>
                        {getTranslation('notAvailableForPrivateAccounts', language)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitch,
                  { 
                    backgroundColor: isSecretPost ? colors.primary : colors.border,
                    opacity: privacySettings?.isPrivateAccount ? 0.5 : 1
                  }
                ]}>
                  <View style={[
                    styles.toggleKnob,
                    { 
                      backgroundColor: colors.surface,
                      transform: [{ translateX: isSecretPost ? 16 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Show Description Toggle - Only visible when secret post is enabled and user doesn't have private account */}
            {isSecretPost && !privacySettings?.isPrivateAccount && (
              <View style={[styles.showDescriptionSection, { backgroundColor: colors.surfaceVariant }]}>
                {isWeb ? (
                  // Web-specific toggle button
                  <View style={styles.webToggleContainer}>
                    <TouchableOpacity
                      style={[styles.webToggleButton, { 
                        backgroundColor: showDescription ? colors.primary : colors.surfaceVariant,
                        borderColor: colors.border 
                      }]}
                      onPress={() => {
                        const newValue = !showDescription;
                        console.log('Web toggle pressed - showDescription:', showDescription, '->', newValue);
                        setShowDescription(newValue);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.webToggleButtonText, { 
                        color: showDescription ? colors.textInverse : colors.text 
                      }]}>
                        {showDescription ? 'ON' : 'OFF'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Alternative HTML button for web */}
                    <button
                      style={{
                        backgroundColor: showDescription ? colors.primary : colors.surfaceVariant,
                        color: showDescription ? colors.textInverse : colors.text,
                        border: `2px solid ${colors.border}`,
                        borderRadius: 20,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginLeft: 8,
                        minWidth: 60,
                      }}
                      onClick={() => {
                        const newValue = !showDescription;
                        console.log('HTML button clicked - showDescription:', showDescription, '->', newValue);
                        setShowDescription(newValue);
                      }}
                    >
                      {showDescription ? 'ON' : 'OFF'}
                    </button>
                    
                    {/* Test counter button */}
                    <button
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.textInverse,
                        border: 'none',
                        borderRadius: 20,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginLeft: 8,
                        minWidth: 60,
                      }}
                      onClick={() => {
                        console.log('Counter button clicked - current:', testCounter);
                        setTestCounter(prev => prev + 1);
                      }}
                    >
                      Count: {testCounter}
                    </button>
                  </View>
                ) : (
                  // Mobile toggle with icon and text
                  <TouchableOpacity
                    style={styles.showDescriptionToggle}
                    onPress={() => {
                      const newValue = !showDescription;
                      console.log('Mobile toggle pressed - showDescription:', showDescription, '->', newValue);
                      setShowDescription(newValue);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.showDescriptionToggleContent}>
                      <View style={[styles.showDescriptionIconContainer, { backgroundColor: colors.surface }]}>
                        <Ionicons 
                          name={showDescription ? "eye" : "eye-off"} 
                          size={20} 
                          color={showDescription ? colors.primary : colors.textSecondary} 
                        />
                      </View>
                      <View style={styles.showDescriptionTextContainer}>
                        <Text style={[styles.showDescriptionText, { color: colors.text }]}>
                          {getTranslation('showDescription', language)}
                        </Text>
                        <Text style={[styles.showDescriptionSubtext, { color: colors.textSecondary }]}>
                          {showDescription ? getTranslation('descriptionVisibleWhenLocked', language) : getTranslation('descriptionHiddenWhenLocked', language)}
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.toggleSwitch,
                      { backgroundColor: showDescription ? colors.primary : colors.border }
                    ]}>
                      <View style={[
                        styles.toggleKnob,
                        { 
                          backgroundColor: colors.surface,
                          transform: [{ translateX: showDescription ? 16 : 0 }]
                        }
                      ]} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Secret Post Password Input */}
            {showPasswordInput && isSecretPost && !privacySettings?.isPrivateAccount && (
              <View style={[styles.passwordSection, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.passwordLabel, { color: colors.text }]}>
                  Set 4-digit password:
                </Text>
                <TextInput
                  style={[
                    styles.passwordInput,
                    { 
                      color: colors.text, 
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  value={secretPassword}
                  onChangeText={setSecretPassword}
                  placeholder="0000"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={false}
                  editable={!loading}
                />
                <Text style={[styles.passwordHint, { color: colors.textTertiary }]}>
                  Password must be exactly 4 digits
                </Text>
              </View>
            )}

            {/* Media Preview */}
            {selectedMedia.length > 0 && (
              <View style={styles.mediaSection}>
                <Text style={[styles.mediaSectionTitle, { color: colors.text }]}>
                  Media Files ({selectedMedia.length})
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaScroll}
                >
                  {selectedMedia.map((media, index) => renderMediaItem(media, index))}
                </ScrollView>
              </View>
            )}

            {/* Spotify Track Preview */}
            {selectedSpotifyTrack && (
              <View style={styles.spotifySection}>
                <View style={styles.spotifySectionHeader}>
                  <Text style={[styles.mediaSectionTitle, { color: colors.text }]}>
                    Music
                  </Text>
                  <View style={styles.spotifyHeaderActions}>
                    <TouchableOpacity
                      onPress={() => setShowMusicEdit(!showMusicEdit)}
                      style={styles.editMusicButton}
                    >
                      <Ionicons 
                        name={showMusicEdit ? "checkmark" : "create-outline"} 
                        size={18} 
                        color={colors.primary} 
                      />
                      <Text style={[styles.editMusicButtonText, { color: colors.primary }]}>
                        {showMusicEdit ? "Done" : "Edit"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        await stopMusicPlayback();
                        setSelectedSpotifyTrack(null);
                        setShowMusicEdit(false);
                        setMusicStartTime(0);
                        setMusicPosition(0);
                      }}
                      style={styles.removeSpotifyButton}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <SpotifyTrack 
                  track={selectedSpotifyTrack} 
                  onPress={() => setShowSpotifyPicker(true)}
                  autoPlayPreview
                />
                
                {/* Music Edit Section - 15 Second Selection */}
                {showMusicEdit && selectedSpotifyTrack?.previewUrl && (
                  <View style={[styles.musicEditSection, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.musicEditTitle, { color: colors.text }]}>
                      Choose 15-second segment
                    </Text>
                    <Text style={[styles.musicEditSubtitle, { color: colors.textSecondary }]}>
                      Drag to select start position
                    </Text>
                    
                    {/* Playback Controls */}
                    <View style={styles.playbackControls}>
                      <TouchableOpacity
                        onPress={handleMusicPlayPause}
                        style={[styles.playPauseButton, { backgroundColor: colors.primary }]}
                      >
                        <Ionicons 
                          name={isMusicPlaying ? "pause" : "play"} 
                          size={20} 
                          color={colors.textInverse} 
                        />
                      </TouchableOpacity>
                      <View style={styles.progressContainer}>
                        {/* Progress Bar with 15-second selection */}
                        <View
                          ref={progressBarContainerRef}
                          style={styles.progressBarContainer}
                          onLayout={(event) => {
                            progressBarWidth.current = event.nativeEvent.layout.width;
                            console.log('Progress bar width set to:', progressBarWidth.current);
                          }}
                          {...panResponder.panHandlers}
                        >
                          {/* Background track */}
                          <View style={[styles.progressTrack, { backgroundColor: colors.border }]} pointerEvents="none" />
                          
                          {/* 15-second selection indicator */}
                          <View 
                            style={[
                              styles.selectionIndicator,
                              {
                                left: `${(musicStartTime / Math.max(1, musicDuration)) * 100}%`,
                                width: `${(15 / Math.max(1, musicDuration)) * 100}%`,
                                backgroundColor: colors.primary + '40',
                              }
                            ]} 
                            pointerEvents="none"
                          />
                          
                          {/* Progress indicator (current position) */}
                          {!isDragging && (
                            <View 
                              style={[
                                styles.progressIndicator,
                                {
                                  left: `${(musicPosition / Math.max(1, musicDuration)) * 100}%`,
                                  backgroundColor: colors.primary,
                                }
                              ]} 
                              pointerEvents="none"
                            />
                          )}
                          
                          {/* Draggable thumb */}
                          <View 
                            style={[
                              styles.progressThumb,
                              {
                                left: `${(musicStartTime / Math.max(1, musicDuration)) * 100}%`,
                                backgroundColor: colors.primary,
                              }
                            ]} 
                          />
                        </View>
                        
                        {/* Time Labels */}
                        <View style={styles.timeLabelsRow}>
                          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {formatTime(musicStartTime)}
                          </Text>
                          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {formatTime(Math.min(musicStartTime + 15, musicDuration))}
                          </Text>
                        </View>
                        
                        {/* Current Position */}
                        <Text style={[styles.currentPositionText, { color: colors.text }]}>
                          Current: {formatTime(musicPosition)} / {formatTime(musicDuration)}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Selected Segment Display */}
                    <View style={[styles.selectedSegmentDisplay, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.selectedSegmentLabel, { color: colors.text }]}>
                        Selected Segment: {formatTime(musicStartTime)} - {formatTime(Math.min(musicStartTime + 15, musicDuration))}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          bottom: keyboardHeight,
        }]}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={handleSelectMedia}
              disabled={loading || selectedMedia.length >= 5}
            >
              <Ionicons name="images" size={22} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={handleTakePhoto}
              disabled={loading || selectedMedia.length >= 5}
            >
              <Ionicons name="camera" size={22} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowSpotifyPicker(true)}
              disabled={loading}
            >
              <Ionicons name="musical-notes" size={22} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Music</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.mediaCount, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.mediaCountText, { color: colors.textSecondary }]}>
              {String(selectedMedia.length)}/5
            </Text>
          </View>
        </View>
        
        {/* Image Viewer Modal */}
        <ImageViewerModal
          images={selectedMedia.filter(media => media.type === 'image').map(media => ({ url: media.uri }))}
          initialIndex={selectedImageIndex}
          onClose={() => setImageViewerVisible(false)}
          visible={imageViewerVisible}
        />

        {/* Spotify Music Picker Modal */}
        <SpotifyMusicPicker
          visible={showSpotifyPicker}
          onClose={() => setShowSpotifyPicker(false)}
          onTrackSelect={setSelectedSpotifyTrack}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    padding: 8,
    borderRadius: 20,
  },
  postButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  userAvatarLogo: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: '#666',
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  contentInput: {
    fontSize: 18,
    color: '#000',
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 0,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
  },
  characterCountWarning: {
    color: '#ff9500',
  },
  characterCountError: {
    color: '#ff3b30',
  },
  mediaSection: {
    paddingVertical: 12,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  mediaScroll: {
    paddingLeft: 16,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f0f0',
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
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginLeft: 6,
  },
  mediaCount: {
    backgroundColor: '#f0f0f0',
  },
  spotifySection: {
    paddingVertical: 12,
  },
  spotifySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  spotifyHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editMusicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editMusicButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeSpotifyButton: {
    padding: 4,
  },
  musicEditSection: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  musicEditTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  musicEditSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  timeSelectorContainer: {
    width: '100%',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeLabel: {
    fontSize: 11,
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedTimeDisplay: {
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  selectedTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  playPauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBarContainer: {
    position: 'relative',
    height: 50,
    marginBottom: 8,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 15,
    backgroundColor: 'transparent',
  },
  progressTrack: {
    position: 'absolute',
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  selectionIndicator: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    top: 18,
    pointerEvents: 'none',
  },
  progressIndicator: {
    position: 'absolute',
    width: 2,
    height: 20,
    top: 10,
    borderRadius: 1,
    pointerEvents: 'none',
  },
  progressThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 8,
    marginLeft: -12,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  currentPositionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedSegmentDisplay: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedSegmentLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaCount: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mediaCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  secretPostSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },
  secretPostToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  secretPostToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    flex: 1,
  },
  secretPostIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secretPostTextContainer: {
    flex: 1,
  },
  secretPostText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  secretPostSubtext: {
    fontSize: 12,
  },
  secretPostRestrictionText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  privacySettingsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  privacySettingsLoadingText: {
    fontSize: 12,
    marginLeft: 8,
  },
  privateAccountOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  privateAccountOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  secretPostDisabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    zIndex: 2,
    padding: 16,
  },
  secretPostDisabledText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  secretPostDisabledSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  goToPrivacySettingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
  },
  goToPrivacySettingsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 3,
    padding: 4,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  secretPostDescription: {
    fontSize: 12,
    marginLeft: 10,
  },
  passwordSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInput: {
    fontSize: 18,
    lineHeight: 22,
    minHeight: 48,
    textAlignVertical: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    letterSpacing: 8,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 8,
  },
  showDescriptionSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  showDescriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  showDescriptionToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    flex: 1,
  },
  showDescriptionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  showDescriptionTextContainer: {
    flex: 1,
  },
  showDescriptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  showDescriptionSubtext: {
    fontSize: 12,
    opacity: 0.8,
  },
  webToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  webToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  webToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CreatePostScreen; 
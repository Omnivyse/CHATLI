import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import api from '../services/api';

const { width } = Dimensions.get('window');

const CreatePostScreen = ({ navigation, user }) => {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handleSelectMedia = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Зөвшөөрөл', 'Зураг/видео сонгохын тулд медиа сангийн зөвшөөрөл шаардлагатай.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        
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
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          thumbnail: thumbnail,
        };

        setSelectedMedia(prev => [...prev, newMedia]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Алдаа', 'Медиа файл сонгоход алдаа гарлаа');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Зөвшөөрөл', 'Зураг авахын тулд камерын зөвшөөрөл шаардлагатай.');
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
      Alert.alert('Алдаа', 'Зураг авахад алдаа гарлаа');
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
        name: `media_${Date.now()}.${mediaItem.type === 'image' ? 'jpg' : 'mp4'}`,
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
      Alert.alert('Анхааруулга', 'Пост текст эсвэл медиа файл оруулна уу');
      return;
    }

    setLoading(true);
    setUploadingMedia(true);

    try {
      let mediaUrls = [];
      
      // Upload media files
      if (selectedMedia.length > 0) {
        for (const media of selectedMedia) {
          const uploadedMedia = await uploadMedia(media);
          mediaUrls.push(uploadedMedia);
        }
      }

      setUploadingMedia(false);

      // Create post
      const postData = {
        content: content.trim(),
        media: mediaUrls,
      };

      const response = await api.createPost(postData);
      if (response.success) {
        Alert.alert(
          'Амжилттай',
          'Пост амжилттай үүсгэгдлээ',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Алдаа', response.message || 'Пост үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Алдаа', 'Пост үүсгэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  const renderMediaItem = (media) => (
    <View key={media.id} style={styles.mediaItem}>
      <Image
        source={{ uri: media.type === 'video' ? media.thumbnail : media.uri }}
        style={styles.mediaImage}
        resizeMode="cover"
      />
      
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
    <SafeAreaView style={styles.container}>
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
            (!content.trim() && selectedMedia.length === 0) && styles.postButtonDisabled
          ]}
          onPress={handleCreatePost}
          disabled={loading || (!content.trim() && selectedMedia.length === 0)}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Нийтлэх</Text>
          )}
        </TouchableOpacity>
      </View>

            <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Info */}
          <View style={styles.userSection}>
            <Image
              source={{
                uri: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userHandle}>@{user.username}</Text>
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.contentInput}
              placeholder="Юу бодож байна?"
              placeholderTextColor="#666"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={2000}
              editable={!loading}
            />
            
            {/* Character Count */}
            <View style={styles.characterCount}>
              <Text style={[
                styles.characterCountText,
                content.length > 1800 && styles.characterCountWarning,
                content.length >= 2000 && styles.characterCountError
              ]}>
                {content.length}/2000
              </Text>
            </View>
          </View>

          {/* Media Preview */}
          {selectedMedia.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>Медиа файлууд</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.mediaScroll}
              >
                {selectedMedia.map(renderMediaItem)}
              </ScrollView>
            </View>
          )}

          {/* Upload Progress */}
          {uploadingMedia && (
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.uploadProgressText}>Медиа файл байршуулж байна...</Text>
            </View>
          )}
        </ScrollView>

                {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSelectMedia}
              disabled={loading || selectedMedia.length >= 4}
            >
              <Ionicons name="image" size={22} color="#000" />
              <Text style={styles.actionButtonText}>Медиа</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTakePhoto}
              disabled={loading || selectedMedia.length >= 4}
            >
              <Ionicons name="camera" size={22} color="#000" />
              <Text style={styles.actionButtonText}>Камер</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mediaCount}>
            <Text style={styles.mediaCountText}>
              {selectedMedia.length}/4
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 4,
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
    paddingBottom: 4,
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
    paddingVertical: 4,
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
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mediaCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});

export default CreatePostScreen; 
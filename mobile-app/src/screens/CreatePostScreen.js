import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import apiService from '../services/api';

const CreatePostScreen = ({ navigation, user }) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Зөвшөөрөл хэрэгтэй',
          'Зураг сонгохын тулд зөвшөөрөл өгнө үү',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 4 - selectedImages.length);
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Зураг сонгоход алдаа гарлаа',
      });
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Пост агуулга эсвэл зураг оруулна уу',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('type', 'text');

      // Add images if any
      selectedImages.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        });
      });

      const response = await apiService.createPost(formData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Амжилттай',
          text2: 'Пост амжилттай нийтлэгдлээ',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Алдаа',
          text2: response.message || 'Пост нийтлэхэд алдаа гарлаа',
        });
      }
    } catch (error) {
      console.error('Create post error:', error);
      Toast.show({
        type: 'error',
        text1: 'Алдаа',
        text2: 'Сервертэй холбогдоход алдаа гарлаа',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || selectedImages.length > 0) {
      Alert.alert(
        'Постыг хаях уу?',
        'Таны өөрчлөлтүүд алдагдана',
        [
          { text: 'Үргэлжлүүлэх', style: 'cancel' },
          { text: 'Хаах', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Цуцлах</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Шинэ пост</Text>
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && selectedImages.length === 0) && styles.postButtonDisabled]}
          onPress={createPost}
          disabled={loading || (!content.trim() && selectedImages.length === 0)}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.postButtonText}>Нийтлэх</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#666666" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user.name}</Text>
        </View>

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="Юу бодож байна?"
          placeholderTextColor="#999999"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />

        {/* Character Count */}
        <Text style={styles.characterCount}>{content.length}/500</Text>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesLabel}>Сонгосон зургууд ({selectedImages.length}/4)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickImages}
            disabled={selectedImages.length >= 4}
          >
            <Ionicons 
              name="image-outline" 
              size={24} 
              color={selectedImages.length >= 4 ? "#cccccc" : "#000000"} 
            />
            <Text style={[
              styles.actionButtonText,
              selectedImages.length >= 4 && styles.actionButtonTextDisabled
            ]}>
              Зураг ({selectedImages.length}/4)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  postButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 24,
    color: '#000000',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  imagesContainer: {
    marginVertical: 16,
  },
  imagesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  actionButtons: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  actionButtonTextDisabled: {
    color: '#cccccc',
  },
});

export default CreatePostScreen; 
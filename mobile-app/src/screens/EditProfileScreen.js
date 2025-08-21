import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, Platform, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeColors } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import api from '../services/api';

const EditProfileScreen = ({ navigation, user, onProfileUpdate }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [coverImage, setCoverImage] = useState(user?.coverImage || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  // Refresh images when component mounts to ensure they're up to date
  React.useEffect(() => {
    if (user?.avatar || user?.coverImage) {
      console.log('🔄 Refreshing images on component mount');
      setImageRefreshKey(prev => prev + 1);
    }
  }, [user?.avatar, user?.coverImage]);

  // Force refresh images function
  const forceRefreshImages = () => {
    console.log('🔄 Force refreshing images');
    console.log('📸 Current avatar state:', avatar);
    console.log('🖼️ Current cover image state:', coverImage);
    setImageRefreshKey(prev => prev + 1);
  };

  // Real upload function using API service
  const uploadImage = async (uri, type) => {
    try {
      const file = {
        uri: uri,
        type: 'image/jpeg',
        name: `${type}_${Date.now()}.jpg`,
      };

      let response;
      if (type === 'avatar') {
        response = await api.uploadAvatar(file);
      } else if (type === 'cover') {
        // Temporary workaround: use avatar endpoint for cover images
        // until server is restarted to pick up the new /cover endpoint
        response = await api.uploadAvatar(file);
      } else {
        response = await api.uploadSingleFile(file);
      }

      console.log('📤 Upload response:', response);
      if (response.success) {
        const imageUrl = response.data.url;
        console.log('🖼️ Extracted image URL:', imageUrl);
        return imageUrl;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Image picker logic
  const pickImage = async (type) => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          getTranslation('permissionRequired', language),
          getTranslation('permissionMessage', language)
        );
        return;
      }
      
      // Pick image
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [3, 1] : [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        try {
          const localUri = result.assets[0].uri;
          const uploadedUrl = await uploadImage(localUri, type);
          
          console.log(`📸 Image uploaded successfully for ${type}:`, uploadedUrl);
          // Add timestamp to prevent caching issues
          const timestampedUrl = `${uploadedUrl}?t=${Date.now()}`;
          
          if (type === 'avatar') {
            setAvatar(timestampedUrl);
            setImageRefreshKey(prev => prev + 1);
            console.log('👤 Avatar state updated to:', timestampedUrl);
            // Force immediate refresh
            setTimeout(() => setImageRefreshKey(prev => prev + 1), 100);
          } else {
            setCoverImage(timestampedUrl);
            setImageRefreshKey(prev => prev + 1);
            console.log('🖼️ Cover image state updated to:', timestampedUrl);
            // Force immediate refresh
            setTimeout(() => setImageRefreshKey(prev => prev + 1), 100);
          }
        } catch (uploadError) {
          Alert.alert(
            getTranslation('error', language),
            'Failed to upload image. Please try again.'
          );
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      setUploading(false);
      Alert.alert(
        getTranslation('error', language),
        getTranslation('imageSelectionError', language)
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      // Prepare profile data (username cannot be updated on the server)
      const profileData = {
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar,
        coverImage: coverImage,
      };
      
      console.log('💾 Saving profile data:', profileData);

      // Call API to update profile
      const response = await api.updateProfile(profileData);
      console.log('📡 API response:', response);
      
      if (response.success) {
        // Update parent component with new profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            ...user,
            name: name.trim(),
            bio: bio.trim(),
            avatar: avatar,
            coverImage: coverImage,
          });
        }
        
        // Also refresh user data from server to ensure synchronization
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse.success) {
            console.log('🔄 User data refreshed from server:', userResponse.data);
            // Update local state with fresh server data
            setAvatar(userResponse.data.avatar || '');
            setCoverImage(userResponse.data.coverImage || '');
            setImageRefreshKey(prev => prev + 1);
          }
        } catch (refreshError) {
          console.log('⚠️ Could not refresh user data, using local state');
        }
        
        Alert.alert(
          'Success', 
          getTranslation('profileUpdateSuccess', language),
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] }>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }] }>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getTranslation('editProfile', language)}</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={forceRefreshImages}
          disabled={uploading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={uploading ? colors.textTertiary : colors.primary} 
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.content]} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity style={[styles.coverImageContainer, { backgroundColor: colors.surfaceVariant }]} onPress={() => pickImage('cover')} disabled={uploading}>
          {coverImage ? (
            <Image 
              source={{ uri: coverImage }} 
              style={styles.coverImage} 
              key={`cover-${imageRefreshKey}`} // Force re-render when refresh key changes
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.coverPlaceholderText, { color: colors.textTertiary }]}>{getTranslation('coverImage', language)}</Text>
            </View>
          )}
          {uploading && <View style={styles.uploadingOverlay}><Text style={styles.uploadingText}>{getTranslation('uploading', language)}</Text></View>}
        </TouchableOpacity>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage('avatar')} disabled={uploading}>
          {avatar ? (
            <Image 
              source={{ uri: avatar }}

              style={[styles.avatar, { backgroundColor: colors.surfaceVariant, borderColor: colors.background }]} 
              key={`avatar-${imageRefreshKey}`} // Force re-render when refresh key changes
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary, borderColor: colors.background }] }>
              <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
            </View>
          )}
          <View style={[styles.avatarEditIcon, { backgroundColor: colors.primary, borderColor: colors.background }] }>
            <Ionicons name="camera" size={18} color={colors.textInverse} />
          </View>
          {uploading && <View style={styles.uploadingOverlay}><Text style={styles.uploadingText}>{getTranslation('uploading', language)}</Text></View>}
        </TouchableOpacity>
        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>{getTranslation('name', language)}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder={getTranslation('name', language)}
            autoCapitalize="words"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={[styles.label, { color: colors.text }]}>{getTranslation('username', language)}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.textSecondary, borderColor: colors.border }]}
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            autoCapitalize="none"
            placeholderTextColor={colors.placeholder}
            editable={false}
          />
          <Text style={[styles.disabledFieldNote, { color: colors.textTertiary }]}>
            Username cannot be changed
          </Text>
          <Text style={[styles.label, { color: colors.text }]}>{getTranslation('bio', language)}</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder={getTranslation('aboutMe', language)}
            multiline
            numberOfLines={4}
            maxLength={500}
            placeholderTextColor={colors.placeholder}
          />
        </View>
        {/* Save Button */}
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving || uploading}>
          <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>{saving ? getTranslation('saving', language) : getTranslation('save', language)}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  coverImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: -60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverPlaceholderText: { fontSize: 14, marginTop: 8 },
  avatarContainer: {
    marginTop: 0,
    marginBottom: 16,
    alignSelf: 'center',
    position: 'relative',
    top: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderRadius: 16,
  },
  uploadingText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  formSection: { width: '100%', marginTop: 8 },
  label: { fontSize: 14, marginBottom: 4, marginTop: 16, fontWeight: '600' },
  input: {
    width: '100%',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: {
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: { fontSize: 16, fontWeight: 'bold' },
  disabledFieldNote: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EditProfileScreen; 
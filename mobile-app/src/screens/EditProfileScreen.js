import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation, user }) => {
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [coverImage, setCoverImage] = useState(user?.coverImage || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Placeholder upload function
  const uploadImage = async (uri) => {
    // TODO: Replace with real upload logic (e.g., Cloudinary or your backend)
    // For now, just return the local URI
    return uri;
  };

  // Image picker logic
  const pickImage = async (type) => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Зөвшөөрөл хэрэгтэй', 'Зураг сонгохын тулд галерейд хандах зөвшөөрөл хэрэгтэй.');
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
        const localUri = result.assets[0].uri;
        const uploadedUrl = await uploadImage(localUri);
        if (type === 'avatar') {
          setAvatar(uploadedUrl);
        } else {
          setCoverImage(uploadedUrl);
        }
        setUploading(false);
      }
    } catch (err) {
      setUploading(false);
      Alert.alert('Алдаа', 'Зураг сонгоход алдаа гарлаа.');
    }
  };

  const handleSave = () => {
    setSaving(true);
    // TODO: Implement save logic (API call)
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Амжилттай', 'Профайл шинэчлэгдлээ!');
      navigation.goBack();
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverImageContainer} onPress={() => pickImage('cover')} disabled={uploading}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
              <Text style={styles.coverPlaceholderText}>Ковер зураг</Text>
            </View>
          )}
          {uploading && <View style={styles.uploadingOverlay}><Text style={styles.uploadingText}>Түр хүлээнэ үү...</Text></View>}
        </TouchableOpacity>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage('avatar')} disabled={uploading}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.avatarEditIcon}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
          {uploading && <View style={styles.uploadingOverlay}><Text style={styles.uploadingText}>Түр хүлээнэ үү...</Text></View>}
        </TouchableOpacity>
        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Нэр</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Нэр"
            autoCapitalize="words"
          />
          <Text style={styles.label}>Хэрэглэгчийн нэр</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Био</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Таны тухай..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>
        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || uploading}>
          <Text style={styles.saveButtonText}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { alignItems: 'center', padding: 24 },
  coverImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginBottom: -60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverPlaceholderText: { color: '#aaa', fontSize: 14, marginTop: 8 },
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
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: '#fff',
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
  label: { fontSize: 14, color: '#333', marginBottom: 4, marginTop: 16, fontWeight: '600' },
  input: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProfileScreen; 
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const EventCreationModal = ({ visible, onClose, onCreateEvent }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [userNumber, setUserNumber] = useState('5');
  const [eventImage, setEventImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPrivateEvent, setIsPrivateEvent] = useState(false);
  const [password, setPassword] = useState('');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEventImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Error occurred while picking image');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter event name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter event description');
      return;
    }

    const userNum = parseInt(userNumber);
    if (userNum < 5) {
      Alert.alert('Error', 'Minimum 5 people are required');
      return;
    }

    if (!eventImage) {
      Alert.alert('Error', 'Please add event image');
      return;
    }

    // Validate password for private events
    if (isPrivateEvent) {
      if (!password.trim()) {
        Alert.alert('Error', 'Please enter password');
        return;
      }
      if (password.length !== 4) {
        Alert.alert('Error', 'Password must be 4 digits');
        return;
      }
      if (!/^\d{4}$/.test(password)) {
        Alert.alert('Error', 'Password must contain only numbers');
        return;
      }
    }

    setLoading(true);
    try {
      const eventData = {
        name: eventName.trim(),
        description: description.trim(),
        userNumber: userNum,
        image: eventImage,
        type: 'event',
        isPrivate: isPrivateEvent,
        password: isPrivateEvent ? password.trim() : null,
        createdAt: new Date().toISOString(),
      };

      await onCreateEvent(eventData);
      
      // Reset form
      setEventName('');
      setDescription('');
      setUserNumber('5');
      setEventImage(null);
      setIsPrivateEvent(false);
      setPassword('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Event
          </Text>
          <TouchableOpacity 
            onPress={handleCreateEvent}
            disabled={loading}
            style={[
              styles.createButton,
              { 
                backgroundColor: loading ? colors.disabled : '#000000',
                opacity: loading ? 0.6 : 1
              }
            ]}
          >
            <Text style={[styles.createButtonText, { color: '#ffffff' }]}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Upload */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Event Image
            </Text>
            <TouchableOpacity 
              style={[styles.imageUpload, { borderColor: colors.border }]}
              onPress={pickImage}
            >
              {eventImage ? (
                <Image source={{ uri: eventImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color={colors.textSecondary} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                    Upload Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Event Name */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Event Name
            </Text>
            <TextInput
              style={[styles.textInput, { 
                color: colors.text, 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}
              value={eventName}
              onChangeText={setEventName}
              placeholder="Enter event name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Description
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter event description"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* User Number */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Minimum User Number
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={userNumber}
              onChangeText={setUserNumber}
              placeholder="5"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Minimum 5 people are required
            </Text>
          </View>

          {/* Private Event Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleHeader}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                Private Event
              </Text>
              <Switch
                value={isPrivateEvent}
                onValueChange={setIsPrivateEvent}
                trackColor={{ false: colors.surfaceVariant, true: colors.primary + '40' }}
                thumbColor={isPrivateEvent ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              Private events can only be joined by users with the password
            </Text>
          </View>

          {/* Password Field (only show if private) */}
          {isPrivateEvent && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Password (4 digits)
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={password}
                onChangeText={setPassword}
                placeholder="0000"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={false}
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Enter 4-digit number
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageUpload: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  toggleContainer: {
    marginBottom: 8,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default EventCreationModal; 
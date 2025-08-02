import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const ChangePasswordModal = ({ visible, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setError('Одоогийн нууц үг оруулна уу');
      return;
    }

    if (!newPassword.trim()) {
      setError('Шинэ нууц үг оруулна уу');
      return;
    }

    if (newPassword.length < 6) {
      setError('Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Шинэ нууц үгнүүд таарахгүй байна');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Шинэ нууц үг нь одоогийн нууц үгтэй адил байж болохгүй');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Changing password...');
      const response = await apiService.changePassword(currentPassword, newPassword);
      console.log('🔄 Change password response:', response);
      
      if (response.success) {
        console.log('✅ Password changed successfully');
        Alert.alert('Амжилттай', 'Нууц үг амжилттай солигдлоо', [
          { text: 'OK', onPress: () => {
            onSuccess();
            onClose();
          }}
        ]);
      } else {
        console.log('❌ Password change failed:', response.message);
        setError(response.message || 'Нууц үг солиход алдаа гарлаа');
      }
    } catch (error) {
      console.error('❌ Password change error:', error);
      if (error.message.includes('Network request failed') || 
          error.message.includes('fetch') || 
          error.message.includes('timeout')) {
        setError('Интернет холболтоо шалгана уу');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Нэвтрэх эрх дууссан. Дахин нэвтэрнэ үү.');
      } else {
        setError(error.message || 'Нууц үг солиход алдаа гарлаа');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Нууц үг солих
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Нууц үг солих
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Аюулгүй байдлын үүднээс нууц үгээ тогтмол шинэчлэх нь чухал
          </Text>
          
          {/* Current Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { 
                borderBottomColor: colors.border,
                color: colors.text,
                flex: 1
              }]}
              placeholder="Одоогийн нууц үг"
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons 
                name={showCurrentPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {/* New Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { 
                borderBottomColor: colors.border,
                color: colors.text,
                flex: 1
              }]}
              placeholder="Шинэ нууц үг"
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons 
                name={showNewPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Confirm Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { 
                borderBottomColor: colors.border,
                color: colors.text,
                flex: 1
              }]}
              placeholder="Шинэ нууц үг давтах"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Болих</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                { backgroundColor: colors.primary },
                (!currentPassword || !newPassword || !confirmPassword) && { opacity: 0.5 }
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>Нууц үг солих</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
};

export default ChangePasswordModal; 
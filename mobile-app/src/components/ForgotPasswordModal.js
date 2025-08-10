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
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getThemeColors } from '../utils/themeUtils';

const ForgotPasswordModal = ({ visible, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError(getTranslation('emailRequired', language));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.forgotPassword(email);
      
      if (response.success) {
        Alert.alert(getTranslation('success', language), 'Password reset code has been sent to your email');
        setStep(2);
      } else {
        setError(response.message || 'Failed to send code');
      }
    } catch (error) {
      setError(error.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 5) {
      setError('Please enter a 5-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyResetCode(email, code);
      
      if (response.success) {
        setResetToken(response.data.resetToken);
        setStep(3);
      } else {
        setError(response.message || 'Invalid code');
      }
    } catch (error) {
      setError(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError(getTranslation('passwordTooShort', language));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(getTranslation('passwordMismatch', language));
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Resetting password with token:', resetToken);
      const response = await apiService.resetPassword(resetToken, newPassword);
      console.log('🔄 Reset password response:', response);
      
      if (response.success) {
        console.log('✅ Password reset successful');
        
        // Don't auto-login, just show success message and close modal
        Alert.alert(getTranslation('success', language), 'Password has been reset successfully. Please login with your new password.');
        onClose();
      } else {
        console.log('❌ Password reset failed:', response.message);
        setError(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setResetToken('');
    onClose();
  };

  const renderStep1 = () => (
    <View style={{ flex: 1 }}>
      <Text style={[styles.title, { color: colors.text }]}>
        Reset Password
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter your email address to receive a password reset code
      </Text>
      
      <TextInput
        style={[styles.input, { 
          borderBottomColor: colors.border,
          color: colors.text
        }]}
        placeholder={getTranslation('email', language)}
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>Send Code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <Text style={[styles.title, { color: colors.text }]}>
        Verify Code
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter the 5-digit code sent to your email address
      </Text>
      
      <TextInput
        style={[styles.input, { 
          borderBottomColor: colors.border,
          color: colors.text,
          textAlign: 'center',
          fontSize: 24,
          letterSpacing: 8
        }]}
        placeholder="00000"
        placeholderTextColor={colors.textSecondary}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 5))}
        keyboardType="numeric"
        maxLength={5}
      />
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleBack}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{getTranslation('back', language)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleVerifyCode}
          disabled={loading || code.length !== 5}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <Text style={[styles.title, { color: colors.text }]}>
        New Password
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter your new password
      </Text>
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { 
            borderBottomColor: colors.border,
            color: colors.text,
            flex: 1
          }]}
          placeholder={getTranslation('newPassword', language)}
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
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { 
            borderBottomColor: colors.border,
            color: colors.text,
            flex: 1
          }]}
          placeholder={getTranslation('confirmPassword', language)}
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
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
          onPress={handleBack}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{getTranslation('back', language)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleResetPassword}
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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
            Reset Password
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
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

export default ForgotPasswordModal; 
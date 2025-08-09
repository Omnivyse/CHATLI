import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import apiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EmailVerificationModal = ({ 
  visible, 
  onClose, 
  user, 
  onVerificationSuccess 
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (visible) {
      setVerificationCode(['', '', '', '', '']);
      setError('');
      setCountdown(0);
      // Focus first input after modal opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  const handleCodeChange = (text, index) => {
    // Only allow single digits
    const digit = text.replace(/[^0-9]/g, '').slice(0, 1);
    
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);
    setError('');

    // Auto-focus next input if digit entered
    if (digit && index < 4) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 100);
    }

    // Auto-submit when all digits are entered
    if (index === 4 && digit && newCode.every(d => d !== '')) {
      setTimeout(() => {
        handleVerification();
      }, 200);
    }
  };

  const handleVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 5) {
      setError('Please enter a 5-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyEmail(user.email, code);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Email verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onVerificationSuccess(response.data.user);
                onClose();
              },
            },
          ]
        );
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user.email || countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const response = await apiService.resendVerificationCode(user.email);
      
      if (response.success) {
        Alert.alert('Success', 'Verification email sent again');
        setCountdown(60); // Start countdown
        setVerificationCode(['', '', '', '', '']);
        setError('');
        // Focus first input
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to send email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Email Verification
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.emailInfo}>
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={[styles.emailText, { color: colors.text }]}>
                {user.email}
              </Text>
            </View>

            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Check your email and enter the 5-digit verification code
            </Text>

            {/* Code Input */}
            <View style={styles.codeInputContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    { 
                      backgroundColor: colors.surfaceVariant,
                      borderColor: error ? colors.error : colors.border,
                      color: colors.text
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                  textAlign="center"
                />
              ))}
            </View>

            {/* Error Message */}
            {error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            ) : null}

            {/* Timer */}
            {countdown > 0 && (
              <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                  Code expires in {formatTime(countdown)}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { 
                    backgroundColor: colors.primary,
                    opacity: verificationCode.join('').length === 5 && !loading ? 1 : 0.5
                  }
                ]}
                onPress={handleVerification}
                disabled={loading || verificationCode.join('').length !== 5}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={[styles.verifyButtonText, { color: colors.textInverse }]}>
                    Verify
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  { 
                    backgroundColor: countdown > 0 ? colors.surfaceVariant : colors.primary,
                    opacity: countdown > 0 || resendLoading ? 0.6 : 1
                  }
                ]}
                onPress={handleResendVerification}
                disabled={countdown > 0 || resendLoading}
                activeOpacity={0.8}
              >
                {resendLoading ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={[styles.resendButtonText, { color: colors.textInverse }]}>
                    Resend Code
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  timerText: {
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  verifyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmailVerificationModal; 
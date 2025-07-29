import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import api from '../services/api';

const EmailVerificationScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [codeError, setCodeError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from route params
    const emailFromRoute = route.params?.email || '';
    setEmail(emailFromRoute);

    // Start countdown for resend button
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (text, index) => {
    if (text.length > 1) {
      text = text[0];
    }

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);
    setCodeError('');

    // Auto-focus next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 4 && text && newCode.every(digit => digit !== '')) {
      handleVerification();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 5) {
      setCodeError('5 оронтой код оруулна уу');
      return;
    }

    setLoading(true);
    try {
      const response = await api.verifyEmail(code, email);
      
      if (response.success) {
        Alert.alert(
          'Амжилттай',
          'Имэйл хаяг амжилттай баталгаажлаа!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              },
            },
          ]
        );
      } else {
        setCodeError(response.message || 'Баталгаажуулалт амжилтгүй болсон');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setCodeError('Баталгаажуулалт амжилтгүй болсон. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || countdown > 0) return;

    setResendLoading(true);
    try {
      const response = await api.resendVerificationEmail(email);
      
      if (response.success) {
        Alert.alert('Амжилттай', 'Баталгаажуулах имэйл дахин илгээгдлээ');
        setCountdown(60); // Start countdown again
        setVerificationCode(['', '', '', '', '']); // Clear code
        setCodeError(''); // Clear error
        // Focus first input
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Алдаа', response.message || 'Имэйл илгээхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Алдаа', 'Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setResendLoading(false);
    }
  };

  const openEmailApp = () => {
    // Try to open email app
    Linking.openURL('mailto:');
  };

  const goBackToLogin = () => {
    navigation.navigate('Login');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={goBackToLogin}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Имэйл баталгаажуулалт
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="mail-outline" 
              size={80} 
              color={colors.primary} 
            />
          </View>

          <Text style={[styles.heading, { color: colors.text }]}>
            Имэйл хаягаа баталгаажуулна уу
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {email ? `"${email}" хаяг руу баталгаажуулах имэйл илгээгдлээ.` : 'Имэйл хаягаа шалгаж баталгаажуулах кодыг оруулна уу.'}
          </Text>

          {/* Verification Code Input */}
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: colors.text }]}>
              5 оронтой код оруулна уу
            </Text>
            
            <View style={styles.codeInputContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: codeError ? colors.error : colors.border,
                      color: colors.text
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>
            
            {codeError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {codeError}
              </Text>
            ) : null}
          </View>

          {/* Timer */}
          {countdown > 0 && (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                Код {formatTime(countdown)} минутын дараа дуусна
              </Text>
            </View>
          )}

          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { color: colors.textInverse }]}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Имэйл хаягаа шалгана уу
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { color: colors.textInverse }]}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                5 оронтой кодыг оруулна уу
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { color: colors.textInverse }]}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Апп руу буцаж орж нэвтэрнэ үү
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.emailButton, { backgroundColor: colors.primary }]}
            onPress={openEmailApp}
          >
            <Ionicons name="mail" size={20} color={colors.textInverse} />
            <Text style={[styles.emailButtonText, { color: colors.textInverse }]}>
              Имэйл хаягаа нээх
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              эсвэл
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity 
            style={[
              styles.resendButton, 
              { 
                backgroundColor: countdown > 0 ? colors.surfaceVariant : colors.primary,
                opacity: countdown > 0 ? 0.6 : 1
              }
            ]}
            onPress={handleResendVerification}
            disabled={countdown > 0 || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={colors.textInverse} 
                />
                <Text style={[styles.resendButtonText, { color: colors.textInverse }]}>
                  {countdown > 0 ? `${formatTime(countdown)}` : 'Дахин илгээх'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Имэйл ирээгүй бол спам хавтсаа шалгана уу
          </Text>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Баталгаажуулж байна...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  codeContainer: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  timerText: {
    fontSize: 14,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    flex: 1,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default EmailVerificationScreen; 
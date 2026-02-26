import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ onLogin }) => {
  const { language } = useLanguage();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated blob values
  const blob1Anim = new Animated.Value(0);
  const blob2Anim = new Animated.Value(0);

  React.useEffect(() => {
    // Start blob animations
    const animateBlobs = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob1Anim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Anim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(blob2Anim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Anim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateBlobs();
  }, []);

  const handleSubmit = async () => {
    // Validate required fields
    if (!email || !password || (mode === 'register' && (!displayName || !tagName))) {
      setError(getTranslation('emailRequired', language));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(getTranslation('invalidEmail', language));
      return;
    }

    // Validate password length (server requires 10+ characters)
    if (password.length < 10) {
      setError('Password must be at least 10 characters long');
      return;
    }

    // Validate password complexity (for registration)
    if (mode === 'register') {
      // Server requires: uppercase, lowercase, numbers, and special characters
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
        setError('Password must contain: uppercase letters, lowercase letters, numbers, and special characters (!@#$%^&*()_+-=[]{}|;:,.<>?)');
        return;
      }
    }

    // Validate tag name format (for registration)
    if (mode === 'register') {
      if (tagName.length < 3) {
        setError('Tag name must be at least 3 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(tagName)) {
        setError('Tag name can only contain letters, numbers, and _');
        return;
      }
      
      // Validate display name (should not be empty and should be reasonable length)
      if (!displayName.trim() || displayName.trim().length < 2) {
        setError('Display name must be at least 2 characters long');
        return;
      }
      
      // Validate tag name length check
      if (tagName.length > 20) {
        setError('Tag name must be 20 characters or less');
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    setError(''); // Clear any previous errors
    
    // Debug: Log the data being sent (only in development)
    if (__DEV__) {
      console.log('🔐 Login attempt:', {
        mode,
        email: email ? `${email.substring(0, 3)}***` : 'empty',
        password: password ? '***' : 'empty',
        name: mode === 'register' ? displayName : 'N/A',
        username: mode === 'register' ? tagName : 'N/A'
      });
    }
    
    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        
        if (res.success) {
          onLogin(res.data.user, { isNewUser: false });
        } else {
          // Check if it's an email verification error
          if (res.data && res.data.emailVerified === false) {
            // For unverified users, we should still log them in but show verification banner
            // The verification will be handled by the banner/modal system
            onLogin(res.data.user, { isNewUser: false });
            return;
          }
          // Display the specific error message from the API
          setError(res.message || getTranslation('loginError', language));
        }
      } else {
        // Debug registration data before making API call
        debugRegistration();
        
        const res = await api.register(displayName, tagName, email, password);
        
        if (res.success) {
          onLogin(res.data.user, { isNewUser: true });
        } else {
          // Display the specific error message from the API
          setError(res.message || getTranslation('registerError', language));
        }
      }
    } catch (error) {
      // Handle API errors properly
      console.error('Login/Register error:', error);
      
      // Check if it's a network error
      if (error.message.includes('Network request failed') || 
          error.message.includes('fetch') || 
          error.message.includes('timeout')) {
        setError('Please check your internet connection');
      } else if (error.message.includes('Request timeout') || error.message.includes('timeout')) {
        setError('Request timeout. Please check your internet connection.');
      } else if (error.message.includes('Оролтын алдаа') || error.message.includes('Input Error') || error.message.includes('Validation failed')) {
        // Handle input validation errors specifically
        if (mode === 'register') {
                     // Check if it's a password validation error
           if (error.message.includes('password') || error.message.includes('Invalid value') || error.message.includes('Validation failed: password')) {
             setError('Password must be 10+ characters with: uppercase letters, lowercase letters, numbers, and special characters (!@#$%^&*()_+-=[]{}|;:,.<>?)');
           } else {
             setError('Registration failed: Please check your input data. Make sure:\n• Name is at least 2 characters\n• Username is 3-20 characters (letters, numbers, _ only)\n• Email is valid\n• Password is at least 10 characters with uppercase, lowercase, numbers, and special characters');
           }
        } else {
          setError('Email or password is incorrect');
        }
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Email or password is incorrect');
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        setError('User not found');
      } else {
        // Display the specific error message from the API
        setError(error.message || (mode === 'login' ? getTranslation('loginError', language) : getTranslation('registerError', language)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSuccess = (user) => {
    onLogin(user, { isNewUser: false });
  };

  // Debug function to help troubleshoot registration issues
  const debugRegistration = () => {
    console.log('🔍 Debug Registration Data:', {
      mode,
      displayName: displayName ? `${displayName.substring(0, 3)}***` : 'empty',
      tagName: tagName ? `${tagName.substring(0, 3)}***` : 'empty',
      email: email ? `${email.substring(0, 3)}***` : 'empty',
      passwordLength: password?.length || 0,
      confirmPasswordLength: confirmPassword?.length || 0,
      displayNameValid: displayName && displayName.trim().length >= 2,
      tagNameValid: tagName && tagName.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(tagName),
      emailValid: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      passwordValid: password && password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password === confirmPassword
    });
  };

  const blob1Transform = blob1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const blob2Transform = blob2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.2, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <LinearGradient
        colors={['#f8f9fa', '#ffffff', '#f1f3f5']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated Blobs */}
      <Animated.View 
        style={[
          styles.blob1, 
          { 
            transform: [{ scale: blob1Transform }] 
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob2, 
          { 
            transform: [{ scale: blob2Transform }] 
          }
        ]} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            {/* Title */}
            <Text style={styles.title}>CHATLI</Text>
            
            {/* Mode Selection Buttons */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  styles.loginButton,
                  mode === 'login' && styles.activeLoginButton
                ]}
                onPress={() => {
                  setMode('login');
                  setError('');
                }}
              >
                <Text style={[
                  styles.modeButtonText,
                  mode === 'login' && styles.activeModeButtonText
                ]}>
                  {getTranslation('login', language)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  styles.registerButton,
                  mode === 'register' && styles.activeRegisterButton
                ]}
                onPress={() => {
                  setMode('register');
                  setError('');
                }}
              >
                <Text style={[
                  styles.modeButtonText,
                  styles.registerButtonText,
                  mode === 'register' && styles.activeRegisterButtonText
                ]}>
                  {getTranslation('register', language)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {mode === 'register' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel}>Display Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your display name"
                      placeholderTextColor="#666"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                    />
                    <Text style={styles.helperText}>
                      This is the name that will be displayed to other users
                    </Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel}>Tag Name</Text>
                    <View style={styles.tagNameWarning}>
                      <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                      <Text style={styles.tagNameWarningText}>
                        ⚠️ This name cannot be changed later. Please write your name carefully.
                      </Text>
                    </View>
                                         <TextInput
                       style={styles.input}
                       placeholder="Tag name"
                       placeholderTextColor="#666"
                       value={tagName}
                       onChangeText={setTagName}
                       autoCapitalize="none"
                     />
                    <Text style={styles.helperText}>
                      Tag name must be 3-20 characters, letters, numbers, and underscores only
                    </Text>
                  </View>
                </>
              )}
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={getTranslation('email', language)}
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              
                             <View style={styles.inputContainer}>
                 <TextInput
                   style={styles.input}
                   placeholder={getTranslation('password', language)}
                   placeholderTextColor="#666"
                   value={password}
                   onChangeText={setPassword}
                   secureTextEntry={!showPassword}
                   autoComplete="password"
                 />
                                   <TouchableOpacity
                    style={styles.showPasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                
                {mode === 'register' && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      placeholderTextColor="#666"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      style={styles.showPasswordButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    {confirmPassword && password !== confirmPassword && (
                      <Text style={styles.passwordMismatchError}>
                        ❌ Passwords do not match
                      </Text>
                    )}
                  </View>
                )}
                
                {mode === 'register' && (
                  <>
                    <Text style={styles.passwordHint}>
                      Password must be 10+ characters with: uppercase, lowercase, numbers, and special characters
                    </Text>
                    <Text style={styles.passwordWarning}>
                      ✅ Special characters like @#$%^&*+= are now allowed for security!
                    </Text>
                  </>
                )}
              
              {error && typeof error === 'string' && error.length > 0 ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText} numberOfLines={0}>{error}</Text>
                </View>
              ) : null}
              
              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  mode === 'register' && styles.submitButtonRegister,
                  loading && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading 
                    ? (mode === 'login' ? 'Logging in...' : 'Registering...') 
                    : (mode === 'login' ? getTranslation('login', language) : getTranslation('register', language))
                  }
                </Text>
              </TouchableOpacity>

              {/* Forgot Password Link - Only show in login mode */}
              {mode === 'login' && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => setShowForgotPassword(true)}
                >
                  <Text style={styles.forgotPasswordText}>{getTranslation('forgotPassword', language)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob1: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 100,
  },
  blob2: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 100,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 72,
    height: 72,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#f1f3f5',
    padding: 4,
    width: '100%',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: 'transparent',
  },
  activeLoginButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButton: {
    backgroundColor: 'transparent',
  },
  activeRegisterButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeModeButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  registerButtonText: {
    color: '#6c757d',
  },
  activeRegisterButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 48,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontWeight: '400',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonRegister: {
    backgroundColor: '#1a1a1a',
  },
  submitButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    marginTop: 8,
    paddingVertical: 12,
  },
  forgotPasswordText: {
    color: '#007aff',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'none',
    fontWeight: '500',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  showPasswordText: {
    color: '#6c757d',
    fontSize: 14,
  },
  passwordHint: {
    color: '#6c757d',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
  },
  passwordWarning: {
    color: '#28a745',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: 0,
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 6,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
  },
  tagNameWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  tagNameWarningText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
    lineHeight: 16,
  },
  passwordMismatchError: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'left',
  },
});

export default LoginScreen; 
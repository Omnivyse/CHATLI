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
        colors={['#000000', '#1f1f1f', '#ffffff']}
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
            
            {/* Beta Badge */}
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>
                🚧 <Text style={styles.betaBold}>BETA VERSION</Text> - Testing Mode
              </Text>
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
    backgroundColor: '#ffffff',
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
    top: -60,
    left: -60,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 60,
  },
  blob2: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 60,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 32,
    borderRadius: 0,
    backgroundColor: 'transparent',
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 0,
    alignItems: 'center',
    marginHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  loginButton: {
    backgroundColor: 'transparent',
  },
  activeLoginButton: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    borderBottomColor: '#000000',
  },
  registerButton: {
    backgroundColor: 'transparent',
  },
  activeRegisterButton: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderBottomColor: '#000000',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#999999',
  },
  activeModeButtonText: {
    color: '#000000',
    fontWeight: '500',
  },
  registerButtonText: {
    color: '#999999',
  },
  activeRegisterButtonText: {
    color: '#000000',
    fontWeight: '500',
  },
  betaBadge: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 32,
  },
  betaText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
  },
  betaBold: {
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    fontSize: 16,
    color: '#000000',
    backgroundColor: 'transparent',
    fontWeight: '400',
  },
  errorText: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  errorContainer: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 0,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  submitButtonRegister: {
    backgroundColor: '#000000',
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 1,
  },
  forgotPasswordButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  forgotPasswordText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'none',
    fontWeight: '400',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 0,
    top: 16,
    padding: 8,
    backgroundColor: 'transparent',
  },
  showPasswordText: {
    color: '#666666',
    fontSize: 14,
  },
  passwordHint: {
    color: '#999999',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'normal',
    fontWeight: '400',
  },
  passwordWarning: {
    color: '#000000',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '400',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
  },
  tagNameWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    padding: 8,
    marginBottom: 8,
  },
  tagNameWarningText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    fontWeight: '400',
    lineHeight: 16,
  },
  passwordMismatchError: {
    color: '#000000',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default LoginScreen; 
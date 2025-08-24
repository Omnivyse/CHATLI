import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';

const RegisterScreen = ({ navigation, onLogin }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    tagName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: '#e5e5e5', text: '' };
    
    let score = 0;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const strengths = [
      { strength: 0, color: '#ef4444', text: 'Very Weak' },
      { strength: 1, color: '#f97316', text: 'Weak' },
      { strength: 2, color: '#eab308', text: 'Fair' },
      { strength: 3, color: '#84cc16', text: 'Good' },
      { strength: 4, color: '#22c55e', text: 'Strong' },
      { strength: 5, color: '#16a34a', text: 'Very Strong' }
    ];
    
    return strengths[Math.min(score, 5)];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Detailed password validation function
  const validatePassword = (password) => {
    if (!password) {
      return { isValid: false, message: 'Please enter password' };
    }
    
    if (password.length < 12) {
      return { isValid: false, message: `Password must be at least 12 characters (currently ${password.length})` };
    }
    
    if (password.length > 128) {
      return { isValid: false, message: 'Password must be less than 128 characters' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
    }
    
    return { isValid: true, message: 'Password is valid' };
  };

  // Handle rate limiting with countdown
  const handleRateLimit = (retryAfterSeconds) => {
    setRateLimited(true);
    setRateLimitCountdown(Math.ceil(retryAfterSeconds / 60));
    
    // Start countdown timer
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          setRateLimited(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  };

  // Test network connectivity
  const testNetworkConnectivity = async () => {
    try {
      console.log('🌐 Testing network connectivity...');
      const response = await fetch('https://chatli-production.up.railway.app/api/health');
      const data = await response.json();
      console.log('✅ Network test successful:', data);
      Toast.show({
        type: 'success',
        text1: 'Network Connection OK',
        text2: 'You are connected to the internet.',
      });
      return true;
    } catch (error) {
      console.error('❌ Network test failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Connection Failed',
        text2: 'Please check your internet connection.',
      });
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`🔧 handleInputChange: ${field} = "${value}" (length: ${value?.length})`);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('🔧 New form data:', newData);
      return newData;
    });
    
    // Real-time validation for password
    if (field === 'password') {
      const validation = validatePassword(value);
      console.log('🔧 Password validation result:', validation);
      if (value && !validation.isValid) {
        setErrors(prev => ({ ...prev, [field]: validation.message }));
      } else if (value && validation.isValid) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else {
      // Clear error when user starts typing for other fields
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Please enter your display name';
    } else if (formData.displayName.trim().length < 2 || formData.displayName.trim().length > 50) {
      newErrors.displayName = 'Display name must be between 2 and 50 characters';
    }

    if (!formData.tagName.trim()) {
      newErrors.tagName = 'Please enter a tag name';
    } else if (formData.tagName.trim().length < 3 || formData.tagName.trim().length > 20) {
      newErrors.tagName = 'Tag name must be between 3 and 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.tagName)) {
      newErrors.tagName = 'Tag name can only contain letters, numbers, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter password';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Set errors and return validation result immediately
    setErrors(newErrors);
    
    // Debug logging
    console.log('🔍 Form validation result:', {
      hasErrors: Object.keys(newErrors).length > 0,
      errorCount: Object.keys(newErrors).length,
      errors: newErrors,
      password: formData.password,
      passwordLength: formData.password?.length,
      passwordValidation: formData.password ? validatePassword(formData.password) : null
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    // Double-check password validation before API call
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      console.log('❌ Password validation failed after form validation:', passwordValidation.message);
      setErrors(prev => ({ ...prev, password: passwordValidation.message }));
      Toast.show({
        type: 'error',
        text1: 'Password Error',
        text2: passwordValidation.message,
      });
      return;
    }

    setLoading(true);
    
    // Debug logging
    console.log('🔐 Attempting registration with:', {
      displayName: formData.displayName,
      tagName: formData.tagName,
      email: formData.email,
      passwordLength: formData.password.length,
      passwordValidation: passwordValidation
    });
    
    try {
      // Test network connectivity first
      console.log('🌐 Testing network connectivity...');
      const isConnected = await testNetworkConnectivity();
      if (!isConnected) {
        throw new Error('Network connectivity test failed. Please check your internet connection.');
      }
      
      console.log('📡 Calling API service...');
      const response = await apiService.register(
        formData.displayName,
        formData.tagName,
        formData.email,
        formData.password
      );
      
      console.log('📧 Registration response:', response);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Registration successful',
          text2: 'Please check your email for verification',
        });
        
        // For new users, save token and go directly to main app
        if (response.data.token) {
          await AsyncStorage.setItem('token', response.data.token);
        }
        
        if (onLogin && response.data.user) {
          onLogin(response.data.user, { isNewUser: true });
        } else {
          // Fallback to login screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } else {
        // Handle backend validation errors
        let errorMessage = response.message || 'Registration failed';
        
        // Check for specific validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const fieldErrors = {};
          response.errors.forEach(error => {
            if (error.path) {
              // Translate backend errors to user-friendly messages
              switch (error.path) {
                case 'password':
                  fieldErrors[error.path] = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character';
                  break;
                case 'email':
                  fieldErrors[error.path] = 'Please enter a valid email address';
                  break;
                case 'username':
                  fieldErrors[error.path] = 'Tag name must be 3-20 characters, letters, numbers, and underscores only';
                  break;
                case 'name':
                  fieldErrors[error.path] = 'Display name must be between 2 and 50 characters';
                  break;
                default:
                  fieldErrors[error.path] = error.msg;
              }
            }
          });
          
          // Update form errors with backend validation errors
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          
          // Show user-friendly error message
          if (response.errors.length > 0) {
            const firstError = response.errors[0];
            switch (firstError.path) {
              case 'password':
                errorMessage = 'Password does not meet requirements. Please check the requirements below.';
                break;
              case 'email':
                errorMessage = 'Please enter a valid email address.';
                break;
              case 'username':
                errorMessage = 'Tag name format is invalid. Please check the requirements.';
                break;
              case 'name':
                errorMessage = 'Display name length is invalid.';
                break;
              default:
                errorMessage = firstError.msg || 'Please check your input and try again.';
            }
          }
        }
        
        Toast.show({
          type: 'error',
          text1: 'Registration error',
          text2: errorMessage,
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      
      // Handle network or server errors
      let errorMessage = 'Server error occurred';
      if (error.message) {
        if (error.message.includes('Rate limited')) {
          // Extract retry time from error message
          const match = error.message.match(/(\d+) minutes/);
          if (match) {
            const minutes = parseInt(match[1]);
            handleRateLimit(minutes * 60);
          }
          errorMessage = error.message;
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Connection error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>CHATLI</Text>
            <Text style={styles.subtitle}>Register</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <View style={[styles.inputWrapper, errors.displayName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Your display name"
                  placeholderTextColor="#999999"
                  value={formData.displayName}
                  onChangeText={(value) => handleInputChange('displayName', value)}
                  editable={!loading}
                />
              </View>
              {errors.displayName && typeof errors.displayName === 'string' ? <Text style={styles.errorText}>{errors.displayName}</Text> : null}
              <Text style={styles.helperText}>
                This is the name that will be displayed to other users
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tag Name</Text>
              <View style={styles.tagNameWarning}>
                <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                <Text style={styles.tagNameWarningText}>
                  ⚠️ This name cannot be changed later. Please write your name carefully.
                </Text>
              </View>
              <View style={[styles.inputWrapper, errors.tagName && styles.inputError]}>
                <Ionicons name="at-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="your_tag_name"
                  placeholderTextColor="#999999"
                  value={formData.tagName}
                  onChangeText={(value) => handleInputChange('tagName', value)}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.tagName && typeof errors.tagName === 'string' ? <Text style={styles.errorText}>{errors.tagName}</Text> : null}
              <Text style={styles.helperText}>
                Tag name must be 3-20 characters, letters, numbers, and underscores only
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#999999"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.email && typeof errors.email === 'string' ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter password"
                  placeholderTextColor="#999999"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              <Text style={styles.helperText}>
                Must be at least 12 characters with uppercase, lowercase, number, and special character
              </Text>
              {formData.password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          { backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#e5e5e5' }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm password"
                  placeholderTextColor="#999999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.testButton]}
              onPress={testNetworkConnectivity}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>Test Connection</Text>
            </TouchableOpacity>
            
            {/* Rate limit warning */}
            <View style={styles.rateLimitWarning}>
              <Ionicons name="information-circle-outline" size={16} color="#f59e0b" />
              <Text style={styles.rateLimitText}>
                Note: Registration is limited to 5 attempts per 15 minutes for security
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton, 
                (loading || Object.keys(errors).length > 0 || rateLimited) && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading || Object.keys(errors).length > 0 || rateLimited}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>
            
            {/* Form validation status */}
            {Object.keys(errors).length > 0 && (
              <Text style={styles.validationStatus}>
                ⚠️ Please fix the errors above before registering
              </Text>
            )}
            
            {Object.keys(errors).length === 0 && formData.password.length > 0 && !rateLimited && (
              <Text style={styles.validationStatus}>
                ✅ Form is valid and ready to submit
              </Text>
            )}
            
            {/* Rate limit countdown */}
            {rateLimited && (
              <Text style={[styles.validationStatus, styles.rateLimitError]}>
                ⏰ Rate limited. Please wait {rateLimitCountdown} minute{rateLimitCountdown !== 1 ? 's' : ''} before trying again.
              </Text>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e5e5',
    marginRight: 8,
  },
  strengthSegment: {
    width: '20%',
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  testButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  validationStatus: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  rateLimitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  rateLimitText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  rateLimitError: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
  },
  tagNameWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  tagNameWarningText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
});

export default RegisterScreen; 
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
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Real-time validation for password
    if (field === 'password') {
      const validation = validatePassword(value);
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

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
      newErrors.name = 'Name must be between 2 and 50 characters';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Please enter username';
    } else if (formData.username.trim().length < 3 || formData.username.trim().length > 20) {
      newErrors.username = 'Username must be between 3 and 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    setLoading(true);
    
    // Debug logging
    console.log('🔐 Attempting registration with:', {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      passwordLength: formData.password.length
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
        formData.name,
        formData.username,
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
                  fieldErrors[error.path] = 'Username must be 3-20 characters, letters, numbers, and underscores only';
                  break;
                case 'name':
                  fieldErrors[error.path] = 'Name must be between 2 and 50 characters';
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
                errorMessage = 'Username format is invalid. Please check the requirements.';
                break;
              case 'name':
                errorMessage = 'Name length is invalid.';
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
        if (error.message.includes('Network request failed')) {
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
              <Text style={styles.label}>Name</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Your name"
                  placeholderTextColor="#999999"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  editable={!loading}
                />
              </View>
              {errors.name && typeof errors.name === 'string' ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                <Ionicons name="at-outline" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="username"
                  placeholderTextColor="#999999"
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.username && typeof errors.username === 'string' ? <Text style={styles.errorText}>{errors.username}</Text> : null}
              <Text style={styles.helperText}>
                Username must be 3-20 characters, letters, numbers, and underscores only
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

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

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
});

export default RegisterScreen; 
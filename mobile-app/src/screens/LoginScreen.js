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
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!email || !password || (mode === 'register' && (!name || !username))) {
      setError('Бүх талбарыг бөглөнө үү');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        if (res.success) {
          onLogin(res.data.user, { isNewUser: false });
        } else {
          setError(res.message || 'Нэвтрэхэд алдаа гарлаа');
        }
      } else {
        const res = await api.register({ name, username, email, password });
        if (res.success) {
          onLogin(res.data.user, { isNewUser: true });
        } else {
          setError(res.message || 'Бүртгүүлэхэд алдаа гарлаа');
        }
      }
    } catch (e) {
      setError(e.message || (mode === 'login' ? 'Нэвтрэхэд алдаа гарлаа' : 'Бүртгүүлэхэд алдаа гарлаа'));
    } finally {
      setLoading(false);
    }
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
                  Нэвтрэх
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
                  Бүртгүүлэх
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Beta Badge */}
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>
                🚧 <Text style={styles.betaBold}>BETA хувилбар</Text> - Туршилтын горим
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {mode === 'register' && (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Профайл нэр"
                      placeholderTextColor="#666"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Нэр"
                      placeholderTextColor="#666"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Имэйл"
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
                  placeholder="Нууц үг"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
              
              {error && typeof error === 'string' ? (
                <Text style={styles.errorText}>{error}</Text>
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
                    ? (mode === 'login' ? 'Нэвтэрч байна...' : 'Бүртгүүлж байна...') 
                    : (mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх')
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
    top: -100,
    left: -100,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 100,
  },
  blob2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(192, 192, 192, 0.3)',
    borderRadius: 100,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 2,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  loginButton: {
    backgroundColor: 'transparent',
  },
  activeLoginButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
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
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#000',
  },
  registerButtonText: {
    color: '#666',
  },
  activeRegisterButtonText: {
    color: '#fff',
  },
  betaBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: 'rgba(255, 165, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  betaText: {
    fontSize: 12,
    color: '#cc6600',
    textAlign: 'center',
  },
  betaBold: {
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    fontSize: 16,
    color: '#000',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonRegister: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen; 
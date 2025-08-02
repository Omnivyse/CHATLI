import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StatusBar, Platform } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Alert, LogBox, Platform as RNPlatform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { getTranslation } from './src/utils/translations';
import { getStatusBarStyle, getStatusBarBackgroundColor, getTabBarColors, getNavigationColors, getThemeColors } from './src/utils/themeUtils';

// Services
import apiService from './src/services/api';
import socketService from './src/services/socket';
import analyticsService from './src/services/analyticsService';
import pushNotificationService from './src/services/pushNotificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import PostFeedScreen from './src/screens/PostFeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import UserSearchScreen from './src/screens/UserSearchScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ClipsScreen from './src/screens/ClipsScreen';
import HelpCenterScreen from './src/screens/HelpCenterScreen';

import EmailVerificationBanner from './src/components/EmailVerificationBanner';
import EmailVerificationModal from './src/components/EmailVerificationModal';

// Components
import LoadingScreen from './src/components/LoadingScreen';
import CustomSplashScreen from './src/components/SplashScreen';

// Ignore specific warnings for React Native
LogBox.ignoreLogs([
  'Warning: AsyncStorage has been extracted from react-native',
  'Setting a timer',
  'VirtualizedLists should never be nested',
]);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

function MainTabNavigator({ user, onLogout, onGoToVerification }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const tabBarColors = getTabBarColors(theme);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Clips') {
            iconName = focused ? 'film' : 'film-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Special handling for Profile tab to show user avatar
          if (route.name === 'Profile') {
            return (
              <View style={{ 
                justifyContent: 'center', 
                alignItems: 'center', 
                flex: 1,
                width: '100%',
                paddingVertical: 4
              }}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: focused ? 2 : 0,
                      borderColor: focused ? color : 'transparent',
                    }}
                    resizeMode="cover"
                    onError={() => {
                      // If image fails to load, it will fall back to the default icon
                      console.log('Profile avatar failed to load');
                    }}
                  />
                ) : (
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: focused ? color : tabBarColors.inactiveTintColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: focused ? 2 : 0,
                    borderColor: focused ? color : 'transparent',
                  }}>
                    <Ionicons 
                      name={iconName} 
                      size={16} 
                      color={focused ? tabBarColors.backgroundColor : color}
                    />
                  </View>
                )}
              </View>
            );
          }

          return (
            <View style={{ 
              justifyContent: 'center', 
              alignItems: 'center', 
              flex: 1,
              width: '100%',
              paddingVertical: 4
            }}>
              <Ionicons 
                name={iconName} 
                size={28} 
                color={color}
                style={{
                  textAlign: 'center',
                  textAlignVertical: 'center'
                }}
              />
            </View>
          );
        },
        tabBarActiveTintColor: tabBarColors.activeTintColor,
        tabBarInactiveTintColor: tabBarColors.inactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarColors.backgroundColor,
          borderTopWidth: 1,
          borderTopColor: tabBarColors.borderTopColor,
          paddingTop: RNPlatform.OS === 'ios' ? 8 : 4,
          paddingBottom: RNPlatform.OS === 'ios' ? 8 : 16, // Extra padding for Android
          height: RNPlatform.OS === 'ios' ? 72 : 80, // Taller for Android
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 8, // Higher elevation for Android
          // Android specific styles
          ...(RNPlatform.OS === 'android' && {
            paddingHorizontal: 8,
            paddingVertical: 8,
          }),
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: RNPlatform.OS === 'ios' ? 44 : 48, // Minimum touch target
          paddingHorizontal: 12,
          paddingVertical: RNPlatform.OS === 'ios' ? 8 : 4,
        },
        headerShown: false, // We're using custom headers in screens
      })}
    >
      <Tab.Screen 
        name="Feed"
        options={{
          tabBarLabel: getTranslation('feed', language)
        }}
      >
        {(props) => <PostFeedScreen {...props} user={user} onGoToVerification={onGoToVerification} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Clips"
        options={{
          tabBarLabel: getTranslation('clips', language)
        }}
      >
        {(props) => <ClipsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Chats"
        options={{
          tabBarLabel: getTranslation('chats', language)
        }}
      >
        {(props) => <ChatListScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Notifications"
        options={{
          tabBarLabel: getTranslation('notifications', language)
        }}
      >
        {(props) => <NotificationScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile"
        options={{
          tabBarLabel: getTranslation('profile', language)
        }}
      >
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AuthStackNavigator({ onLogin }) {
  const { theme } = useTheme();
  const navigationColors = getNavigationColors(theme);
  
  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: navigationColors.backgroundColor,
          borderBottomWidth: 1,
          borderBottomColor: navigationColors.borderBottomColor,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: navigationColors.titleColor,
        },
        headerTintColor: navigationColors.tintColor,
      }}
    >
      <Stack.Screen 
        name="Login" 
        options={{ headerShown: false }}
      >
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Register" 
        options={{ headerShown: false }}
      >
        {(props) => <RegisterScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainStackNavigator({ user, onLogout, onGoToVerification }) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs">
        {(props) => <MainTabNavigator {...props} user={user} onLogout={onLogout} onGoToVerification={onGoToVerification} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Chat"
        options={{
          headerShown: false
        }}
      >
        {(props) => <ChatScreen {...props} user={user} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="UserSearch"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      >
        {(props) => <UserSearchScreen {...props} user={user} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="CreatePost"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      >
        {(props) => <CreatePostScreen {...props} user={user} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Settings" 
        options={{ 
          title: 'Тохиргоо',
          headerBackTitleVisible: false,
        }}
      >
        {(props) => <SettingsScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="UserProfile"
        options={{
          headerShown: false,
        }}
      >
        {(props) => <UserProfileScreen {...props} user={user} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="EditProfile"
        options={{
          headerShown: false,
        }}
      >
        {(props) => <EditProfileScreen {...props} user={user} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="HelpCenter"
        options={{
          headerShown: false,
        }}
      >
        {(props) => <HelpCenterScreen {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register notification listeners ONCE at the top level
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      // TODO: Save this token to your backend for this user!
      console.log('Expo Push Token:', token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize analytics
        analyticsService.init();
        
        // Check if user is already logged in
        await checkAuth();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();

    return () => {
      analyticsService.stop();
    };
  }, []);

  const checkAuth = async () => {
    try {
      // First, test the connection
      console.log('🔍 Testing server connection...');
      const healthCheck = await apiService.healthCheck();
      if (!healthCheck.success) {
        console.error('❌ Server connection failed:', healthCheck.message);
        // Still continue with auth check, but log the issue
      } else {
        console.log('✅ Server connection successful');
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log('🔍 Checking authentication with stored token...');
        const response = await apiService.getCurrentUser();
        if (response.success) {
          console.log('✅ Authentication successful');
          setUser(response.data.user);
          // Connect to socket
          socketService.connect(token);
        } else {
          console.log('❌ Authentication failed, removing token');
          await AsyncStorage.removeItem('token');
        }
      } else {
        console.log('ℹ️ No stored token found');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear all data on critical errors
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        console.log('🌐 Network error detected, clearing data...');
        await clearAllData();
      } else {
        // Just clear token for auth errors
        await AsyncStorage.removeItem('token');
      }
      // Don't show error to user for auth check failures
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData, loginInfo = {}) => {
    try {
      setUser(userData);
      
      // Show welcome modal for new users or on app update
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      const appVersion = await AsyncStorage.getItem('appVersion');
      const currentVersion = '1.0.0'; // Update this when you release new versions
      
      // For testing: Force show welcome modal (remove this line after testing)
      await AsyncStorage.removeItem('hasSeenWelcome');
      await AsyncStorage.removeItem('appVersion');
      
      // Force show modal for testing (remove this after testing)
      // setShowWelcomeModal(true); // This line is removed
      
      console.log('🔄 Welcome modal check:', {
        hasSeenWelcome,
        appVersion,
        currentVersion,
        shouldShow: !hasSeenWelcome || appVersion !== currentVersion
      });
      
      if (!hasSeenWelcome || appVersion !== currentVersion) {
        console.log('✅ Showing welcome modal');
        // setShowWelcomeModal(true); // This line is removed
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
        await AsyncStorage.setItem('appVersion', currentVersion);
      } else {
        console.log('ℹ️ Welcome modal already shown, skipping');
      }
      
      // Initialize services with error handling
      try {
        await socketService.connect(userData.token);
      } catch (socketError) {
        console.error('Socket connection error:', socketError);
      }
      
      try {
        if (analyticsService && typeof analyticsService.initialize === 'function') {
          await analyticsService.initialize(userData._id);
        }
      } catch (analyticsError) {
        console.error('Analytics initialization error:', analyticsError);
      }
      
      try {
        if (pushNotificationService && typeof pushNotificationService.initialize === 'function') {
          await pushNotificationService.initialize(userData._id);
        }
      } catch (pushError) {
        console.error('Push notification initialization error:', pushError);
      }
      
      // Set up push notifications (optional - won't block login)
      setTimeout(async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await apiService.updatePushToken(token);
            console.log('Push token sent to server successfully');
          } else {
            console.log('No push token available (this is normal in development)');
          }
        } catch (pushTokenError) {
          console.error('Push token setup error (non-blocking):', pushTokenError);
        }
      }, 1000); // Delay push notification setup to not block login
      
      // Show verification banner if needed
      if (!userData.emailVerified) {
        setShowVerificationBanner(true);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Алдаа', 'Нэвтрэхэд алдаа гарлаа');
    }
  };

  const handleLogout = async () => {
    console.log('🔄 handleLogout called');
    try {
      // Track logout event with error handling
      try {
        if (analyticsService && typeof analyticsService.trackUserLogout === 'function') {
          analyticsService.trackUserLogout();
          console.log('📊 Analytics tracked');
        }
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
      }
      
      // Try to call logout API, but don't fail if it doesn't work
      try {
        await apiService.logout();
        console.log('✅ API logout successful');
      } catch (logoutError) {
        console.log('ℹ️ Logout API call failed (expected if token invalidated):', logoutError.message);
        // This is expected behavior when token is already invalidated
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      console.log('🧹 Cleaning up user session...');
      setUser(null);
      socketService.disconnect();
      await AsyncStorage.removeItem('token');
      console.log('✅ Logout cleanup complete');
    }
  };

  const clearAllData = async () => {
    try {
      console.log('🧹 Clearing all stored data...');
      await AsyncStorage.clear();
      setUser(null);
      socketService.disconnect();
      console.log('✅ All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleVerificationSuccess = (verifiedUser) => {
    setUser(verifiedUser);
    setShowVerificationBanner(false);
    setShowVerificationModal(false);
  };

  const handleGoToVerification = () => {
    setShowVerificationModal(true);
  };

  const handleCancelVerification = () => {
    setShowVerificationBanner(false);
  };

  if (!appIsReady || loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SafeAreaProvider>
          <AppContent 
            user={user} 
            onLogout={handleLogout} 
            onLogin={handleLogin}
            showSplash={showSplash}
            onSplashComplete={handleSplashComplete}
            showVerificationBanner={showVerificationBanner}
            showVerificationModal={showVerificationModal}
            setShowVerificationModal={setShowVerificationModal}
            onVerificationSuccess={handleVerificationSuccess}
            onGoToVerification={handleGoToVerification}
            onCancelVerification={handleCancelVerification}
            // showWelcomeModal={showWelcomeModal} // This line is removed
            // setShowWelcomeModal={setShowWelcomeModal} // This line is removed
          />
        </SafeAreaProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppContent({ 
  user, 
  onLogout, 
  onLogin, 
  showSplash, 
  onSplashComplete,
  showVerificationBanner,
  showVerificationModal,
  setShowVerificationModal,
  onVerificationSuccess,
  onGoToVerification,
  onCancelVerification
}) {
  const { theme, isLoading } = useTheme();
  const { language, isLoading: languageLoading } = useLanguage();
  const statusBarStyle = getStatusBarStyle(theme);
  const statusBarBackgroundColor = getStatusBarBackgroundColor(theme);

  if (isLoading || languageLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationContainer key={language}>
        <StatusBar 
          style={statusBarStyle} 
          backgroundColor={statusBarBackgroundColor}
          translucent={RNPlatform.OS === 'android'}
          barStyle={RNPlatform.OS === 'ios' ? statusBarStyle : 'light-content'}
        />
        {user ? (
          <MainStackNavigator user={user} onLogout={onLogout} onGoToVerification={onGoToVerification} />
        ) : (
          <AuthStackNavigator onLogin={onLogin} />
        )}
      </NavigationContainer>
      
      {/* Email Verification Banner */}
      <EmailVerificationBanner
        user={user}
        visible={showVerificationBanner && user && !user.emailVerified}
        onGoToVerification={onGoToVerification}
        onCancel={onCancelVerification}
      />

      {/* Email Verification Modal */}
      <EmailVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        user={user}
        onVerificationSuccess={onVerificationSuccess}
      />

      {/* Welcome Modal */}
      {/* <WelcomeModal // This line is removed */}
      {/*   isVisible={showWelcomeModal} // This line is removed */}
      {/*   onClose={() => setShowWelcomeModal(false)} // This line is removed */}
      {/*   user={user} // This line is removed */}
      {/* /> // This line is removed */}
      
      <Toast />
      
      {/* Splash Screen Overlay */}
      {showSplash && (
        <CustomSplashScreen onAnimationComplete={onSplashComplete} />
      )}
    </>
  );
}

// Helper function
async function registerForPushNotificationsAsync() {
  try {
    let token;
    
    // Check if we're in development or production
    const isDevelopment = __DEV__;
    
    if (RNPlatform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }
    
    // Only try to get push token if we have proper configuration
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id' // Add your actual project ID here
      })).data;
      console.log('Push token obtained successfully:', token);
    } catch (pushTokenError) {
      console.log('Push token error (this is normal in development):', pushTokenError.message);
      return null;
    }
    
    return token;
  } catch (error) {
    console.log('Push notification setup error (this is normal in development):', error.message);
    return null;
  }
} 
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
import Constants from 'expo-constants';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { NavigationProvider, useNavigationState } from './src/contexts/NavigationContext';
import { BottomTabProvider, useBottomTab } from './src/contexts/BottomTabContext';
import { getTranslation } from './src/utils/translations';
import { getStatusBarStyle, getStatusBarBackgroundColor, getTabBarColors, getNavigationColors, getThemeColors } from './src/utils/themeUtils';

// Services
import apiService from './src/services/api';
import socketService from './src/services/socket';
import analyticsService from './src/services/analyticsService';
import pushNotificationService, { setNavigationStateRef, setCurrentUserId, clearCurrentUserId, testNotificationFiltering, logNotificationFilteringStatus } from './src/services/pushNotificationService';
import appUpdateService from './src/services/appUpdateService';

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
// import ClipsScreen from './src/screens/ClipsScreen'; // Temporarily hidden
import HelpCenterScreen from './src/screens/HelpCenterScreen';
import AppUpdateScreen from './src/screens/AppUpdateScreen';

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

function MainTabNavigator({ user, onLogout, onGoToVerification, onTestPushNotification }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { translateY } = useBottomTab();
  const tabBarColors = getTabBarColors(theme);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Clips') {
            // Temporarily hidden - iconName = focused ? 'film' : 'film-outline';
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
          // Smooth animated hide/show based on scroll direction
          opacity: translateY.interpolate({
            inputRange: [0, 120],
            outputRange: [1, 0],
            extrapolate: 'clamp',
          }),
          transform: [{ translateY: translateY }],
          // Ensure background is properly handled when hidden
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
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
      {/* Temporarily hidden Clips tab
      <Tab.Screen 
        name="Clips"
        options={{
          tabBarLabel: getTranslation('clips', language)
        }}
      >
        {(props) => <ClipsScreen {...props} user={user} />}
      </Tab.Screen>
      */}
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
                 {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} onTestPushNotification={onTestPushNotification} />}
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

function MainStackNavigator({ user, onLogout, onGoToVerification, onShowVerificationBanner, onProfileUpdate, onTestPushNotification }) {
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
         {(props) => <MainTabNavigator {...props} user={user} onLogout={onLogout} onGoToVerification={onGoToVerification} onTestPushNotification={onTestPushNotification} />}
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
        {(props) => <SettingsScreen {...props} user={user} onLogout={onLogout} onGoToVerification={onGoToVerification} onShowVerificationBanner={onShowVerificationBanner} />}
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
                 {(props) => <EditProfileScreen {...props} user={user} onProfileUpdate={onProfileUpdate} />}
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

// Global flag to prevent multiple token expiration handlers from running
let isTokenExpirationHandling = false;

function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  // Register notification listeners ONCE at the top level
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        console.log('🔔 Setting up push notifications on app start...');
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('✅ Initial push token obtained:', token);
          // Store the token immediately
          try {
            await AsyncStorage.setItem('pushToken', token);
            console.log('💾 Initial push token stored');
          } catch (storageError) {
            console.log('⚠️ Could not store initial push token:', storageError);
          }
        } else {
          console.log('⚠️ No initial push token obtained');
        }
      } catch (error) {
        console.error('❌ Initial push notification setup failed:', error);
      }
    };

    setupPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // The actual notification suppression will be handled in the pushNotificationService
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
        // Clear any existing user ID to ensure clean state
        clearCurrentUserId();
        
        // Set up global token expiration handler
        apiService.setTokenExpirationHandler(handleTokenExpiration);
        
        // Initialize analytics
        analyticsService.init();
        
        // Check for app updates
        console.log('🔍 App.js: Starting app update check...');
        await checkForAppUpdates();
        console.log('🔍 App.js: App update check completed');
        
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

  // Set up navigation state reference for notifications after app is ready
  useEffect(() => {
    if (appIsReady) {
      // Set navigation state reference for notifications
      setNavigationStateRef({
        shouldShowNotification: (data) => {
          // Check if user is already in the relevant screen
          if (data && data.type === 'message' && data.chatId) {
            // Don't show notification if user is already in the chat
            return false;
          }
          return true;
        }
      });
      
      // Log initial notification filtering status
      logNotificationFilteringStatus();
      
      console.log('✅ Navigation state reference set up for notifications');
    }
  }, [appIsReady]);

  // Monitor user changes and update current user ID for notification filtering
  useEffect(() => {
    if (user) {
      console.log('🔔 User changed, updating current user ID for notifications:', user._id);
      setCurrentUserId(user._id);
      
      // Test notification filtering after a short delay to ensure it's set up
      setTimeout(() => {
        console.log('🧪 Testing notification filtering after user change...');
        testNotificationFiltering();
      }, 1000);
    } else {
      console.log('🔔 User cleared, clearing current user ID for notifications');
      // Debounce the clearCurrentUserId call to prevent spam
      const timeoutId = setTimeout(() => {
        clearCurrentUserId();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  // Set up periodic token refresh for authenticated users
  useEffect(() => {
    if (!user) return;

    // Refresh token every 10 minutes to keep it fresh
    const tokenRefreshInterval = setInterval(async () => {
      try {
        // Double-check that user is still authenticated
        if (!user) {
          console.log('🔄 User no longer authenticated, stopping token refresh');
          return;
        }
        
        if (__DEV__) {
          console.log('🔄 Periodic token refresh check...');
        }
        
        // This will automatically refresh the token if needed
        await apiService.ensureValidToken();
      } catch (error) {
        if (__DEV__) {
          console.error('Periodic token refresh error:', error);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [user]);

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
        try {
          const response = await apiService.getCurrentUser();
          if (response.success) {
            console.log('✅ Authentication successful');
            setUser(response.data.user);
            // Set current user ID for notification filtering
            setCurrentUserId(response.data.user._id);
            // Connect to socket
            socketService.connect(token);
          } else {
            console.log('❌ Authentication failed, removing token');
            await AsyncStorage.removeItem('token');
            await apiService.clearToken();
          }
        } catch (authError) {
          console.log('❌ Authentication error:', authError.message);
          // Clear token for any auth-related errors
          await AsyncStorage.removeItem('token');
          await apiService.clearToken();
          
          // If it's a token expiration, log it specifically
          if (authError.message.includes('Token has expired')) {
            console.log('🔐 Expired token cleared, user needs to login again');
          }
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
      } else if (error.message.includes('Token has expired')) {
        console.log('🔐 Token expired, clearing authentication data');
        await AsyncStorage.removeItem('token');
        await apiService.clearToken();
      } else {
        // Just clear token for other auth errors
        await AsyncStorage.removeItem('token');
        await apiService.clearToken();
      }
      // Don't show error to user for auth check failures
    } finally {
      setLoading(false);
    }
  };

  // Handle token expiration globally
  const handleTokenExpiration = () => {
    // Prevent multiple simultaneous executions (synchronous check)
    if (isTokenExpirationHandling) {
      console.log('🔐 Token expiration handler already executing, skipping...');
      return;
    }
    
    // Set flag immediately (synchronous)
    isTokenExpirationHandling = true;
    console.log('🔐 Global token expiration handler triggered');
    
    // Handle the token expiration asynchronously
    (async () => {
      try {
        // Clear all authentication data without triggering the handler again
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        
        // Clear user state
        setUser(null);
        clearCurrentUserId();
        
        // Disconnect socket
        socketService.disconnect();
        
        console.log('✅ Token expiration handled, user redirected to login');
      } catch (error) {
        console.error('Error handling token expiration:', error);
      } finally {
        // Reset flag after work is done
        isTokenExpirationHandling = false;
      }
    })();
  };

  const checkForAppUpdates = async () => {
    try {
      console.log('🔍 Checking for app updates...');
      
      // Get update info from the service
      const updateInfo = await appUpdateService.getUpdateInfo();
      
      console.log('🔍 Update info received:', updateInfo);
      
      if (updateInfo) {
        // Check if this is a TestFlight introduction or an actual update
        if (updateInfo.isTestFlight) {
          console.log('🔍 TestFlight introduction detected');
          setUpdateInfo(updateInfo);
          setShowUpdateScreen(true);
        } else if (updateInfo.isUpdateRequired || updateInfo.isForceUpdate) {
          console.log('🔍 Update required:', {
            isUpdateRequired: updateInfo.isUpdateRequired,
            isForceUpdate: updateInfo.isForceUpdate,
            currentVersion: updateInfo.currentVersion,
            latestVersion: updateInfo.latestVersion
          });
          
          setUpdateInfo(updateInfo);
          setShowUpdateScreen(true);
        } else {
          console.log('🔍 No update required - versions are current');
        }
      } else {
        console.log('🔍 No update info available');
      }
    } catch (error) {
      console.error('Error checking for app updates:', error);
      // Don't block app startup if update check fails
    }
  };

  // Function to manually trigger update check (useful for testing)
  const triggerUpdateCheck = async () => {
    console.log('🔍 Manually triggering update check...');
    await checkForAppUpdates();
  };

  // Test function to simulate different version scenarios
  const testUpdateLogic = async () => {
    console.log('🧪 Testing update logic...');
    
    // Test with current version
    const currentVersion = appUpdateService.getCurrentVersion();
    console.log('🧪 Current version:', currentVersion);
    
    // Test version comparison
    const testVersions = ['1.4.9', '1.5.0', '1.5.1', '1.6.0', '2.0.0'];
    testVersions.forEach(testVersion => {
      const result = appUpdateService.isUpdateRequired(testVersion, currentVersion.version);
      console.log(`🧪 Testing ${testVersion} vs ${currentVersion.version}:`, result);
    });
    
    // Trigger actual update check
    await triggerUpdateCheck();
  };

  // Make test function available globally for debugging
  if (__DEV__) {
    global.testUpdateLogic = testUpdateLogic;
    global.triggerUpdateCheck = triggerUpdateCheck;
    console.log('🧪 Update test functions available globally:');
    console.log('🧪 - testUpdateLogic() - Test version comparison logic');
    console.log('🧪 - triggerUpdateCheck() - Manually trigger update check');
  }

  const handleUpdateSkip = async () => {
    if (updateInfo) {
      await appUpdateService.skipVersion(updateInfo.latestVersion);
      setShowUpdateScreen(false);
      setUpdateInfo(null);
    }
  };

  const handleUpdateComplete = () => {
    setShowUpdateScreen(false);
    setUpdateInfo(null);
  };

  const handleLogin = async (userData, loginInfo = {}) => {
    try {
      setUser(userData);
      
      // Set current user ID for notification filtering
      setCurrentUserId(userData._id);
      
      // Show welcome modal for new users or on app update
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      const appVersion = await AsyncStorage.getItem('appVersion');
      const currentVersion = '1.5.0'; // Update this when you release new versions
      
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
      
             // Set up push notifications (critical for TestFlight)
       setTimeout(async () => {
         try {
           console.log('🔔 Setting up push notifications...');
           const token = await registerForPushNotificationsAsync();
           
           if (token) {
             console.log('📱 Push token obtained, sending to server...');
             
             // Send to main API service
             try {
               await apiService.updatePushToken(token);
               console.log('✅ Push token sent to server successfully');
             } catch (apiError) {
               console.error('❌ Failed to send push token to API:', apiError);
             }
             
             // Also update through push notification service
             try {
               const pushNotificationService = require('./src/services/pushNotificationService').default;
               await pushNotificationService.updatePushTokenForUser();
               console.log('✅ Push token updated in notification service');
             } catch (serviceError) {
               console.error('❌ Failed to update push token in notification service:', serviceError);
             }
             
           } else {
             if (__DEV__) {
               console.log('ℹ️ No push token available (this is normal in development)');
             } else {
               console.log('⚠️ No push token available - notifications may not work');
               console.log('🔧 Check console logs above for push token generation errors');
             }
           }
         } catch (pushTokenError) {
           console.error('❌ Push token setup error:', pushTokenError);
           console.log('🔧 This may affect push notification functionality');
         }
       }, 2000); // Increased delay for TestFlight builds
      
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
    try {
      console.log('🚪 Logging out...');
      
      // Call logout API
      await apiService.logout();
      
      // Clear user state
      setUser(null);
      
      // Clear current user ID for notification filtering (debounced)
      setTimeout(() => {
        clearCurrentUserId();
      }, 100);
      
      socketService.disconnect();
      await AsyncStorage.removeItem('token');
      console.log('✅ Logout cleanup complete');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      console.log('🧹 Cleaning up user session...');
      setUser(null);
      // Clear current user ID for notification filtering (debounced)
      setTimeout(() => {
        clearCurrentUserId();
      }, 100);
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
      // Clear current user ID for notification filtering (debounced)
      setTimeout(() => {
        clearCurrentUserId();
      }, 100);
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
    // Set current user ID for notification filtering
    setCurrentUserId(verifiedUser._id);
    setShowVerificationBanner(false);
    setShowVerificationModal(false);
  };

  const handleGoToVerification = () => {
    // Show verification modal and also ensure banner is visible
    setShowVerificationModal(true);
    setShowVerificationBanner(true);
  };

  const handleCancelVerification = () => {
    // Hide banner temporarily, but show it again after 5 seconds
    setShowVerificationBanner(false);
    setTimeout(() => {
      // Only show again if user still exists and email is not verified
      if (user && !user.emailVerified) {
        setShowVerificationBanner(true);
      }
    }, 5000); // 5 seconds delay
  };

  const handleManualShowVerification = () => {
    // Manually show verification banner if user's email is not verified
    if (user && !user.emailVerified) {
      setShowVerificationBanner(true);
    }
  };

  const testPushNotification = async () => {
    try {
      console.log('🧪 Testing push notification...');
      
      // First, try to get stored push token
      let token = await getStoredPushToken();
      
      if (!token) {
        console.log('📱 No stored push token found, trying to generate new one...');
        token = await registerForPushNotificationsAsync();
      }
      
      if (token) {
        console.log('✅ Push token available:', token);
        
        // Send test notification to yourself
        try {
          await apiService.sendTestNotification();
          Alert.alert(
            'Test Notification Sent', 
            'Check if you receive a notification. If not, check console logs for errors.',
            [{ text: 'OK' }]
          );
        } catch (error) {
          console.error('❌ Failed to send test notification:', error);
          Alert.alert(
            'Test Failed', 
            'Could not send test notification. Check console logs for details.',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('❌ No push token available');
        
        // Provide more specific guidance based on environment
        const isDevelopment = __DEV__;
        const isTestFlight = !isDevelopment && RNPlatform.OS === 'ios';
        
        let guidanceMessage = 'Push notification token not available. ';
        
        if (isTestFlight) {
          guidanceMessage += 'For TestFlight builds, ensure:\n\n1. App has notification permissions\n2. Project ID is correct in app.json\n3. EAS build is properly configured\n4. Apple Push Notification service is enabled';
        } else if (isDevelopment) {
          guidanceMessage += 'For development, this is normal. Push tokens only work in production builds.';
        } else {
          guidanceMessage += 'Check console logs above for push token generation errors.';
        }
        
        // Offer to manually refresh the token
        Alert.alert(
          'No Push Token', 
          guidanceMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Refresh Token', 
              onPress: async () => {
                console.log('🔄 User requested manual token refresh...');
                const newToken = await refreshPushToken();
                if (newToken) {
                  Alert.alert(
                    'Token Refreshed', 
                    'New push token obtained. Try testing notifications again.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'Refresh Failed', 
                    'Could not obtain new push token. Check console logs for details.',
                    [{ text: 'OK' }]
                  );
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Push notification test error:', error);
      Alert.alert(
        'Test Error', 
        'Error testing push notifications. Check console logs.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!appIsReady || loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <NavigationProvider>
          <BottomTabProvider>
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
                 onShowVerificationBanner={handleManualShowVerification}
                 showUpdateScreen={showUpdateScreen}
                 updateInfo={updateInfo}
                 onUpdateSkip={handleUpdateSkip}
                 onUpdateComplete={handleUpdateComplete}
                 onProfileUpdate={setUser}
                 onTestPushNotification={testPushNotification}
               />
            </SafeAreaProvider>
          </BottomTabProvider>
        </NavigationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

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
  onCancelVerification,
  onShowVerificationBanner,
  showUpdateScreen,
  updateInfo,
  onUpdateSkip,
  onUpdateComplete,
  onProfileUpdate,
  onTestPushNotification
}) {
  const { theme, isLoading } = useTheme();
  const { language, isLoading: languageLoading } = useLanguage();
  const navigationState = useNavigationState();
  const statusBarStyle = getStatusBarStyle(theme);
  const statusBarBackgroundColor = getStatusBarBackgroundColor(theme);
  const colors = getThemeColors(theme); // Added this line

  // Set navigation state reference for push notification service
  useEffect(() => {
    setNavigationStateRef(navigationState);
  }, [navigationState]);

  if (isLoading || languageLoading) {
    return <LoadingScreen />;
  }

  // Show update screen if update is required
  if (showUpdateScreen && updateInfo) {
    return (
      <AppUpdateScreen
        isUpdateRequired={updateInfo.isForceUpdate}
        currentVersion={updateInfo.currentVersion}
        latestVersion={updateInfo.latestVersion}
        updateDescription={updateInfo.updateDescription}
        onSkip={updateInfo.canSkip ? onUpdateSkip : null}
        onUpdate={onUpdateComplete}
        isTestFlight={updateInfo.isTestFlight || false}
        storeUrl={updateInfo.storeUrl}
      />
    );
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <NavigationContainer key={language}>
          <StatusBar 
            style={statusBarStyle} 
            backgroundColor={statusBarBackgroundColor}
            translucent={RNPlatform.OS === 'android'}
            barStyle={RNPlatform.OS === 'ios' ? statusBarStyle : 'light-content'}
          />
                     {user ? (
             <MainStackNavigator user={user} onLogout={onLogout} onGoToVerification={onGoToVerification} onShowVerificationBanner={onShowVerificationBanner} onProfileUpdate={onProfileUpdate} onTestPushNotification={onTestPushNotification} />
           ) : (
            <AuthStackNavigator onLogin={onLogin} />
          )}
        </NavigationContainer>
      </View>
      
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
    const isTestFlight = !isDevelopment && RNPlatform.OS === 'ios';
    
    console.log('🔔 Registering for push notifications...');
    console.log('📱 Environment:', {
      isDevelopment,
      isProduction: !isDevelopment,
      isTestFlight,
      platform: RNPlatform.OS
    });
    
    // Set up notification channel for Android
    if (RNPlatform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('🔔 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission not granted');
      console.log('📋 Permission status:', finalStatus);
      return null;
    }
    
    console.log('✅ Push notification permissions granted');
    
    // Get project ID - this is crucial for TestFlight
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.expoConfig?.extra?.projectId ||
      Constants.expoConfig?.projectId ||
      process.env.EXPO_PROJECT_ID ||
      '228cdfa0-b203-439c-bfe6-c6b682a56be3'; // Your actual project ID
    
    console.log('🔍 Project ID for push token:', {
      projectId,
      isDevelopment,
      isProduction: !isDevelopment,
      isTestFlight
    });
    
    // Debug Constants configuration
    console.log('🔍 Constants configuration:', {
      expoConfig: Constants.expoConfig,
      extra: Constants.expoConfig?.extra,
      eas: Constants.expoConfig?.extra?.eas,
      projectId: Constants.expoConfig?.projectId
    });
    
    // Validate project ID
    if (!projectId || projectId === 'your-project-id') {
      console.log('⚠️ Invalid project ID found, skipping push token generation');
      console.log('📋 Available config:', {
        expoConfig: Constants.expoConfig,
        extra: Constants.expoConfig?.extra,
        eas: Constants.expoConfig?.extra?.eas
      });
      return null;
    }
    
    // Get push token
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      
      console.log('✅ Push token obtained successfully:', token);
      console.log('📋 Token details:', {
        token: token,
        tokenLength: token?.length,
        startsWithExponent: token?.startsWith('ExponentPushToken'),
        isDevelopment,
        isProduction: !isDevelopment,
        isTestFlight
      });
      
      // For TestFlight, log additional debugging info
      if (isTestFlight) {
        console.log('🔧 TestFlight build - push token generated successfully');
        console.log('🔧 Ensure your server is configured to send to this token');
        console.log('🔧 Token type:', token?.startsWith('ExponentPushToken') ? 'Expo' : 'Unknown');
      }
      
      // Store the token for later use
      if (token) {
        try {
          await AsyncStorage.setItem('pushToken', token);
          console.log('💾 Push token stored in AsyncStorage');
        } catch (storageError) {
          console.log('⚠️ Could not store push token:', storageError);
        }
      }
      
    } catch (pushTokenError) {
      console.error('❌ Push token error:', pushTokenError);
      console.log('📋 Push token error details:', {
        message: pushTokenError.message,
        code: pushTokenError.code,
        stack: pushTokenError.stack
      });
      
      // For TestFlight builds, provide specific guidance
      if (isTestFlight) {
        console.log('🔧 TestFlight build detected - push token generation failed');
        console.log('🔧 Common issues:');
        console.log('🔧 1. Check app.json has correct project ID');
        console.log('🔧 2. Verify EAS build configuration');
        console.log('🔧 3. Ensure Apple Push Notification service is enabled');
        console.log('🔧 Current project ID:', projectId);
      }
      
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('❌ Push notification setup error:', error);
    console.log('📋 Setup error details:', {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

// Add a function to get stored push token
async function getStoredPushToken() {
  try {
    const storedToken = await AsyncStorage.getItem('pushToken');
    if (storedToken) {
      console.log('📱 Retrieved stored push token:', storedToken);
      return storedToken;
    }
    return null;
  } catch (error) {
    console.log('⚠️ Could not retrieve stored push token:', error);
    return null;
  }
}

// Add a function to manually refresh push token
async function refreshPushToken() {
  try {
    console.log('🔄 Manually refreshing push token...');
    const newToken = await registerForPushNotificationsAsync();
    if (newToken) {
      console.log('✅ New push token obtained:', newToken);
      // Store the new token
      try {
        await AsyncStorage.setItem('pushToken', newToken);
        console.log('💾 New push token stored');
        return newToken;
      } catch (storageError) {
        console.log('⚠️ Could not store new push token:', storageError);
        return newToken; // Return token even if storage fails
      }
    } else {
      console.log('❌ Failed to obtain new push token');
      return null;
    }
  } catch (error) {
    console.error('❌ Error refreshing push token:', error);
    return null;
  }
} 
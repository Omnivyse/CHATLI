import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StatusBar, Platform } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Alert, LogBox, Platform as RNPlatform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { getStatusBarStyle, getStatusBarBackgroundColor, getTabBarColors, getNavigationColors } from './src/utils/themeUtils';

// Services
import apiService from './src/services/api';
import socketService from './src/services/socket';
import analyticsService from './src/services/analyticsService';

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

function MainTabNavigator({ user, onLogout }) {
  const { theme } = useTheme();
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
        headerShown: false,
      })}
    >
      <Tab.Screen name="Feed">
        {(props) => <PostFeedScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Clips">
        {(props) => <ClipsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Chats">
        {(props) => <ChatListScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Notifications">
        {(props) => <NotificationScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
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

function MainStackNavigator({ user, onLogout }) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? { background: '#0f172a' } : { background: '#ffffff' };
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs">
        {(props) => <MainTabNavigator {...props} user={user} onLogout={onLogout} />}
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
        component={SettingsScreen}
        options={{ 
          title: 'Тохиргоо',
          headerBackTitleVisible: false,
        }}
      />
      
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
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
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
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
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
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await apiService.getCurrentUser();
        if (response.success) {
          setUser(response.data.user);
          // Connect to socket
          socketService.connect(token);
        } else {
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData, loginInfo = {}) => {
    setUser(userData);
    
    // Track login event
    if (loginInfo.isNewUser) {
      analyticsService.trackUserRegister();
    } else {
      analyticsService.trackUserLogin();
    }
    
    // Connect to socket with token
    const token = await AsyncStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }
  };

  const handleLogout = async () => {
    try {
      // Track logout event
      analyticsService.trackUserLogout();
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      socketService.disconnect();
      await AsyncStorage.removeItem('token');
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (!appIsReady || loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent 
          user={user} 
          onLogout={handleLogout} 
          onLogin={handleLogin}
          showSplash={showSplash}
          onSplashComplete={handleSplashComplete}
        />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent({ user, onLogout, onLogin, showSplash, onSplashComplete }) {
  const { theme, isLoading } = useTheme();
  const statusBarStyle = getStatusBarStyle(theme);
  const statusBarBackgroundColor = getStatusBarBackgroundColor(theme);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationContainer>
        <StatusBar 
          style={statusBarStyle} 
          backgroundColor={statusBarBackgroundColor}
          translucent={RNPlatform.OS === 'android'}
          barStyle={RNPlatform.OS === 'ios' ? statusBarStyle : 'light-content'}
        />
        {user ? (
          <MainStackNavigator user={user} onLogout={onLogout} />
        ) : (
          <AuthStackNavigator onLogin={onLogin} />
        )}
      </NavigationContainer>
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
  let token;
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
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
} 
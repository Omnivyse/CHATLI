import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Alert, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import ClipsScreen from './src/screens/ClipsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import UserSearchScreen from './src/screens/UserSearchScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingTop: 8,
          paddingBottom: 8,
          height: 72,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 5,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 44, // Minimum touch target
          paddingHorizontal: 12,
          paddingVertical: 8,
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
  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e5e5',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#000000',
        },
        headerTintColor: '#000000',
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="MainTabs">
        {(props) => <MainTabNavigator {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Chat"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: '#fff',
            shadowOpacity: 0,
            elevation: 0,
          },
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
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

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
    <>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        {user ? (
          <MainStackNavigator user={user} onLogout={handleLogout} />
        ) : (
          <AuthStackNavigator onLogin={handleLogin} />
        )}
      </NavigationContainer>
      <Toast />
      
      {/* Splash Screen Overlay */}
      {showSplash && (
        <CustomSplashScreen onAnimationComplete={handleSplashComplete} />
      )}
    </>
  );
} 
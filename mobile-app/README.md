# CHATLI Mobile App - React Native

A React Native mobile application for the CHATLI messaging platform. This app connects to your existing backend infrastructure (Railway + MongoDB) without requiring any backend changes.

## 📱 Features

- **Real-time Messaging**: Socket.IO powered chat with typing indicators
- **Cross-Platform**: Works on both iOS and Android
- **Native Performance**: Built with React Native and Expo
- **File Sharing**: Image and document sharing capabilities
- **Push Notifications**: Real-time message notifications
- **Offline Support**: Basic offline functionality
- **Native UI**: Platform-specific design patterns

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Backend**: Uses existing Railway backend (no changes needed)
- **Database**: Same MongoDB Atlas database
- **Real-time**: Socket.IO for live messaging
- **Storage**: AsyncStorage for local data

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (Android development)

### 1. Setup Project

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npm start
```

### 2. Run on Device/Simulator

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web (for testing):**
```bash
npm run web
```

### 3. Configuration

The app automatically connects to your existing backend:

- **Development**: Uses `http://10.0.2.2:5000` (Android) or `http://localhost:5000` (iOS)
- **Production**: Uses `https://chatli-production.up.railway.app`

No backend configuration changes needed! 🎉

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.js
│   │   ├── ChatListScreen.js
│   │   ├── ChatScreen.js
│   │   ├── PostFeedScreen.js
│   │   └── ...
│   ├── components/       # Reusable components
│   │   ├── MessageBubble.js
│   │   ├── LoadingScreen.js
│   │   └── ...
│   ├── services/         # API and Socket services
│   │   ├── api.js
│   │   ├── socket.js
│   │   └── analytics.js
│   └── utils/           # Utility functions
├── App.js              # Main app component
├── package.json        # Dependencies
└── README.md          # This file
```

## 🔧 Development Setup

### Backend Connection

The mobile app automatically detects environment:

**Development Mode (`__DEV__ = true`):**
- API: `http://10.0.2.2:5000/api` (Android emulator)
- Socket: `http://10.0.2.2:5000` (Android emulator)
- For iOS simulator, uses `localhost:5000`

**Production Mode:**
- API: `https://chatli-production.up.railway.app/api`
- Socket: `https://chatli-production.up.railway.app`

### Testing on Physical Devices

1. **Install Expo Go** app on your phone
2. **Run** `npm start` in the project directory
3. **Scan QR code** with Expo Go app
4. **Note**: Physical devices need to be on the same network for development

## 🛠️ Building for Production

### Android APK

```bash
# Build Android APK
expo build:android

# Or with EAS Build (recommended)
npm install -g @expo/eas-cli
eas build --platform android
```

### iOS App

```bash
# Build iOS app (requires Mac)
expo build:ios

# Or with EAS Build
eas build --platform ios
```

### App Store Deployment

1. **Configure app.json** with your app details
2. **Build** with EAS Build service
3. **Submit** to App Store/Play Store

## 📱 App Store Configuration

Update `app.json` for your app:

```json
{
  "expo": {
    "name": "CHATLI",
    "slug": "chatli-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.chatli",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourcompany.chatli",
      "versionCode": 1
    }
  }
}
```

## 🔐 Security Considerations

- **API Keys**: No additional API keys needed (uses existing backend)
- **Authentication**: JWT tokens stored securely in AsyncStorage
- **HTTPS**: Production uses HTTPS automatically
- **Permissions**: Camera, storage, notifications as needed

## ⚡ Performance Optimizations

- **Image Caching**: Expo Image for optimized image loading
- **List Virtualization**: FlatList for efficient chat/post lists
- **AsyncStorage**: Optimized local storage usage
- **Socket Management**: Automatic reconnection handling

## 🐛 Debugging

### Common Issues

**Cannot connect to backend:**
```bash
# Make sure backend is running
# Check network connectivity
# Verify URLs in src/services/api.js
```

**Android emulator network issues:**
```bash
# Use 10.0.2.2 instead of localhost
# Check Android emulator settings
```

**iOS simulator issues:**
```bash
# Use localhost for iOS simulator
# Check iOS simulator network settings
```

### Debugging Tools

```bash
# React Native Debugger
npm install -g react-native-debugger

# Flipper (for advanced debugging)
# Install from https://fbflipper.com/
```

## 📊 Analytics Integration

The app includes the same analytics as the web version:

- **User Activity**: Screen views, interactions
- **Performance**: Load times, error tracking
- **Usage Stats**: Message counts, feature usage

## 🔄 Synchronization with Web App

Both web and mobile apps use the same:

- ✅ **Backend API** (Railway)
- ✅ **Database** (MongoDB)
- ✅ **Real-time** (Socket.IO)
- ✅ **File Storage** (Cloudinary)
- ✅ **Authentication** (JWT)

Users can seamlessly switch between web and mobile! 📱💻

## 🚀 Deployment Strategy

### Development Flow
1. **Develop** on local machine
2. **Test** on simulator/device
3. **Build** production version
4. **Deploy** to app stores

### No Backend Changes Needed!

Your existing infrastructure works perfectly:
- ✅ Railway backend continues running
- ✅ MongoDB database stays the same
- ✅ Vercel web app keeps working
- ✅ Users can use both web and mobile

## 📞 Support

For issues specific to the mobile app:
1. Check this README
2. Review React Native/Expo documentation
3. Check backend connectivity
4. Verify API endpoints are accessible

## 🎯 Next Steps

1. **Run the app** locally first
2. **Test** on your device/simulator
3. **Customize** branding and icons
4. **Build** and deploy to app stores
5. **Enjoy** your mobile CHATLI app! 🎉

---

**Your backend infrastructure remains unchanged - this mobile app connects to your existing Railway backend and MongoDB database seamlessly!** 🚀 
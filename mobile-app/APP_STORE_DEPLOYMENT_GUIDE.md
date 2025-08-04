# 🚀 CHATLI Mobile App - App Store Deployment Guide

## 📋 Pre-Deployment Checklist

### 🔒 Security Requirements
- [x] Remove/condition console logs in production
- [x] Environment variables properly configured
- [x] API endpoints use HTTPS
- [x] JWT tokens properly managed
- [x] Input validation implemented
- [x] Error handling without sensitive data exposure

### 📱 App Store Requirements
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect access
- [ ] App icons in all required sizes
- [ ] Screenshots for different device sizes
- [ ] App description and metadata
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)

## 🛠️ Step-by-Step Deployment Process

### 1. Prepare Your Development Environment

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Configure EAS Build
eas build:configure
```

### 2. Update app.json Configuration

```json
{
  "expo": {
    "name": "CHATLI",
    "slug": "chatli-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "splash": {
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.chatli.mobile",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "CHATLI needs access to your camera to take photos and videos for posts.",
        "NSPhotoLibraryUsageDescription": "CHATLI needs access to your photo library to select images and videos for posts.",
        "NSMicrophoneUsageDescription": "CHATLI needs access to your microphone to record videos with sound.",
        "NSLocationWhenInUseUsageDescription": "CHATLI needs access to your location to show nearby events (optional)."
      }
    },
    "android": {
      "package": "com.chatli.mobile",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {},
    "sdkVersion": "53.0.0",
    "platforms": [
      "ios",
      "android",
      "web"
    ],
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "CHATLI needs access to your photos to let you share them with your friends.",
          "cameraPermission": "CHATLI needs access to your camera to let you take photos to share with your friends."
        }
      ],
      [
        "expo-document-picker",
        {
          "iCloudContainerEnvironment": "Production"
        }
      ],
      "expo-video"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 3. Create EAS Build Configuration

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### 4. Environment Configuration

Create production environment file `env.production`:

```bash
# Production API Configuration
API_BASE_URL=https://chatli-production.up.railway.app/api
SOCKET_URL=https://chatli-production.up.railway.app

# App Configuration
APP_NAME=CHATLI
APP_VERSION=1.0.0

# Disable debug mode
DEBUG_MODE=false
LOG_LEVEL=error
```

### 5. Build for Production

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### 6. App Store Connect Setup

#### 6.1 Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Platform**: iOS
   - **Name**: CHATLI
   - **Primary Language**: English
   - **Bundle ID**: com.chatli.mobile
   - **SKU**: chatli-mobile-ios
   - **User Access**: Full Access

#### 6.2 App Information
- **App Name**: CHATLI
- **Subtitle**: Connect, Share, Engage
- **Description**: 
```
CHATLI is a modern social media platform that brings people together through meaningful connections, engaging content, and interactive features.

Key Features:
• Create and share posts with photos and videos
• Join events and group chats
• Real-time messaging and notifications
• Privacy controls and secret posts
• User verification system
• Multi-language support (English/Mongolian)

Connect with friends, discover new content, and engage with your community in a safe and secure environment.
```

#### 6.3 App Screenshots
Required sizes for iPhone:
- 6.7" Display (iPhone 14 Pro Max): 1290 x 2796
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688
- 5.5" Display (iPhone 8 Plus): 1242 x 2208

### 7. Submit to App Store

```bash
# Submit iOS build to App Store
eas submit --platform ios --profile production

# Submit Android build to Google Play Store
eas submit --platform android --profile production
```

### 8. App Store Review Process

#### 8.1 Required Information
- **Privacy Policy URL**: https://chatli.mn/privacy
- **Support URL**: https://chatli.mn/support
- **Marketing URL**: https://chatli.mn (optional)

#### 8.2 App Review Guidelines Compliance
- [x] No hardcoded credentials
- [x] Proper permission usage descriptions
- [x] No excessive data collection
- [x] Clear privacy policy
- [x] Proper error handling
- [x] No debug features in production

#### 8.3 Common Rejection Reasons to Avoid
- Missing privacy policy
- Incomplete app description
- Poor app performance
- Missing required permissions descriptions
- Debug code in production build
- Hardcoded API endpoints

### 9. Post-Deployment

#### 9.1 Monitor App Performance
- Use App Store Connect Analytics
- Monitor crash reports
- Track user engagement metrics

#### 9.2 Update Strategy
- Plan regular updates (every 2-4 weeks)
- Test thoroughly before submission
- Use TestFlight for beta testing

#### 9.3 Security Monitoring
- Monitor API usage patterns
- Check for unusual activity
- Regular security audits

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   expo r -c
   eas build --clear-cache
   ```

2. **App Store Rejection**
   - Review rejection reason carefully
   - Fix issues and resubmit
   - Contact Apple support if needed

3. **Certificate Issues**
   ```bash
   # Regenerate certificates
   eas credentials
   ```

## 📞 Support Resources

- [Expo Documentation](https://docs.expo.dev)
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## 🎯 Success Metrics

Track these metrics after deployment:
- App Store rating and reviews
- Download numbers
- User retention rate
- Crash-free sessions
- API response times
- User engagement metrics

---

**Note**: This guide assumes you have an Apple Developer Account and have completed the initial setup. For detailed setup instructions, refer to the official Apple Developer documentation. 
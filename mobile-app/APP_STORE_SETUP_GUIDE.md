# 🍎 Apple Developer Account Setup - Next Steps

## ✅ **Step 1: Access App Store Connect**

1. **Go to App Store Connect**
   - Visit: https://appstoreconnect.apple.com
   - Sign in with your Apple Developer Account

2. **Create Your First App**
   - Click "My Apps" in the top navigation
   - Click the "+" button → "New App"
   - Fill in the required information:

### **App Information:**
```
Platform: iOS
Name: CHATLI
Primary Language: English
Bundle ID: com.chatli.mobile
SKU: chatli-mobile-ios-001
User Access: Full Access
```

## ✅ **Step 2: Configure Your App**

### **App Store Information:**
- **App Name**: CHATLI
- **Subtitle**: Connect, Share, Engage
- **Keywords**: social media, chat, events, posts, community
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

### **App Category:**
- **Primary Category**: Social Networking
- **Secondary Category**: Entertainment

## ✅ **Step 3: Prepare Required Assets**

### **App Icons (Required Sizes):**
- 1024x1024 (App Store)
- 180x180 (iPhone 6 Plus)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 120x120 (iPhone 4+)
- 87x87 (iPhone 6+)

### **Screenshots (Required for each device):**
- **iPhone 6.7" Display**: 1290 x 2796
- **iPhone 6.5" Display**: 1242 x 2688
- **iPhone 5.5" Display**: 1242 x 2208

### **App Preview Videos (Optional but recommended):**
- 15-30 seconds
- Show key features
- High quality (1080p)

## ✅ **Step 4: Required URLs**

### **Essential URLs:**
- **Privacy Policy**: https://chatli.mn/privacy
- **Support URL**: https://chatli.mn/support
- **Marketing URL**: https://chatli.mn (optional)

### **If you don't have these URLs yet:**
1. **Create a simple website** (use Wix, Squarespace, or GitHub Pages)
2. **Add privacy policy** (use a template or privacy policy generator)
3. **Add support page** with contact information

## ✅ **Step 5: Update Your App Configuration**

### **Update app.json:**
```json
{
  "expo": {
    "name": "CHATLI",
    "slug": "chatli-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
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
    }
  }
}
```

## ✅ **Step 6: Set Up EAS Build**

### **Install EAS CLI:**
```bash
npm install -g @expo/eas-cli
```

### **Login to Expo:**
```bash
eas login
```

### **Configure EAS Build:**
```bash
eas build:configure
```

### **Create eas.json:**
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

## ✅ **Step 7: Build Your App**

### **Create Production Build:**
```bash
# Build for iOS
eas build --platform ios --profile production
```

### **Monitor Build Progress:**
- Check build status at: https://expo.dev/accounts/[your-username]/projects/[your-project]/builds
- Build typically takes 10-20 minutes

## ✅ **Step 8: Submit to App Store**

### **Submit Build:**
```bash
# Submit to App Store
eas submit --platform ios --profile production
```

### **Complete App Store Connect Setup:**
1. **App Information**: Fill in all required fields
2. **Pricing**: Set your app price (Free or Paid)
3. **Availability**: Choose countries where your app will be available
4. **App Review Information**: Provide test account if needed
5. **Version Release**: Choose automatic or manual release

## ✅ **Step 9: App Review Process**

### **What Apple Reviews:**
- [x] App functionality
- [x] User interface
- [x] Content appropriateness
- [x] Privacy policy compliance
- [x] Performance and stability
- [x] Security measures

### **Review Timeline:**
- **Typical review time**: 1-7 days
- **Expedited review**: Available for critical bug fixes
- **Rejection**: Common reasons and how to fix them

## ✅ **Step 10: Post-Submission**

### **Monitor Review Status:**
- Check App Store Connect dashboard
- Respond to any review team questions
- Fix issues if app is rejected

### **Prepare for Launch:**
- Plan marketing strategy
- Prepare social media announcements
- Set up analytics tracking
- Plan user support system

## 🔧 **Troubleshooting Common Issues**

### **Build Failures:**
```bash
# Clear cache and rebuild
expo r -c
eas build --clear-cache --platform ios --profile production
```

### **Certificate Issues:**
```bash
# Regenerate certificates
eas credentials
```

### **App Store Rejection:**
- Read rejection reason carefully
- Fix issues and resubmit
- Contact Apple support if needed

## 📞 **Support Resources**

- **Apple Developer Documentation**: https://developer.apple.com/documentation
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Expo Documentation**: https://docs.expo.dev
- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/

## 🎯 **Success Checklist**

- [ ] Apple Developer Account active
- [ ] App Store Connect app created
- [ ] App assets prepared (icons, screenshots)
- [ ] Privacy policy and support URLs ready
- [ ] EAS build configured
- [ ] Production build successful
- [ ] App submitted to App Store
- [ ] App review completed
- [ ] App approved and published

---

**Next Action**: Start with Step 1 - Create your app in App Store Connect! 
# 🔔 TestFlight Notification Fix Guide

## 🚨 Problem
Push notifications work in Expo development but fail in TestFlight builds.

## ✅ Solution Overview

### 1. **Project ID Configuration**
The main issue is often incorrect project ID configuration for production builds.

### 2. **Enhanced Error Handling**
Added comprehensive logging and error handling to diagnose issues.

### 3. **Debug Testing**
Created automated debug tests to identify specific problems.

## 🔧 Implementation

### **Files Modified:**

1. **`src/services/pushNotificationService.js`**
   - ✅ Added `getProjectId()` method with fallback logic
   - ✅ Enhanced error logging for TestFlight builds
   - ✅ Improved token generation with detailed debugging
   - ✅ Better permission handling

2. **`App.js`**
   - ✅ Updated `registerForPushNotificationsAsync()` function
   - ✅ Added production build debug testing
   - ✅ Enhanced project ID detection

3. **`test-notification-debug.js`** (New)
   - ✅ Comprehensive notification testing
   - ✅ Project ID validation
   - ✅ Device capability checking
   - ✅ Permission testing
   - ✅ Token generation testing

## 📱 Testing Steps

### **1. Build and Test**
```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production
```

### **2. Debug on Device**
1. Install the TestFlight build on your device
2. Open the app and check console logs
3. Look for debug test results in the console
4. Verify push token generation

### **3. Console Logs to Check**
```
🔍 Project ID Detection Test:
✅ Project ID: 228cdfa0-b203-439c-bfe6-c6b682a56be3
📱 Environment: { isDevelopment: false, isProduction: true }

🔔 Getting push token with project ID: 228cdfa0-b203-439c-bfe6-c6b682a56be3
✅ Expo Push Token obtained: ExponentPushToken[xxxxxxxxxxxxx]
```

## 🔍 Troubleshooting

### **Issue 1: "No valid project ID found"**
**Solution:**
1. Check your `app.json` has the correct project ID:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "228cdfa0-b203-439c-bfe6-c6b682a56be3"
      }
    }
  }
}
```

### **Issue 2: "Push token generation failed"**
**Solution:**
1. Ensure you're using a physical device (not simulator)
2. Check notification permissions are granted
3. Verify internet connection
4. Check Expo project configuration

### **Issue 3: "Notification permissions not granted"**
**Solution:**
1. Go to iOS Settings > CHATLI > Notifications
2. Enable "Allow Notifications"
3. Enable all notification types

### **Issue 4: "Local notification failed"**
**Solution:**
1. Check if the app is in foreground/background
2. Verify notification settings
3. Test with different notification types

## 📋 Debug Test Results

The debug test will show you:

```
📊 Test Results Summary:
✅ Project ID: Valid
✅ Device Capabilities: Physical Device
✅ Permissions: Granted
✅ Push Token: Generated
✅ Local Notification: Success
✅ Channels (Android): Success
```

## 🚀 Production Checklist

### **Before Building:**
- [ ] Project ID is correctly set in `app.json`
- [ ] EAS project is properly configured
- [ ] Push notification certificates are set up
- [ ] App permissions are configured

### **After Building:**
- [ ] Test on physical device
- [ ] Check console logs for debug results
- [ ] Verify push token generation
- [ ] Test local notifications
- [ ] Test server-sent notifications

## 🔧 Advanced Configuration

### **Environment Variables**
```bash
# Add to your environment
EXPO_PROJECT_ID=228cdfa0-b203-439c-bfe6-c6b682a56be3
```

### **App Configuration**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/appicon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "228cdfa0-b203-439c-bfe6-c6b682a56be3"
      }
    }
  }
}
```

## 📞 Server-Side Verification

### **Check Server Logs:**
```javascript
// Server should log when sending notifications
console.log('✅ Push notification sent successfully:', { title, body, data, sound });
```

### **Test Server Notification:**
```javascript
// Test from server
await pushNotificationService.sendMessageNotification(
  pushToken,
  'Test Sender',
  'Test message content',
  'test-chat-id'
);
```

## 🎯 Expected Behavior

### **In TestFlight:**
1. App starts and runs debug test
2. Push token is generated successfully
3. Token is sent to server
4. Notifications are received when app is in background
5. Local notifications work when app is in foreground

### **Console Output:**
```
🔍 Running notification debug test for production build...
✅ Project ID: 228cdfa0-b203-439c-bfe6-c6b682a56be3
✅ Device Capabilities: Physical Device
✅ Permissions: Granted
✅ Push Token: Generated
✅ Local Notification: Success
```

## 🚨 Common Issues & Solutions

### **Issue: Notifications not showing**
**Solution:** Check iOS notification settings and app permissions

### **Issue: Token not generating**
**Solution:** Verify project ID and internet connection

### **Issue: Server not receiving tokens**
**Solution:** Check API endpoint and network connectivity

### **Issue: Sound not playing**
**Solution:** Verify sound file is included in build

## 📞 Support

If issues persist:
1. Run the debug test and share results
2. Check console logs for specific error messages
3. Verify all configuration steps
4. Test with a fresh TestFlight build

## ✅ Success Indicators

- [ ] Debug test passes all checks
- [ ] Push token is generated and sent to server
- [ ] Local notifications work
- [ ] Server-sent notifications are received
- [ ] Notifications show with custom sound
- [ ] App navigation works when tapping notifications

---

**Last Updated:** Current Date
**Version:** 1.0.7
**Status:** ✅ Ready for TestFlight 
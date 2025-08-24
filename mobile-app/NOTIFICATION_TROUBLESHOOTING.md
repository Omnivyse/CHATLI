# 🔔 CHATLI Notification Troubleshooting Guide

This guide helps you fix notification issues that prevent notifications from working on other phones.

## 🚨 Common Issues & Solutions

### 1. **Push Token Not Being Generated**

**Symptoms:**
- No push token in console logs
- "No push token available" errors
- Notifications not appearing on any device

**Solutions:**
```javascript
// Check your app.json configuration
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "228cdfa0-b203-439c-bfe6-c6b682a56be3" // Must be correct
      }
    }
  }
}
```

**Debug Steps:**
1. Run the notification debug script: `runNotificationTests()`
2. Check console for project ID detection
3. Verify EAS build configuration
4. Ensure device has internet connection

### 2. **Push Token Not Being Sent to Server**

**Symptoms:**
- Push token generated but not stored on server
- Server shows "No push token" errors
- Notifications sent but not delivered

**Solutions:**
```javascript
// Check API endpoint mismatch
// Mobile app calls: PUT /auth/push-token
// Server expects: PUT /auth/push-token ✅ (Fixed)

// Verify token update in API service
await apiService.updatePushToken(token);
```

**Debug Steps:**
1. Check server logs for push token updates
2. Verify API endpoint is working
3. Check authentication is valid
4. Test token update manually

### 3. **Notification Filtering Issues**

**Symptoms:**
- Notifications received but immediately suppressed
- "Notification suppressed" in logs
- Only some notification types work

**Solutions:**
```javascript
// Fixed: Added recipientId to message notifications
await pushNotificationService.sendMessageNotification(
  participant.pushToken,
  req.user.name,
  messageText,
  chat._id.toString(),
  req.user._id.toString(),
  participantId.toString() // ✅ Added recipientId
);
```

**Debug Steps:**
1. Check notification filtering logs
2. Verify recipientId is included
3. Check current user ID tracking
4. Test with different notification types

### 4. **Sound File Issues**

**Symptoms:**
- Notifications appear but no sound
- "Sound file not found" errors
- Different behavior on different devices

**Solutions:**
```javascript
// Platform-specific sound handling
getSoundForType(type) {
  if (Platform.OS === 'ios') {
    return 'nottif.aiff'; // iOS format
  } else if (Platform.OS === 'android') {
    return 'nottif.mp3'; // Android format
  }
  return 'nottif.mp3'; // Default
}
```

**Debug Steps:**
1. Verify sound files exist in assets/sounds/
2. Check file formats (.aiff for iOS, .mp3 for Android)
3. Test on both platforms
4. Check device sound settings

### 5. **Android Notification Channels**

**Symptoms:**
- Notifications not appearing on Android
- No sound/vibration on Android
- Different behavior on different Android versions

**Solutions:**
```javascript
// Enhanced Android channel configuration
await Notifications.setNotificationChannelAsync('messages', {
  name: 'Messages',
  description: 'Chat and message notifications',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
  sound: 'nottif.mp3',
  enableVibrate: true,
  showBadge: true,
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
});
```

**Debug Steps:**
1. Check Android notification settings
2. Verify channels are created
3. Test channel importance levels
4. Check device-specific settings

### 6. **Permission Issues**

**Symptoms:**
- "Permission denied" errors
- Notifications not requested
- Settings show notifications disabled

**Solutions:**
```javascript
// Enhanced permission request
const { status } = await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
    allowAnnouncements: false,
    allowCriticalAlerts: false,
    provideAppNotificationSettings: true,
  },
  android: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
    allowAnnouncements: false,
  },
});
```

**Debug Steps:**
1. Check device notification settings
2. Verify app permissions
3. Test permission request flow
4. Check iOS/Android specific settings

## 🧪 Testing & Debugging

### Mobile App Testing

1. **Run Notification Debug Script:**
```javascript
// In your mobile app console
runNotificationTests()
```

2. **Check Console Logs:**
- Look for 🔔 emoji logs
- Check for push token generation
- Verify permission status
- Monitor notification filtering

3. **Test Local Notifications:**
```javascript
// Test if notifications work locally
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Test',
    body: 'Local notification test',
    sound: 'nottif.mp3'
  },
  trigger: null
});
```

### Server Testing

1. **Run Server Test Script:**
```bash
# Set your test push token
export TEST_PUSH_TOKEN="ExponentPushToken[your-token-here]"

# Run the test
node test-notification-server.js
```

2. **Check Server Logs:**
- Look for notification sending logs
- Verify push token updates
- Check Expo push service responses

3. **Test Database Tokens:**
```javascript
// Check if users have push tokens
const usersWithTokens = await User.find({ 
  pushToken: { $exists: true, $ne: null } 
});
console.log(`Users with tokens: ${usersWithTokens.length}`);
```

## 🔧 Step-by-Step Fix Process

### Step 1: Verify Mobile App Configuration

1. **Check app.json:**
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

2. **Verify sound files exist:**
```
mobile-app/assets/sounds/
├── nottif.mp3    # Android
└── nottif.aiff   # iOS
```

3. **Check package.json dependencies:**
```json
{
  "dependencies": {
    "expo-notifications": "~0.31.4"
  }
}
```

### Step 2: Test Mobile App Notifications

1. **Run debug script:**
```javascript
runNotificationTests()
```

2. **Check results:**
- ✅ Device compatible
- ✅ Project ID found
- ✅ Permissions granted
- ✅ Push token generated
- ✅ Listeners set up

3. **Fix any failures:**
- Update project ID if missing
- Request permissions if denied
- Check network connectivity
- Verify device compatibility

### Step 3: Test Server Notifications

1. **Get push token from mobile app:**
```javascript
// In mobile app console
const token = await AsyncStorage.getItem('pushToken');
console.log('Push token:', token);
```

2. **Set environment variable:**
```bash
export TEST_PUSH_TOKEN="ExponentPushToken[your-token-here]"
```

3. **Run server test:**
```bash
node test-notification-server.js
```

4. **Check results:**
- All notification types working
- Proper error handling
- Database integration working

### Step 4: Test End-to-End

1. **Send message from one device to another**
2. **Check if notification appears**
3. **Verify sound and vibration**
4. **Test different notification types**

## 🚨 Emergency Fixes

### If Nothing Works:

1. **Clear all data and restart:**
```javascript
// In mobile app
await AsyncStorage.clear();
// Restart app
```

2. **Rebuild and reinstall:**
```bash
# Clear build cache
expo r -c

# Rebuild
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

3. **Check Expo status:**
- Visit [Expo Status Page](https://status.expo.dev/)
- Check for service outages
- Verify project configuration

### If Still Not Working:

1. **Check network connectivity**
2. **Verify firewall settings**
3. **Test with different devices**
4. **Contact Expo support**

## 📱 Device-Specific Issues

### iOS Issues

1. **TestFlight builds:**
- Ensure proper provisioning
- Check push notification capability
- Verify bundle identifier

2. **Sound files:**
- Use .aiff format
- Check file size limits
- Verify asset bundle inclusion

### Android Issues

1. **Notification channels:**
- Create proper channels
- Set correct importance levels
- Handle Android version differences

2. **Background restrictions:**
- Check battery optimization
- Verify background app refresh
- Test with different Android versions

## 🔍 Monitoring & Logs

### Key Log Patterns

1. **Successful notification:**
```
✅ Push notification sent successfully
✅ Push token updated on server
✅ Notification received via listener
```

2. **Failed notification:**
```
❌ Push notification failed
❌ Error sending push notification
❌ Notification suppressed
```

3. **Debug information:**
```
🔍 Project ID for push token
🔔 Notification filtering check
📱 Device capabilities test
```

### Log Analysis

1. **Check for errors:**
- Look for ❌ symbols
- Identify error patterns
- Check error codes

2. **Verify success:**
- Look for ✅ symbols
- Confirm token generation
- Verify server communication

3. **Monitor performance:**
- Check response times
- Monitor success rates
- Track delivery statistics

## 📞 Getting Help

### Before Asking for Help:

1. ✅ Run the debug scripts
2. ✅ Check all logs
3. ✅ Verify configuration
4. ✅ Test on different devices
5. ✅ Check network connectivity

### When Asking for Help:

1. **Include debug output:**
```
🔔 Notification Debug Results:
- Device: iPhone 12, iOS 15.0
- Project ID: 228cdfa0-b203-439c-bfe6-c6b682a56be3
- Permissions: granted
- Push Token: ExponentPushToken[...]
- Errors: [list any errors]
```

2. **Describe the issue:**
- What should happen
- What actually happens
- When it started
- What you've tried

3. **Provide context:**
- Device type and OS version
- App version
- Server environment
- Recent changes

## 🎯 Success Checklist

- [ ] Push token generated successfully
- [ ] Token sent to server
- [ ] Server stores token in database
- [ ] Notifications sent from server
- [ ] Mobile app receives notifications
- [ ] Sound and vibration work
- [ ] Different notification types work
- [ ] Works on multiple devices
- [ ] Works after app restart
- [ ] Works with different users

## 🚀 Next Steps

After fixing notifications:

1. **Monitor performance**
2. **Test edge cases**
3. **Optimize delivery**
4. **Add analytics**
5. **Implement A/B testing**

---

**Remember:** Notifications are complex and involve multiple systems working together. Use the debug scripts to isolate issues and fix them systematically.

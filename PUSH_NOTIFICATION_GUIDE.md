# Push Notification Implementation Guide

## Overview
This guide covers the implementation of push notifications for the CHATLI mobile app, enabling iPhone notifications for chat messages, likes, comments, and follows.

## Features Implemented

### 1. Mobile App Push Notifications
- **Chat Messages**: Receive notifications when someone sends you a message
- **Likes**: Get notified when someone likes your post
- **Comments**: Receive notifications for comments on your posts
- **Follows**: Get notified when someone follows you

### 2. Technical Implementation

#### Mobile App (React Native + Expo)

**Files Modified:**
- `mobile-app/src/services/pushNotificationService.js` (New)
- `mobile-app/App.js`

**Key Features:**
- Automatic permission requests
- Token generation and management
- Notification handling in foreground/background
- Navigation handling when tapping notifications
- Local notification testing

**Push Notification Service Methods:**
```javascript
// Initialize push notifications
await pushNotificationService.initialize()

// Get push token
const token = pushNotificationService.getPushToken()

// Send local notification (for testing)
await pushNotificationService.sendLocalNotification(title, body, data)

// Clean up listeners
pushNotificationService.cleanup()
```

#### Backend (Node.js + Express)

**Files Modified:**
- `server/models/User.js` - Added `pushToken` field
- `server/services/pushNotificationService.js` (New)
- `server/routes/auth.js` - Added push token update route
- `server/routes/posts.js` - Added push notifications for likes/comments
- `server/routes/chats.js` - Added push notifications for messages
- `server/routes/auth.js` - Added push notifications for follows
- `server/package.json` - Added axios dependency

**Backend Push Notification Service Methods:**
```javascript
// Send single notification
await pushNotificationService.sendPushNotification(token, title, body, data)

// Send chat notification
await pushNotificationService.sendChatNotification(token, senderName, message, chatId)

// Send like notification
await pushNotificationService.sendLikeNotification(token, likerName, postId, postContent)

// Send comment notification
await pushNotificationService.sendCommentNotification(token, commenterName, postId, comment, postContent)

// Send follow notification
await pushNotificationService.sendFollowNotification(token, followerName, followerId)
```

## Setup Instructions

### 1. Install Dependencies

**Server:**
```bash
cd server
npm install axios
```

**Mobile App:**
```bash
cd mobile-app
# expo-notifications is already installed
```

### 2. Environment Configuration

**Mobile App:**
- Ensure you have an Expo account
- Configure your project with EAS (Expo Application Services)
- Set up your project ID in `app.json` or `app.config.js`

**Server:**
- No additional environment variables needed
- Uses Expo's push notification service

### 3. Testing Push Notifications

#### On Physical Device (Required)
Push notifications only work on physical devices, not simulators.

#### Test Local Notifications
```javascript
// In your mobile app
await pushNotificationService.sendLocalNotification(
  'Test Notification',
  'This is a test message',
  { type: 'test', data: 'test-value' }
);
```

#### Test Server Notifications
1. Login to the mobile app
2. Check console for push token
3. Use the token to send test notifications from server

## Notification Types

### 1. Chat Messages
- **Title**: 💬 [Sender Name]
- **Body**: Message content (truncated if > 50 chars)
- **Data**: `{ type: 'chat', chatId, senderName, message }`

### 2. Likes
- **Title**: ❤️ [Liker Name]
- **Body**: "Таны постыг лайк дарлаа"
- **Data**: `{ type: 'like', postId, likerName, postContent }`

### 3. Comments
- **Title**: 💭 [Commenter Name]
- **Body**: Comment content (truncated if > 50 chars)
- **Data**: `{ type: 'comment', postId, commenterName, comment, postContent }`

### 4. Follows
- **Title**: 👤 [Follower Name]
- **Body**: "Таныг дагаж эхэллээ"
- **Data**: `{ type: 'follow', userId, followerName }`

## Navigation Handling

When users tap on notifications, the app can navigate to the appropriate screen:

```javascript
// In pushNotificationService.js
handleNotificationNavigation(data) {
  switch (data.type) {
    case 'chat':
      // Navigate to chat screen
      break;
    case 'like':
    case 'comment':
      // Navigate to post
      break;
    case 'follow':
      // Navigate to user profile
      break;
  }
}
```

## Error Handling

### Common Issues

1. **Permission Denied**
   - User must grant notification permissions
   - Check permission status with `getNotificationSettings()`

2. **Invalid Push Token**
   - Tokens can expire or become invalid
   - Service includes token validation

3. **Network Issues**
   - Push notifications require internet connection
   - Failed notifications are logged but don't break the app

### Debugging

**Mobile App:**
```javascript
// Check notification settings
const settings = await pushNotificationService.getNotificationSettings();
console.log('Notification settings:', settings);

// Check push token
const token = pushNotificationService.getPushToken();
console.log('Push token:', token);
```

**Server:**
```javascript
// Check if push token is valid
const isValid = pushNotificationService.validatePushToken(token);

// Clean up invalid tokens
const validTokens = await pushNotificationService.cleanupInvalidTokens(tokens);
```

## Security Considerations

1. **Token Storage**: Push tokens are stored securely in the database
2. **User Consent**: Permissions are requested explicitly
3. **Data Privacy**: Only necessary data is included in notifications
4. **Rate Limiting**: Consider implementing rate limits for notification sending

## Performance Optimization

1. **Batch Notifications**: Use `sendPushNotificationToMultiple()` for multiple recipients
2. **Token Cleanup**: Regularly clean up invalid tokens
3. **Error Handling**: Don't let notification failures break main functionality
4. **Async Processing**: Send notifications asynchronously to avoid blocking

## Future Enhancements

1. **Notification Preferences**: Allow users to customize notification types
2. **Rich Notifications**: Add images and actions to notifications
3. **Notification History**: Store notification history in the app
4. **Silent Notifications**: Use silent notifications for data sync
5. **Notification Groups**: Group related notifications together

## Troubleshooting

### Push Token Issues
- Ensure you're testing on a physical device
- Check that Expo project is properly configured
- Verify internet connectivity

### Notification Not Received
- Check device notification settings
- Verify push token is valid and stored in database
- Check server logs for notification sending errors

### App Crashes
- Ensure all dependencies are properly installed
- Check for proper error handling in notification listeners
- Verify notification permissions are granted

## Support

For issues related to:
- **Expo Push Notifications**: Check [Expo Documentation](https://docs.expo.dev/push-notifications/overview/)
- **iOS Notifications**: Check [Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications)
- **Android Notifications**: Check [Android Developer Documentation](https://developer.android.com/guide/topics/ui/notifiers/notifications) 
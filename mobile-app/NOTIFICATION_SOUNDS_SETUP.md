# 🎵 Custom Notification Sounds Setup

## 📁 Where to Upload Notification Sounds

### **Directory Structure:**
```
mobile-app/assets/sounds/
├── message_notification.aiff    # iOS message sound
├── message_notification.mp3     # Android message sound
├── like_notification.aiff       # iOS like sound
├── like_notification.mp3        # Android like sound
├── comment_notification.aiff    # iOS comment sound
├── comment_notification.mp3     # Android comment sound
├── follow_notification.aiff     # iOS follow sound
├── follow_notification.mp3      # Android follow sound
├── general_notification.aiff    # iOS general sound
└── general_notification.mp3     # Android general sound
```

## 📋 File Requirements

### **iOS (.aiff files)**
- **Format**: `.aiff`, `.wav`, `.caf`
- **Duration**: 30 seconds maximum
- **Size**: Keep under 5MB
- **Quality**: High quality, clear sound
- **Recommended**: `.aiff` format

### **Android (.mp3 files)**
- **Format**: `.mp3`, `.wav`, `.ogg`
- **Duration**: 30 seconds maximum
- **Size**: Keep under 5MB
- **Quality**: High quality, clear sound
- **Recommended**: `.mp3` format

## 🎯 Recommended Sound Types

### **1. Message Notifications**
- **Purpose**: New chat messages
- **Sound**: Short, attention-grabbing
- **Duration**: 1-2 seconds
- **Example**: `message_notification.aiff` / `message_notification.mp3`

### **2. Like Notifications**
- **Purpose**: Post likes
- **Sound**: Gentle, positive
- **Duration**: 1-2 seconds
- **Example**: `like_notification.aiff` / `like_notification.mp3`

### **3. Comment Notifications**
- **Purpose**: Post comments
- **Sound**: Distinctive, engaging
- **Duration**: 1-2 seconds
- **Example**: `comment_notification.aiff` / `comment_notification.mp3`

### **4. Follow Notifications**
- **Purpose**: New followers
- **Sound**: Welcoming, friendly
- **Duration**: 1-2 seconds
- **Example**: `follow_notification.aiff` / `follow_notification.mp3`

### **5. General Notifications**
- **Purpose**: App updates, events, etc.
- **Sound**: Neutral, professional
- **Duration**: 1-2 seconds
- **Example**: `general_notification.aiff` / `general_notification.mp3`

## 🔧 Implementation Status

### ✅ **Completed:**
- ✅ Updated `pushNotificationService.js` (mobile)
- ✅ Updated server-side notification service
- ✅ Added Android notification channels
- ✅ Configured sound mapping
- ✅ Updated asset bundle patterns

### 📋 **Next Steps:**
1. **Upload Sound Files**: Add your sound files to `mobile-app/assets/sounds/`
2. **Test Notifications**: Test each notification type
3. **Build & Deploy**: Deploy with new sounds

## 🚀 How to Add Your Sounds

### **Step 1: Prepare Sound Files**
1. Create/obtain your notification sounds
2. Convert to required formats:
   - iOS: `.aiff` format
   - Android: `.mp3` format
3. Keep files under 5MB each
4. Use descriptive filenames

### **Step 2: Upload to Project**
```bash
# Navigate to sounds directory
cd mobile-app/assets/sounds/

# Upload your sound files here
# Example:
# message_notification.aiff
# message_notification.mp3
# like_notification.aiff
# like_notification.mp3
# etc.
```

### **Step 3: Test the Sounds**
```bash
# Build and test on device
eas build --platform ios --profile development
eas build --platform android --profile development
```

## 📱 Notification Types & Sounds

### **Message Notifications**
```javascript
// When someone sends a message
await pushNotificationService.sendMessageNotification(
  pushToken,
  senderName,
  messageContent,
  chatId
);
// Uses: message_notification.aiff/mp3
```

### **Like Notifications**
```javascript
// When someone likes a post
await pushNotificationService.sendLikeNotification(
  pushToken,
  likerName,
  postId,
  postContent
);
// Uses: like_notification.aiff/mp3
```

### **Comment Notifications**
```javascript
// When someone comments on a post
await pushNotificationService.sendCommentNotification(
  pushToken,
  commenterName,
  postId,
  commentContent,
  postContent
);
// Uses: comment_notification.aiff/mp3
```

### **Follow Notifications**
```javascript
// When someone follows you
await pushNotificationService.sendFollowNotification(
  pushToken,
  followerName,
  followerId
);
// Uses: follow_notification.aiff/mp3
```

## 🛠️ Troubleshooting

### **If Sounds Don't Play:**
1. **Check File Names**: Ensure exact naming convention
2. **Verify Formats**: Use correct formats for each platform
3. **File Size**: Keep under 5MB
4. **Build Cache**: Clear build cache and rebuild
5. **Device Test**: Test on physical device (not simulator)

### **Common Issues:**
- ❌ Wrong file format
- ❌ File too large
- ❌ Wrong filename
- ❌ Missing files in bundle
- ❌ Testing on simulator (sounds don't work)

## 📋 Checklist

- [ ] Sound files prepared in correct formats
- [ ] Files uploaded to `mobile-app/assets/sounds/`
- [ ] File names match expected convention
- [ ] Files are under 5MB each
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] All notification types working
- [ ] Sounds playing correctly

## 🎉 Expected Result

After uploading your sound files and deploying:
- ✅ Different notification types will have different sounds
- ✅ Messages will play `message_notification` sound
- ✅ Likes will play `like_notification` sound
- ✅ Comments will play `comment_notification` sound
- ✅ Follows will play `follow_notification` sound
- ✅ General notifications will play `general_notification` sound

---

**Note**: Make sure to test on physical devices as notification sounds don't work in simulators. 
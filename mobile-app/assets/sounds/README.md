# 🎵 Notification Sounds Guide

## 📁 Where to Upload Notification Sounds

Place your notification sound files in this directory:
```
mobile-app/assets/sounds/
```

## 📋 Supported Formats

### iOS
- **Format**: `.aiff`, `.wav`, `.caf`
- **Duration**: 30 seconds maximum
- **Size**: Keep under 5MB
- **Recommended**: `.aiff` format

### Android
- **Format**: `.mp3`, `.wav`, `.ogg`
- **Duration**: 30 seconds maximum
- **Size**: Keep under 5MB
- **Recommended**: `.mp3` format

## 🎯 Recommended Sound Files

### For Messages
- `message_notification.aiff` - New message sound
- `message_notification.mp3` - Android version

### For Likes/Comments
- `like_notification.aiff` - Like sound
- `comment_notification.aiff` - Comment sound

### For Follow Requests
- `follow_notification.aiff` - Follow request sound

### For General Notifications
- `general_notification.aiff` - General app notifications

## 📝 File Naming Convention

Use descriptive names:
- `message_sound.aiff`
- `like_sound.aiff`
- `comment_sound.aiff`
- `follow_sound.aiff`
- `notification_sound.aiff`

## 🔧 How to Use

1. Upload your sound files to this directory
2. Update the notification configuration in `pushNotificationService.js`
3. Reference the sounds in your notification calls

## 💡 Tips

- Keep sounds short (1-3 seconds)
- Use high-quality audio files
- Test on both iOS and Android
- Consider user preferences for sound types 
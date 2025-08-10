# TestFlight Update Introduction System

## Overview

The TestFlight update introduction system automatically displays a welcome screen when users install or update the app through TestFlight. This provides users with information about new features, improvements, and what to expect in the latest version.

## How It Works

### 1. TestFlight Detection

The system automatically detects when the app is running in a TestFlight environment:

```javascript
// In AppUpdateService.js
detectTestFlight() {
  if (Platform.OS !== 'ios') return false;
  
  // TestFlight builds have specific characteristics
  const isTestFlightBuild = !__DEV__ && Platform.OS === 'ios';
  
  return isTestFlightBuild;
}
```

### 2. Update Introduction Logic

When a TestFlight build is detected:

- The system checks if the update introduction has already been shown for the current version
- If not shown, it creates a special update info object with `isTestFlight: true`
- The introduction screen is displayed automatically
- The system marks this version as "shown" to prevent repeated displays

### 3. Introduction Screen Display

The `AppUpdateScreen` component automatically adapts its content for TestFlight:

- **Title**: Changes from "Update Available" to "Welcome to CHATLI!"
- **Subtitle**: Shows a welcome message instead of update requirements
- **Button**: Changes from "Update Now" to "Get Started"
- **Icon**: Changes from update arrow to checkmark
- **Skip Button**: Hidden for TestFlight introductions

## Configuration

### Version Information

Update the version information in `app.json`:

```json
{
  "expo": {
    "name": "CHATLI",
    "slug": "chatli-mobile",
    "version": "1.1.4",
    "ios": {
      "buildNumber": "16"
    },
    "android": {
      "versionCode": 9
    }
  }
}
```

### App Store URL

Update the App Store URL in `AppUpdateService.js`:

```javascript
this.appStoreUrl = 'https://apps.apple.com/app/chatli/id6749570514';
```

## Customization

### Update Description

Modify the TestFlight update description in `AppUpdateService.js`:

```javascript
const testFlightUpdateInfo = {
  // ... other properties
  updateDescription: 'Your custom welcome message here...',
  // ... other properties
};
```

### Translations

Add custom translations in `translations.js`:

```javascript
// Mongolian
welcomeToUpdate: 'CHATLI-д тавтай морил!',
testFlightWelcomeMessage: 'Your custom message in Mongolian',
getStarted: 'Эхлэх',

// English
welcomeToUpdate: 'Welcome to CHATLI!',
testFlightWelcomeMessage: 'Your custom message in English',
getStarted: 'Get Started',
```

## Testing

### Development Testing

To test the system in development:

1. Set `__DEV__ = false` in your test environment
2. Use the test script: `node test-app-update.js`

### TestFlight Testing

1. Build and upload a new version to TestFlight
2. Install the app through TestFlight
3. The introduction screen should appear automatically
4. Check the console logs for debugging information

## Debugging

### Console Logs

The system provides extensive logging:

```
🔍 AppUpdateService initialized: {
  currentVersion: '1.1.4',
  buildNumber: Platform.OS === 'ios' ? '16' : '9',
  platform: 'ios',
  isTestFlight: true,
  isDevelopment: false
}

🔍 TestFlight build detected, using TestFlight update logic
🔍 TestFlight update info created: { ... }
🔍 Final update info: { ... }
```

### Common Issues

1. **Introduction not showing**: Check if the version has already been marked as shown
2. **Wrong content**: Verify translations and update description
3. **Not detecting TestFlight**: Ensure `__DEV__` is false and platform is iOS

### Reset for Testing

To reset the update state for testing:

```javascript
await AppUpdateService.clearUpdateData();
```

## File Structure

```
mobile-app/
├── src/
│   ├── services/
│   │   └── AppUpdateService.js      # Core update logic
│   ├── screens/
│   │   └── AppUpdateScreen.js       # Update/introduction UI
│   └── utils/
│       └── translations.js          # Multilingual support
├── App.js                           # Main app with update check
├── test-app-update.js              # Testing script
└── TESTFLIGHT_UPDATE_GUIDE.md      # This guide
```

## Future Enhancements

- **Remote Configuration**: Fetch update descriptions from backend
- **A/B Testing**: Different introduction content for different user groups
- **Analytics**: Track user engagement with introduction screens
- **Custom Content**: Rich media content (images, videos) in introductions

## Support

For issues or questions about the TestFlight update introduction system:

1. Check the console logs for error messages
2. Verify the configuration in `app.json` and `AppUpdateService.js`
3. Test with the provided test script
4. Review this guide for common solutions 
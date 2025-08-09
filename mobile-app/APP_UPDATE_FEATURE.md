# CHATLI App Update Feature

## Overview

The CHATLI mobile app now includes a comprehensive in-app update system that allows users to be notified when new versions are available and provides a seamless update experience by redirecting them to the App Store or Play Store.

## Features

### 1. Automatic Update Detection
- Checks for updates on app startup
- Compares current version with latest available version
- Supports both iOS and Android platforms

### 2. Update Types
- **Force Updates**: Critical updates that must be installed (e.g., security patches)
- **Recommended Updates**: Optional updates with new features and improvements

### 3. User Experience
- Beautiful update screen with version information
- Update description and benefits
- Skip option for recommended updates
- Direct link to App Store/Play Store

### 4. Multi-language Support
- Full support for Mongolian and English
- Localized update messages and descriptions

## Implementation Details

### Client-Side Components

#### 1. AppUpdateScreen (`src/screens/AppUpdateScreen.js`)
- Main UI component for displaying update information
- Shows current and latest version
- Displays update description and benefits
- Handles update and skip actions
- Uses theme system for consistent styling

#### 2. AppUpdateService (`src/services/appUpdateService.js`)
- Manages all update-related logic
- Version comparison functionality
- API communication with server
- Local storage for user preferences
- Skip version tracking

#### 3. App.js Integration
- Update check on app startup
- Conditional rendering of update screen
- Integration with existing app flow

### Server-Side API

#### 1. App Routes (`server/routes/app.js`)
- `GET /api/app/version` - Get latest version information
- `PUT /api/app/version` - Update version info (admin)
- `GET /api/app/status` - App status check

#### 2. Version Management
- Platform-specific version information
- Force update version tracking
- Update descriptions and store URLs

## Configuration

### 1. App Store URLs
Update the following URLs in `src/services/appUpdateService.js`:
```javascript
this.appStoreUrl = 'https://apps.apple.com/app/chatli/id1234567890'; // Replace with your App Store ID
this.playStoreUrl = 'https://play.google.com/store/apps/details?id=com.chatli.mobile';
```

### 2. Server Version Configuration
Update version information in `server/routes/app.js`:
```javascript
const appVersions = {
  ios: {
    latestVersion: '1.1.0',
    minimumVersion: '1.0.0',
    forceUpdateVersion: '1.0.0',
    updateDescription: 'Update description...',
    isForceUpdate: false,
    appStoreUrl: 'your-app-store-url'
  },
  android: {
    // Similar configuration for Android
  }
};
```

## Usage Scenarios

### 1. Force Update
When a critical security update is required:
1. Set `isForceUpdate: true` in server configuration
2. Set `forceUpdateVersion` to the minimum required version
3. Users cannot skip the update and must update to continue

### 2. Recommended Update
When new features are available:
1. Set `isForceUpdate: false` in server configuration
2. Users can skip the update and continue using the app
3. Update will be shown again on next app launch

### 3. No Update Required
When user has the latest version:
1. Update screen is not shown
2. App continues normally

## Testing

### 1. Development Testing
In development mode, the app uses mock data:
```javascript
const updateInfo = __DEV__ 
  ? appUpdateService.getMockUpdateInfo()
  : await appUpdateService.getUpdateInfo();
```

### 2. Production Testing
1. Deploy server with new version information
2. Update mobile app version in `package.json` and `app.json`
3. Test with older app version to trigger update flow

## Translation Keys

The following translation keys are available for the update feature:

### Mongolian (mn)
- `updateAvailable`: 'Шинэчлэлт боломжтой'
- `updateRequiredMessage`: 'Update required message'
- `currentVersion`: 'Одоогийн хувилбар'
- `latestVersion`: 'Хамгийн сүүлийн хувилбар'
- `whatsNew`: 'Шинэ зүйлс'
- `updateNow`: 'Одоо шинэчлэх'
- `skipForNow`: 'Одоохондоо алгасах'
- `updateBenefits`: 'Шинэчлэлтийн давуу талууд'
- `bugFixes`: 'Алдаа засварууд'
- `performanceImprovements`: 'Гүйцэтгэл сайжруулалт'
- `newFeatures`: 'Шинэ функцууд'
- `securityUpdates`: 'Аюулгүй байдлын шинэчлэлтүүд'

### English (en)
- `updateAvailable`: 'Update Available'
- `updateRequiredMessage`: 'Update required message'
- `currentVersion`: 'Current Version'
- `latestVersion`: 'Latest Version'
- `whatsNew`: 'What\'s New'
- `updateNow`: 'Update Now'
- `skipForNow`: 'Skip for Now'
- `updateBenefits`: 'Update Benefits'
- `bugFixes`: 'Bug Fixes'
- `performanceImprovements`: 'Performance Improvements'
- `newFeatures`: 'New Features'
- `securityUpdates`: 'Security Updates'

## Benefits

### 1. User Experience
- Seamless update process
- Clear information about updates
- No interruption to app usage for optional updates

### 2. Security
- Force critical security updates
- Ensure users have latest security patches

### 3. Feature Adoption
- Encourage users to try new features
- Improve app engagement

### 4. Maintenance
- Reduce support requests for outdated versions
- Better bug tracking and resolution

## Future Enhancements

### 1. In-App Updates
- Implement Expo Updates for over-the-air updates
- Reduce dependency on app stores

### 2. Update Analytics
- Track update adoption rates
- Monitor user behavior around updates

### 3. Progressive Updates
- Show update progress
- Background download capabilities

### 4. Custom Update Schedules
- Allow users to set update preferences
- Scheduled update reminders

## Troubleshooting

### 1. Update Not Showing
- Check server version configuration
- Verify API endpoint is accessible
- Check network connectivity

### 2. Store Link Issues
- Verify App Store/Play Store URLs
- Test store links manually
- Check app store listing status

### 3. Version Comparison Issues
- Ensure version format is correct (x.y.z)
- Check version comparison logic
- Verify current app version

## Version History

- **v1.1.0**: Initial implementation of app update feature
  - Basic update detection and UI
  - Server-side version management
  - Multi-language support
  - Force and recommended update types

## Files Modified

### New Files
- `src/screens/AppUpdateScreen.js` - Update screen UI
- `src/services/appUpdateService.js` - Update service logic
- `server/routes/app.js` - Server-side API routes

### Modified Files
- `App.js` - Integration of update check and screen
- `src/utils/translations.js` - Added update-related translations
- `server/server.js` - Registered app routes

### Configuration Files
- `package.json` - Updated version to 1.1.0
- `app.json` - Updated version and build numbers 
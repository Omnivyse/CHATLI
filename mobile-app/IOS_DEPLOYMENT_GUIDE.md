# iOS App Deployment Guide for TestFlight

## Prerequisites

1. **Apple Developer Account** ✅ (Approved)
2. **Xcode** (Latest version)
3. **EAS CLI** installed
4. **Expo Account** (free)

## Step 1: Install EAS CLI

```bash
npm install -g @expo/eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

## Step 3: Configure Your Project

### Update app.json
- ✅ Already updated with proper iOS configurations
- ✅ Bundle identifier: `com.chatli.mobile`
- ✅ Version: `1.0.0`
- ✅ Build number: `1`

### Update eas.json
Replace the placeholder values in `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-apple-id@email.com",
        "ascAppId": "your-actual-app-store-connect-app-id",
        "appleTeamId": "your-actual-apple-team-id"
      }
    }
  }
}
```

## Step 4: Create App Store Connect App

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platforms**: iOS
   - **Name**: CHATLI
   - **Bundle ID**: com.chatli.mobile
   - **SKU**: chatli-mobile-ios
   - **User Access**: Full Access
4. Click "Create"
5. Note down the **App ID** (you'll need this for eas.json)

## Step 5: Get Your Apple Team ID

1. In App Store Connect, go to "Users and Access"
2. Click on your name
3. Note down the **Team ID** (you'll need this for eas.json)

## Step 6: Build for iOS

### First, configure the project:
```bash
cd mobile-app
eas build:configure
```

### Build for iOS:
```bash
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud
- Create an `.ipa` file
- Take about 10-15 minutes

## Step 7: Submit to TestFlight

### Option A: Using EAS Submit (Recommended)
```bash
eas submit --platform ios --profile production
```

### Option B: Manual Upload
1. Download the `.ipa` file from the build
2. Open Xcode
3. Go to Window → Organizer
4. Click "Distribute App"
5. Select "App Store Connect"
6. Upload the `.ipa` file

## Step 8: Configure TestFlight

1. Go to App Store Connect
2. Select your CHATLI app
3. Go to "TestFlight" tab
4. Wait for Apple's processing (usually 1-2 hours)
5. Add test information:
   - **What to Test**: Basic functionality, login, posting, chat
   - **Feedback Email**: your-email@domain.com
   - **Description**: "CHATLI - Social media app with real-time chat"

## Step 9: Add Testers

### Internal Testers (Up to 100 people)
1. In TestFlight, go to "Internal Testing"
2. Click "Add Testers"
3. Add email addresses of your team members

### External Testers (Up to 10,000 people)
1. In TestFlight, go to "External Testing"
2. Click "Create a New Group"
3. Name it "Beta Testers"
4. Add testers by email
5. Submit for Apple review (takes 1-2 days)

## Step 10: Test the App

1. Testers will receive an email invitation
2. They need to install TestFlight app
3. Accept the invitation in TestFlight
4. Download and test CHATLI

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that all dependencies are properly installed
   - Ensure app.json is valid
   - Check EAS build logs

2. **Upload Fails**
   - Verify Apple ID and Team ID in eas.json
   - Ensure app is properly signed
   - Check bundle identifier matches

3. **TestFlight Processing Fails**
   - Check app metadata
   - Ensure all required screenshots are provided
   - Verify app doesn't crash on launch

### Useful Commands:

```bash
# Check build status
eas build:list

# View build logs
eas build:view

# Update app version
# Edit app.json version and buildNumber, then:
eas build --platform ios --profile production

# Submit to App Store (when ready)
eas submit --platform ios --profile production
```

## Next Steps

1. **Test thoroughly** with internal testers
2. **Fix any issues** found during testing
3. **Submit for external testing** when ready
4. **Prepare for App Store submission** with screenshots and metadata

## Important Notes

- **Version Management**: Always increment `version` and `buildNumber` in app.json for new builds
- **Bundle ID**: Cannot be changed after first submission
- **TestFlight Expiry**: External builds expire after 90 days
- **App Store Review**: Required for external testing and App Store release

## Support

- [EAS Documentation](https://docs.expo.dev/eas/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Guide](https://developer.apple.com/testflight/) 
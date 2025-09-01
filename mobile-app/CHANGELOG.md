# CHATLI Mobile App Changelog

## [1.7.0] - 2025-01-27

### 🚀 New Features
- **Persistent Authentication**: Users now stay logged in after closing and reopening the app
- **Enhanced Token Management**: Improved JWT token storage and refresh mechanisms
- **Automatic Token Refresh**: Seamless token renewal to maintain user sessions
- **Robust Authentication Flow**: Better error handling and recovery for authentication issues

### 🔧 Improvements
- **API Service Initialization**: Proper async initialization to ensure tokens are loaded before authentication checks
- **Token Validation**: Proactive token validation and automatic refresh when tokens are close to expiring
- **Authentication Status Checking**: New `getAuthStatus()` method for reliable authentication state verification
- **Enhanced Error Handling**: Better handling of network issues and authentication failures
- **Comprehensive Logging**: Detailed console logs for debugging authentication issues

### 🐛 Bug Fixes
- **Authentication Persistence**: Fixed issue where users were required to login again after app restart
- **Token Storage**: Resolved token initialization timing issues that prevented proper authentication
- **Token Refresh**: Fixed automatic token refresh mechanism for expired tokens
- **Session Management**: Improved cleanup of authentication data on logout and errors

### 🔒 Security Improvements
- **Token Security**: Enhanced token validation and secure storage practices
- **Authentication Flow**: Improved security of the authentication process with better error handling
- **Session Security**: Better session management and cleanup procedures

### 📱 Technical Improvements
- **App Version**: Updated to version 1.7.0 with build numbers 23 (iOS) and 15 (Android)
- **API Service**: Enhanced API service with better token management and authentication methods
- **Error Recovery**: Improved error recovery mechanisms for authentication failures
- **Debugging Tools**: Added global test functions for debugging authentication state

### 🧪 Testing & Debugging
- **Authentication Testing**: Added `testAuthState()` global function for debugging authentication
- **Token Validation**: Enhanced token validation testing and error reporting
- **Console Logging**: Comprehensive logging throughout the authentication process
- **Debug Functions**: Global debugging functions available in development mode

### 📋 Breaking Changes
- **Version Update**: App version updated from 1.6.0 to 1.7.0
- **Build Numbers**: iOS build number increased to 23, Android version code to 15

### 🔄 Migration Notes
- Existing users will benefit from persistent authentication immediately
- No user action required - authentication persistence works automatically
- Improved user experience with seamless app restarts

---

## [1.6.0] - 2025-01-27

### 🚀 New Features
- **App Update System**: Complete overhaul of the app update recommendation system
- **Version Management**: Improved version checking and update detection for both App Store and TestFlight builds
- **Update Screen**: Enhanced update screen with proper store integration and TestFlight support

### 🔧 Improvements
- **Version Comparison**: Enhanced version comparison logic with better debugging and logging
- **Server Integration**: Improved server-side version checking and update recommendations
- **TestFlight Support**: Better handling of TestFlight builds with appropriate update logic
- **Store Integration**: Proper integration with App Store and Google Play Store for updates

### 🐛 Bug Fixes
- **Update Recommendations**: Fixed issue where app updates were not being properly recommended
- **Version Mismatch**: Corrected server and client version synchronization
- **Update Screen**: Fixed update screen not displaying when updates are available
- **Store Links**: Ensured proper store URLs are passed to update screen

### 🔒 Security Improvements
- **Version Validation**: Enhanced version validation and comparison logic
- **Update Security**: Improved update checking with proper error handling

### 📱 Technical Improvements
- **App Version**: Updated to version 1.5.0 with build numbers 22 (iOS) and 14 (Android)
- **Version Service**: Completely refactored app update service for better reliability
- **Error Handling**: Improved error handling throughout the update system
- **Logging**: Enhanced logging for better debugging of update issues

### 🧪 Testing & Debugging
- **Update Testing**: Added global test functions for debugging update logic
- **Version Testing**: Enhanced version comparison testing and validation
- **Console Logging**: Comprehensive logging throughout the update process

### 📋 Breaking Changes
- **Version Update**: App version updated from 1.4.1 to 1.5.0
- **Build Numbers**: iOS build number increased to 22, Android version code to 14

### 🔄 Migration Notes
- Existing users will see the new update system in action
- The app will now properly recommend updates when new versions are available
- TestFlight users will see appropriate update introductions

---

## [1.4.0] - 2025-08-20

### 🚀 New Features
- **Enhanced Registration System**: Complete overhaul of user registration with improved validation
- **Password Strength Indicator**: Visual password strength meter with real-time feedback
- **Network Connectivity Testing**: Built-in connection testing before registration attempts
- **Improved Error Handling**: Better error messages and validation feedback

### 🔧 Improvements
- **Form Validation**: Enhanced client-side validation matching backend requirements
- **Password Requirements**: Updated to match backend security standards (12+ chars, uppercase, lowercase, numbers, special chars)
- **Username Validation**: Added format validation (3-20 chars, alphanumeric + underscore only)
- **API Service**: Improved error handling and network request management
- **User Experience**: Added helper text and improved form feedback

### 🐛 Bug Fixes
- **Registration Issues**: Fixed mobile app registration that was failing due to validation mismatches
- **Password Validation**: Corrected password requirements to match backend expectations
- **Error Display**: Fixed backend validation errors not being properly displayed
- **Network Issues**: Added better detection and handling of connectivity problems

### 🔒 Security Improvements
- **Input Validation**: Enhanced client-side validation to prevent invalid data submission
- **Password Security**: Enforced strong password requirements
- **API Security**: Improved error handling for security-related responses

### 📱 Technical Improvements
- **React Native**: Updated to React Native 0.79.5
- **Expo SDK**: Updated to Expo SDK 53
- **Dependencies**: Updated all dependencies to latest stable versions
- **Code Quality**: Improved error handling and logging throughout the app

### 🧪 Testing & Debugging
- **Network Testing**: Added "Test Connection" button for debugging connectivity issues
- **Console Logging**: Enhanced logging for better debugging experience
- **Error Tracking**: Improved error reporting and user feedback

### 📋 Breaking Changes
- **Password Requirements**: Users must now create passwords with at least 12 characters including uppercase, lowercase, numbers, and special characters
- **Username Format**: Usernames must now be 3-20 characters and contain only letters, numbers, and underscores

### 🔄 Migration Notes
- Existing users are not affected by these changes
- New registrations must comply with the updated password and username requirements
- The app will guide users through the new requirements with helpful text and validation

---

## [1.3.0] - Previous Version
- Initial release with basic functionality
- Basic registration and login system
- Core chat and social features

---

*For detailed technical information, see the README.md file.*

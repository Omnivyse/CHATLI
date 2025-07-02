# Environment Variables Setup Guide

## Overview
This guide explains how to configure environment variables for the CHATLI mobile app to connect to your backend services.

## Setup Instructions

### 1. Choose Your Environment File
We have created three environment files for you:

- `env.example` - Template showing all available variables
- `env.production` - Ready for production use
- `env.development` - For development and testing

### 2. Create Your .env File

**Option A: Quick Production Setup**
```bash
cd mobile-app
cp env.production .env
```

**Option B: Development Setup**
```bash
cd mobile-app
cp env.development .env
```

**Option C: Custom Setup**
```bash
cd mobile-app
cp env.example .env
# Then edit .env with your values
```

### 3. Update Your Railway URL

Edit your `.env` file and replace the URL with your actual Railway deployment URL:

```env
# Replace this with your actual Railway URL
API_BASE_URL=https://YOUR-RAILWAY-APP.up.railway.app/api
SOCKET_URL=https://YOUR-RAILWAY-APP.up.railway.app
```

### 4. Install Dependencies

```bash
cd mobile-app
npm install
```

### 5. Restart Expo

```bash
npx expo start --clear
```

## Environment Variables Reference

### Required Variables
- `API_BASE_URL` - Your Railway API endpoint
- `SOCKET_URL` - Your Railway WebSocket endpoint

### Optional Variables
- `DEV_API_URL` - Local development API URL
- `DEV_SOCKET_URL` - Local development socket URL
- `APP_NAME` - App display name
- `APP_VERSION` - App version
- `DEBUG_MODE` - Enable debug logging
- `LOG_LEVEL` - Logging level (info, debug, error)

### Future Variables (for later features)
- `ANALYTICS_API_KEY` - Analytics service key
- `EXPO_PUSH_TOKEN` - Push notification token
- `SENTRY_DSN` - Error reporting service

## How It Works

The app automatically:
1. Uses `DEV_*` URLs in development mode if available
2. Falls back to production URLs (`API_BASE_URL`, `SOCKET_URL`)
3. Has hardcoded fallbacks if no env vars are found

## Finding Your Railway URL

1. Go to your Railway dashboard
2. Click on your CHATLI project
3. Copy the deployment URL (should look like `https://chatli-production.up.railway.app`)

## Testing

After setting up:
1. Start the app: `npx expo start --clear`
2. Try logging in with existing credentials
3. Check that API requests work
4. Verify real-time messaging works

## Troubleshooting

### App Still Shows Network Errors
- Check your `.env` file exists and has correct URLs
- Restart Expo with `--clear` flag
- Verify Railway deployment is running

### Environment Variables Not Loading
- Make sure you have `react-native-dotenv` installed
- Check `babel.config.js` has the dotenv plugin
- Restart the Metro bundler

### Wrong API URL Being Used
- Check `.env` file is in the `mobile-app` directory
- Verify the variable names match exactly
- Use console.log to debug which URL is being used

## Security Note

⚠️ **Important**: The `.env` file should not contain sensitive secrets since React Native apps bundle environment variables into the app binary. Only use public URLs and non-sensitive configuration. 
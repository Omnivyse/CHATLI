#!/bin/bash

echo "🚀 CHATLI TestFlight Deployment with Fixed App Icon"
echo "=================================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to Expo. Please run: eas login"
    exit 1
fi

echo "✅ EAS CLI ready"

# Clean build cache
echo "🧹 Cleaning build cache..."
eas build:clean

# Build for iOS
echo "🔨 Building for iOS..."
eas build --platform ios --profile production

echo ""
echo "📱 Build completed!"
echo ""
echo "Next steps:"
echo "1. Wait for build to complete in EAS dashboard"
echo "2. Run: eas submit --platform ios --profile production"
echo "3. Check TestFlight for the new build with fixed app icon"
echo ""
echo "🎯 The app icon should now display properly instead of being blank!" 
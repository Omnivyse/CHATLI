#!/bin/bash

echo "🚀 CHATLI iOS Deployment Setup"
echo "================================"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "🔐 Please login to Expo:"
    eas login
else
    echo "✅ Already logged in to Expo"
fi

# Configure the project
echo "⚙️  Configuring project..."
eas build:configure

echo ""
echo "📋 Next Steps:"
echo "1. Update eas.json with your Apple Developer details"
echo "2. Create app in App Store Connect"
echo "3. Run: eas build --platform ios --profile production"
echo "4. Run: eas submit --platform ios --profile production"
echo ""
echo "📖 See IOS_DEPLOYMENT_GUIDE.md for detailed instructions" 
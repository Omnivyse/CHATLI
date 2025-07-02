# 🚀 CHATLI Mobile App Setup Guide

## ❌ Issues Found & Solutions

The errors you encountered are common and easy to fix! Here's the correct setup process:

## 🔧 Step-by-Step Setup

### 1. **Delete node_modules and package-lock.json**
```bash
cd mobile-app
rm -rf node_modules package-lock.json
# On Windows: rmdir /s node_modules & del package-lock.json
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Create Missing Assets**
Create an `assets` folder with placeholder images:
```bash
mkdir assets
```

### 4. **Run the App**
Use the new Expo CLI (not the old global one):
```bash
# Start development server
npx expo start

# Or run directly on platform
npx expo start --android
npx expo start --ios
```

## 📱 Platform-Specific Instructions

### **Android**
1. Install Android Studio
2. Set up Android emulator OR connect physical device
3. Run: `npx expo start --android`

### **iOS** (Mac only)
1. Install Xcode
2. Run: `npx expo start --ios`

### **Physical Device** (Easiest!)
1. Install "Expo Go" app from App Store/Play Store
2. Run: `npx expo start`
3. Scan QR code with Expo Go app

## 🛠️ If You Still Get Errors

### **Node.js Version Issue**
If you get Node +17 warnings:
```bash
# Use Node 16 or 18 (recommended)
nvm use 16
# or
nvm use 18
```

### **Expo CLI Deprecated Warning**
This is normal! Just use `npx expo` instead of `expo`.

### **Package Not Found**
If specific packages fail:
```bash
# Clear npm cache
npm cache clean --force

# Try yarn instead
npm install -g yarn
yarn install
yarn start
```

## ✅ Success Indicators

You'll know it's working when you see:
```
Metro waiting on exp://192.168.x.x:19000
› Press a │ open Android
› Press i │ open iOS simulator  
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press d │ show developer tools
```

## 🔄 Quick Start Commands

After initial setup, just use:
```bash
cd mobile-app
npx expo start
```

Then choose your platform (a/i/w) or scan QR code!

## 🆘 Troubleshooting

**Can't connect to backend?**
- Make sure your Railway backend is running
- Check network connectivity
- Verify API URLs in `src/services/api.js`

**Simulator not opening?**
- Make sure Android Studio/Xcode is installed
- Try physical device with Expo Go app instead

**Still having issues?**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Use `npx expo start` instead of `expo start`

---

## 🎯 Next Steps After Setup

1. ✅ Get the app running locally
2. ✅ Test login with your existing CHATLI account
3. ✅ Test chat functionality
4. ✅ Customize branding and icons
5. ✅ Build for app stores when ready

**Your backend on Railway doesn't need any changes - it will work with both web and mobile!** 🚀 
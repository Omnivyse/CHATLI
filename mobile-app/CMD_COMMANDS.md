# 🚀 CMD Commands for CHATLI Mobile App (Windows Command Prompt)

## ⚠️ IMPORTANT: Use CMD, NOT PowerShell!

**Open Command Prompt (cmd.exe), NOT PowerShell**

## 🔧 Step-by-Step Fix (CMD Commands)

### Step 1: Clean Everything
```cmd
cd mobile-app

REM Delete node_modules folder
rmdir /s /q node_modules

REM Delete lock files
del package-lock.json
del yarn.lock
```

### Step 2: Install with Force (Fixes Dependency Issues)
```cmd
REM Install with legacy peer deps to fix React version conflicts
npm install --legacy-peer-deps
```

### Step 3: Run the App
```cmd
REM Use npx to avoid CLI version issues
npx expo start
```

## 🎯 Quick One-Line Solution
If the above doesn't work, try this single command:
```cmd
npm install --force && npx expo start
```

## 📱 Alternative: Use Your Phone (Easiest!)
```cmd
REM 1. Download "Expo Go" app on your phone
REM 2. Run these commands:
npm install --legacy-peer-deps
npx expo start

REM 3. Scan QR code with phone camera or Expo Go app
REM 4. App runs on your phone!
```

## 🔄 If Still Having Issues
```cmd
REM Try with Yarn instead
npm install -g yarn
yarn install
yarn start
```

## 🆘 Nuclear Option (Complete Fresh Start)
```cmd
REM Go to parent directory
cd ..

REM Create completely new project
npx create-expo-app chatli-mobile-fresh --template blank

REM Copy our files to the new project
```

## ✅ Success Signs
You should see:
```
Metro waiting on exp://192.168.x.x:19000
QR code appears
› Press a │ open Android
› Press i │ open iOS simulator  
› Press w │ open web
```

## 📱 Testing on Your Phone
1. **Download "Expo Go"** from App Store or Google Play
2. **Run:** `npx expo start`
3. **Scan QR code** that appears
4. **App opens instantly** on your phone!

## 🔑 Key Points
- ✅ Use **CMD** (Command Prompt), not PowerShell
- ✅ Use `--legacy-peer-deps` to fix React conflicts
- ✅ Use `npx expo start` instead of `expo start`
- ✅ Test on your phone - it's easier than simulators!

---

**Try these CMD commands in order. The phone method is the most reliable!** 📱 
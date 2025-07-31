# Login Debug Guide

## Step-by-Step Troubleshooting

### **Step 1: Check Server Status**

First, let's make sure the server is running:

```bash
# In the server directory
cd server
npm start
```

**Expected output:**
```
✅ Server running on port 5000
✅ Connected to MongoDB
```

### **Step 2: Test Your Account**

Update the test script with your actual email and password:

1. **Edit the test file:**
```javascript
// In server/test-login.js, update these lines:
const testEmail = 'your-actual-email@example.com'; // Your real email
const testPassword = 'your-actual-password'; // Your real password
```

2. **Uncomment the test call:**
```javascript
// Change this line from:
// testLogin();
// To:
testLogin();
```

3. **Run the test:**
```bash
node test-login.js
```

### **Step 3: Check Common Issues**

#### **Issue 1: Wrong Email/Password**
**Symptoms:** "Имэйл эсвэл нууц үг буруу байна"
**Solution:** Double-check your email and password

#### **Issue 2: Email Not Verified**
**Symptoms:** "Имэйл хаягаа баталгаажуулна уу"
**Solution:** The backend should auto-verify existing users

#### **Issue 3: Network Error**
**Symptoms:** "Сүлжээний алдаа гарлаа"
**Solution:** Check internet connection and server status

#### **Issue 4: Server Not Running**
**Symptoms:** "Хүсэлт хугацаа дууссан"
**Solution:** Start the server with `npm start`

### **Step 4: Mobile App Debug**

#### **Check API URL:**
The mobile app should be using the correct API URL. Check the console logs:

```
🔗 Mobile App API URL: https://chatli-production.up.railway.app/api
🔗 Environment: Production
```

#### **Clear App Data:**
1. **Uninstall and reinstall** the mobile app
2. **Clear AsyncStorage** by logging out and back in
3. **Check network** connection

### **Step 5: Manual Database Check**

If you have database access, check your user record:

```javascript
// In MongoDB shell or database tool
db.users.findOne({email: "your-email@example.com"})
```

**Expected result:**
```json
{
  "_id": "...",
  "name": "Your Name",
  "email": "your-email@example.com",
  "emailVerified": true,  // Should be true for existing users
  "createdAt": "..."
}
```

### **Step 6: Test Login API Directly**

Use curl or Postman to test the login endpoint:

```bash
curl -X POST https://chatli-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Амжилттай нэвтэрлээ",
  "data": {
    "user": {
      "_id": "...",
      "name": "Your Name",
      "email": "your-email@example.com",
      "emailVerified": true
    },
    "token": "jwt_token_here"
  }
}
```

### **Step 7: Check Environment Variables**

Make sure your server has the correct environment variables:

```bash
# Check if config.env exists
ls -la config.env

# Check environment variables
echo $MONGODB_URI
echo $JWT_SECRET
```

### **Step 8: Common Solutions**

#### **Solution 1: Reset Your Password**
If you can't remember your password:

1. **Try common passwords** you might have used
2. **Check if you used a different email**
3. **Contact support** to reset your password

#### **Solution 2: Create New Account**
If nothing works:

1. **Register a new account** with a different email
2. **Test if the new account works**
3. **If it works**, the issue is with your specific account

#### **Solution 3: Check Server Logs**
Look for error messages in the server console:

```
❌ Login error: [specific error message]
🔄 Auto-verified existing user: your-email@example.com
```

### **Step 9: Debug Commands**

#### **Check Server Status:**
```bash
# Check if server is running
curl https://chatli-production.up.railway.app/api/health

# Check server logs
npm start
```

#### **Check Database Connection:**
```bash
# Test database connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ DB connected'))
  .catch(err => console.log('❌ DB error:', err));
"
```

#### **Check User in Database:**
```bash
# Run the test script
node test-login.js
```

### **Step 10: Final Checklist**

- [ ] **Server is running** (`npm start`)
- [ ] **Database is connected** (no connection errors)
- [ ] **Your email exists** in the database
- [ ] **Your password is correct**
- [ ] **Your account is verified** (emailVerified: true)
- [ ] **API URL is correct** in mobile app
- [ ] **Network connection** is stable
- [ ] **No firewall blocking** the connection

### **If Still Not Working:**

1. **Provide error message** from mobile app
2. **Share server logs** if available
3. **Try from web app** instead of mobile app
4. **Check if other users** can login
5. **Contact support** with specific error details

### **Quick Test:**

Try logging in with these exact steps:

1. **Open mobile app**
2. **Enter your email** (exactly as registered)
3. **Enter your password** (exactly as set)
4. **Tap login**
5. **Check console logs** for any error messages

**Expected behavior:**
- Login should work immediately
- You should see the main app
- No verification banner should appear

If it still doesn't work, please share:
- The exact error message you see
- Your email address (so we can check the database)
- Whether the server is running
- Any console logs from the mobile app 
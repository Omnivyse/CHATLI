# Gmail Authentication Fix

## Current Status
✅ **Environment variables loaded** - config.env is working
✅ **Email service initialized** - nodemailer is configured
❌ **Gmail authentication failed** - "Username and Password not accepted"

## Error Analysis
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

This error means Gmail is rejecting the credentials. Here's how to fix it:

## Step-by-Step Fix

### **1. Verify 2-Factor Authentication is Enabled**

#### **Check 2FA Status:**
1. Go to https://myaccount.google.com/security
2. Look for "2-Step Verification"
3. **Must be enabled** before creating app passwords

#### **Enable 2FA if not enabled:**
1. Click "2-Step Verification"
2. Follow the setup process
3. Use your phone number or authenticator app
4. Complete the setup

### **2. Generate a New App Password**

#### **Create New App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Select "Mail" from the dropdown
4. Select "Other (Custom name)"
5. Enter "CHATLI Email Service" as the name
6. Click "Generate"
7. **Copy the 16-character password** (without spaces)

#### **Important Notes:**
- ✅ **Use the generated password** (not your regular Gmail password)
- ✅ **Remove all spaces** from the password
- ✅ **Copy immediately** - you can't see it again
- ✅ **16 characters** - should be exactly 16 characters

### **3. Update Your Configuration**

#### **Update config.env file:**
```env
EMAIL_USER=omnivyse@gmail.com
EMAIL_PASS=your-new-16-character-app-password
```

#### **For Production (Railway):**
Update in Railway dashboard:
- `EMAIL_USER` = omnivyse@gmail.com
- `EMAIL_PASS` = your-new-16-character-app-password

### **4. Test the Email Service**

#### **Run the test script:**
```bash
cd server
node test-email.js
```

#### **Expected Success Output:**
```
🧪 Testing Email Service...

📧 Environment Variables:
EMAIL_USER: ✅ Set
EMAIL_PASS: ✅ Set

🔧 Testing Email Service Initialization:
✅ Email service is working correctly
Email service initialized: ✅ Yes

🔢 Testing Verification Code Generation:
Code 1: 12345 (5 digits: ✅)
Code 2: 67890 (5 digits: ✅)
Codes are different: ✅

📤 Testing Email Sending:
Sending test email to: omnivyse@gmail.com
✅ Email sent successfully!
Message ID: <abc123@railway.app>

🎯 Test Complete!
```

## Troubleshooting

### **If Still Getting "Username and Password not accepted":**

#### **1. Check Email Address:**
- ✅ Verify `omnivyse@gmail.com` is correct
- ✅ Check for typos in the email address
- ✅ Ensure it's the same account where you enabled 2FA

#### **2. Check App Password:**
- ✅ **Exactly 16 characters** (no spaces)
- ✅ **Generated from the correct account**
- ✅ **Generated after enabling 2FA**
- ✅ **Not your regular Gmail password**

#### **3. Check 2FA Status:**
- ✅ **2FA must be enabled** before app passwords work
- ✅ **Use the same account** for both 2FA and app password
- ✅ **Wait a few minutes** after enabling 2FA

#### **4. Alternative: Use Different Email**
If the current email doesn't work:
1. Use a different Gmail account
2. Enable 2FA on that account
3. Generate app password for that account
4. Update config.env with new credentials

### **5. Gmail Security Settings**

#### **Check Gmail Settings:**
1. Go to https://myaccount.google.com/security
2. Look for "Less secure app access"
3. **This should be OFF** (app passwords work with 2FA)

#### **Check Account Activity:**
1. Go to https://myaccount.google.com/notifications
2. Look for any security alerts
3. Approve any pending security requests

## Common Mistakes

### **❌ Don't Do These:**
- Use your regular Gmail password
- Include spaces in the app password
- Use an account without 2FA enabled
- Use a different email than where you generated the app password

### **✅ Do These:**
- Enable 2FA first
- Generate app password after 2FA
- Remove all spaces from app password
- Use the same email for everything

## Verification Flow After Fix

### **1. User Registration:**
```
User registers → 5-digit code generated → Email sent → User receives email
```

### **2. Email Content:**
- **Subject**: "CHATLI - Имэйл баталгаажуулалт"
- **Body**: Professional email with 5-digit code
- **Code**: Clearly displayed in the email

### **3. User Verification:**
```
User enters code → Code verified → Account verified → Full access
```

## Next Steps

1. ✅ **Enable 2-Factor Authentication**
2. ✅ **Generate new app password**
3. ✅ **Update config.env**
4. ✅ **Test email service**
5. ✅ **Restart server**
6. ✅ **Test user registration**

After completing these steps, the 5-digit verification codes should be sent successfully! 🎉 
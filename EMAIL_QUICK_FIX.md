# Email Service Quick Fix

## Problem
5-digit verification codes are not being sent to users' email addresses.

## Quick Solution

### **1. Set Up Gmail App Password**

#### **Step 1: Enable 2-Factor Authentication**
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"

#### **Step 2: Generate App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "CHATLI Email Service"
4. Copy the 16-character password

### **2. Configure Environment Variables**

#### **For Local Development:**
Add to `server/config.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

#### **For Production (Railway):**
Add in Railway dashboard:
- `EMAIL_USER` = your-email@gmail.com
- `EMAIL_PASS` = your-16-character-app-password

### **3. Test Email Service**

Run the test script:
```bash
cd server
node test-email.js
```

### **4. Restart Server**

After setting environment variables:
```bash
# Local development
npm run dev

# Production (Railway will auto-restart)
```

## Expected Results

### **1. Email Service Test:**
```
🧪 Testing Email Service...

📧 Environment Variables:
EMAIL_USER: ✅ Set
EMAIL_PASS: ✅ Set

🔧 Testing Email Service Initialization:
Email service initialized: ✅ Yes

🔢 Testing Verification Code Generation:
Code 1: 12345 (5 digits: ✅)
Code 2: 67890 (5 digits: ✅)
Codes are different: ✅

📤 Testing Email Sending:
Sending test email to: your-email@gmail.com
✅ Email sent successfully!
Message ID: <abc123@railway.app>

🎯 Test Complete!
```

### **2. User Registration:**
- User registers successfully
- 5-digit code sent to email
- User receives verification email
- Code works in verification modal

## Troubleshooting

### **If Email Still Not Sending:**

#### **1. Check Environment Variables:**
```bash
# In server directory
node -e "console.log('EMAIL_USER:', process.env.EMAIL_USER)"
node -e "console.log('EMAIL_PASS:', process.env.EMAIL_PASS)"
```

#### **2. Check Email Service Logs:**
Look for these messages in server logs:
- ✅ "Email service initialized"
- ✅ "Verification email sent successfully"
- ❌ "Email service initialization failed"
- ❌ "Error sending verification email"

#### **3. Common Issues:**
- **Wrong app password**: Regenerate Gmail app password
- **2FA not enabled**: Enable 2-Step Verification first
- **Wrong email**: Check EMAIL_USER spelling
- **Network issues**: Check internet connection

### **4. Fallback Behavior:**
If email service fails, the app will:
- Log the verification code to console
- Continue registration process
- Show "Email logged (service not configured)" message

## Verification Flow

### **1. Registration:**
```
User registers → Code generated → Email sent → User receives email
```

### **2. Verification:**
```
User enters code → Code verified → Account verified → Full access
```

### **3. Resend:**
```
User requests resend → New code generated → New email sent
```

## Security Notes

- ✅ Use Gmail app passwords (not regular passwords)
- ✅ Keep credentials in environment variables
- ✅ Never commit email credentials to git
- ✅ App passwords can be revoked if compromised

## Next Steps

1. ✅ Set up Gmail app password
2. ✅ Configure environment variables
3. ✅ Test email service
4. ✅ Restart server
5. ✅ Test user registration
6. ✅ Verify email receipt

The email service should now properly send 5-digit verification codes! 🎉 
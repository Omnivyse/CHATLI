# Email Service Setup Guide

## Problem
The 5-digit verification codes are not being sent to users' email addresses.

## Root Cause
The email service is not properly configured with Gmail SMTP credentials.

## Solution

### **1. Gmail App Password Setup**

#### **Step 1: Enable 2-Factor Authentication**
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

#### **Step 2: Generate App Password**
1. In Security settings, find "App passwords"
2. Click "Generate" for a new app password
3. Select "Mail" as the app type
4. Copy the generated 16-character password

### **2. Environment Variables Setup**

#### **For Local Development:**
Create or update `server/config.env`:
```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

#### **For Production (Railway):**
Add these environment variables in Railway dashboard:
- `EMAIL_USER` = your-email@gmail.com
- `EMAIL_PASS` = your-16-character-app-password

### **3. Email Service Configuration**

The email service is already configured in `server/services/emailService.js`:

```javascript
// Initialize email transporter
initializeTransporter() {
  try {
    // Use Gmail SMTP
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password
      }
    });

    console.log('✅ Email service initialized');
  } catch (error) {
    console.error('❌ Email service initialization failed:', error);
    this.transporter = null;
  }
}
```

### **4. Verification Code Generation**

The service generates 5-digit codes:
```javascript
// Generate 5-digit verification code
generateVerificationCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}
```

### **5. Email Template**

The verification email includes:
- **Subject**: "CHATLI - Имэйл баталгаажуулалт"
- **HTML Content**: Professional email template
- **Text Content**: Plain text version
- **5-digit code**: Clearly displayed

## Testing the Email Service

### **1. Test Email Service Function**
```javascript
// In server console or test script
const emailService = require('./services/emailService');

// Test the service
emailService.testEmailService().then(result => {
  console.log('Email service test result:', result);
});
```

### **2. Test Verification Email**
```javascript
// Test sending verification email
emailService.sendVerificationEmail(
  'test@example.com',
  'TestUser',
  '12345'
).then(result => {
  console.log('Email send result:', result);
});
```

## Troubleshooting

### **1. "Email service not available" Error**
**Cause**: Environment variables not set
**Solution**: 
- Check if `EMAIL_USER` and `EMAIL_PASS` are set
- Verify the values are correct
- Restart the server after setting variables

### **2. "Authentication failed" Error**
**Cause**: Wrong app password or email
**Solution**:
- Regenerate Gmail app password
- Ensure 2FA is enabled
- Check email address spelling

### **3. "Invalid login" Error**
**Cause**: Gmail security settings
**Solution**:
- Enable "Less secure app access" (if available)
- Use app password instead of regular password
- Check Gmail account security settings

### **4. "Connection timeout" Error**
**Cause**: Network or firewall issues
**Solution**:
- Check internet connection
- Verify firewall settings
- Try different network

## Email Service Features

### **1. Automatic Fallback**
If email service fails, the app continues to work:
```javascript
if (!this.transporter) {
  console.log('📧 Email service not available, logging instead');
  console.log('📧 Verification code:', verificationCode);
  return { success: true, message: 'Email logged (service not configured)' };
}
```

### **2. Error Handling**
Comprehensive error handling with logging:
```javascript
catch (error) {
  console.error('❌ Error sending verification email:', error);
  return { success: false, error: error.message };
}
```

### **3. Professional Email Template**
- Responsive HTML design
- Mongolian language support
- Clear verification code display
- Professional branding

## Security Considerations

### **1. App Passwords**
- Use Gmail app passwords, not regular passwords
- App passwords are 16 characters long
- Can be revoked if compromised

### **2. Environment Variables**
- Never commit email credentials to git
- Use environment variables for all sensitive data
- Keep credentials secure

### **3. Rate Limiting**
- Email service includes rate limiting
- Prevents abuse of email sending
- Protects against spam

## Production Deployment

### **1. Railway Deployment**
1. Add environment variables in Railway dashboard
2. Deploy the updated code
3. Test email functionality

### **2. Environment Variables**
```env
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password
```

### **3. Monitoring**
- Check Railway logs for email service status
- Monitor email sending success rates
- Set up alerts for email failures

## Verification Flow

### **1. User Registration**
1. User registers with email
2. System generates 5-digit code
3. Email service sends verification email
4. User receives email with code

### **2. Email Verification**
1. User enters 5-digit code in app
2. System verifies code against database
3. User account is marked as verified
4. Full access granted

### **3. Resend Functionality**
1. User can request new code
2. System generates new 5-digit code
3. Email service sends new verification email
4. Old code becomes invalid

## Code Examples

### **1. Registration with Email**
```javascript
// In auth.js registration route
const verificationCode = emailService.generateVerificationCode();
const verificationExpires = new Date(Date.now() + 60 * 1000); // 1 minute

const user = new User({
  name,
  username,
  email,
  password,
  emailVerified: false,
  verificationCode,
  verificationExpires
});

await user.save();

// Send verification email
const emailResult = await emailService.sendVerificationEmail(email, name, verificationCode);
```

### **2. Email Verification**
```javascript
// In auth.js verification route
const user = await User.findOne({
  email: email,
  verificationCode: code,
  verificationExpires: { $gt: new Date() }
});

if (user) {
  user.emailVerified = true;
  user.verificationCode = null;
  user.verificationExpires = null;
  await user.save();
}
```

## Conclusion

To fix the email verification issue:

1. ✅ **Set up Gmail app password**
2. ✅ **Configure environment variables**
3. ✅ **Test email service**
4. ✅ **Deploy to production**
5. ✅ **Monitor email functionality**

The email service will then properly send 5-digit verification codes to users' email addresses! 🎉 
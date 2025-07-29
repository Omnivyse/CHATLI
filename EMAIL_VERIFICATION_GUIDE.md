# Email Verification Implementation Guide

## Overview
This guide covers the implementation of email verification for the CHATLI app, ensuring one email per account and requiring email verification before users can access the app.

## Features Implemented

### ✅ **Core Features:**
- **Email verification required** - Users must verify email before login
- **One email per account** - Prevents multiple accounts with same email
- **Professional email templates** - Beautiful HTML emails in Mongolian
- **Token-based verification** - Secure verification links
- **Resend functionality** - Users can request new verification emails
- **Mobile app integration** - Dedicated verification screen

### ✅ **Security Features:**
- **Unique email constraint** - Database-level uniqueness
- **Token expiration** - 24-hour token validity
- **Secure token generation** - Cryptographically random tokens
- **Email validation** - Proper email format checking

## Technical Implementation

### **Backend (Node.js + Express)**

**Files Modified:**
- `server/models/User.js` - Added verification fields
- `server/services/emailService.js` (New) - Email service with Nodemailer
- `server/routes/auth.js` - Updated registration, login, and verification routes
- `server/package.json` - Added nodemailer dependency

**New User Model Fields:**
```javascript
{
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationExpires: { type: Date, default: null }
}
```

**New API Endpoints:**
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email

### **Mobile App (React Native)**

**Files Modified:**
- `mobile-app/src/services/api.js` - Added verification methods
- `mobile-app/src/screens/EmailVerificationScreen.js` (New) - Verification screen
- `mobile-app/src/screens/RegisterScreen.js` - Updated to navigate to verification
- `mobile-app/src/screens/LoginScreen.js` - Handle unverified users
- `mobile-app/App.js` - Added verification screen to navigation

## Setup Instructions

### **1. Install Dependencies**

**Server:**
```bash
cd server
npm install nodemailer
```

### **2. Environment Configuration**

**Server Environment Variables:**
```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-app-domain.com

# For Railway deployment, add these to Railway environment variables
```

### **3. Gmail Setup (Recommended)**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use the app password** in `EMAIL_PASS` environment variable

### **4. Alternative Email Services**

**SendGrid (Free tier: 100 emails/day):**
```javascript
// In emailService.js
this.transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

**Mailgun (Free tier: 5,000 emails/month):**
```javascript
// In emailService.js
this.transporter = nodemailer.createTransporter({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASS
  }
});
```

## User Flow

### **Registration Flow:**
1. **User registers** → Account created with `emailVerified: false`
2. **Verification email sent** → User receives email with verification link
3. **User clicks link** → Email verified, account activated
4. **User can login** → Full access to app features

### **Login Flow:**
1. **User attempts login** → System checks `emailVerified`
2. **If verified** → Login successful
3. **If not verified** → Redirected to verification screen
4. **User verifies email** → Can then login normally

### **Verification Screen Features:**
- **Step-by-step instructions** in Mongolian
- **Open email app** button
- **Resend verification** with 60-second cooldown
- **Automatic verification** if token in URL
- **Professional UI** with proper theming

## Email Templates

### **Verification Email Features:**
- **Professional HTML design** with CHATLI branding
- **Mongolian language** content
- **Mobile-responsive** layout
- **Clear call-to-action** button
- **Fallback text version** for email clients
- **Security warnings** and instructions

### **Email Content:**
- **Subject:** "CHATLI - Имэйл баталгаажуулалт"
- **Greeting:** Personalized with user's name
- **Instructions:** Clear steps to verify
- **Button:** "Имэйл баталгаажуулах"
- **Security note:** Warning about fake emails
- **Footer:** Copyright and legal info

## API Endpoints

### **POST /api/auth/register**
**Request:**
```json
{
  "name": "User Name",
  "username": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Бүртгэл амжилттай үүслээ. Имэйл хаягаа шалгаж баталгаажуулна уу.",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "username": "username",
      "email": "user@example.com",
      "emailVerified": false
    },
    "emailSent": true
  }
}
```

### **POST /api/auth/login**
**Unverified User Response:**
```json
{
  "success": false,
  "message": "Имэйл хаягаа баталгаажуулна уу. Имэйл хаягаа шалгаж баталгаажуулах холбоосыг дарна уу.",
  "data": {
    "emailVerified": false,
    "email": "user@example.com"
  }
}
```

### **POST /api/auth/verify-email**
**Request:**
```json
{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Имэйл хаяг амжилттай баталгаажлаа",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "username": "username",
      "email": "user@example.com",
      "emailVerified": true
    },
    "token": "jwt_token_for_login"
  }
}
```

### **POST /api/auth/resend-verification**
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Баталгаажуулах имэйл дахин илгээгдлээ"
}
```

## Error Handling

### **Common Error Scenarios:**

1. **Email Already Exists:**
   ```json
   {
     "success": false,
     "message": "Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна"
   }
   ```

2. **Invalid Verification Token:**
   ```json
   {
     "success": false,
     "message": "Баталгаажуулах холбоос хүчингүй эсвэл хугацаа дууссан байна"
   }
   ```

3. **Email Service Unavailable:**
   - Registration continues but email is logged to console
   - User can request resend later

### **Mobile App Error Handling:**
- **Network errors** - Proper error messages
- **Invalid tokens** - Clear instructions
- **Email not received** - Resend functionality
- **Verification failures** - Retry options

## Security Considerations

### **Token Security:**
- **32-byte random tokens** - Cryptographically secure
- **24-hour expiration** - Prevents long-term abuse
- **Single-use tokens** - Deleted after verification
- **Database constraints** - Unique email enforcement

### **Email Security:**
- **No sensitive data** in emails
- **HTTPS verification links** - Secure transmission
- **Professional branding** - Prevents phishing
- **Clear instructions** - Reduces user confusion

### **Rate Limiting:**
- **Resend cooldown** - 60 seconds between requests
- **Token expiration** - Automatic cleanup
- **Email validation** - Proper format checking

## Testing

### **Development Testing:**
```javascript
// Test email service
const emailService = require('./services/emailService');
await emailService.testEmailService();

// Test verification flow
// 1. Register new user
// 2. Check console for verification token
// 3. Use token to verify email
// 4. Test login with verified account
```

### **Production Testing:**
1. **Register with real email**
2. **Check email delivery**
3. **Click verification link**
4. **Verify login works**
5. **Test resend functionality**

## Troubleshooting

### **Email Not Sending:**
- Check Gmail app password
- Verify environment variables
- Check email service logs
- Test with different email provider

### **Verification Not Working:**
- Check token expiration
- Verify database connection
- Check API endpoint logs
- Test with valid token

### **Mobile App Issues:**
- Check navigation setup
- Verify API endpoints
- Test with different devices
- Check error handling

## Future Enhancements

### **Planned Features:**
1. **Email preferences** - User notification settings
2. **Password reset** - Email-based password recovery
3. **Account recovery** - Email-based account access
4. **Email change** - Verification for email updates
5. **Bulk verification** - Admin tools for verification

### **Advanced Features:**
1. **Email templates** - Customizable email designs
2. **Analytics** - Email delivery tracking
3. **A/B testing** - Email template optimization
4. **Internationalization** - Multiple language support
5. **Email validation** - Real-time email checking

## Support

For issues related to:
- **Email delivery** - Check email service configuration
- **Token verification** - Check database and API logs
- **Mobile app** - Check navigation and API integration
- **Security** - Review token generation and validation

## Deployment Notes

### **Railway Deployment:**
1. Add environment variables in Railway dashboard
2. Ensure email service is properly configured
3. Test email delivery in production
4. Monitor verification success rates

### **Email Service Limits:**
- **Gmail:** 500 emails/day (personal), 2000/day (business)
- **SendGrid:** 100 emails/day (free), 40k/month (paid)
- **Mailgun:** 5,000 emails/month (free), unlimited (paid)

Choose email service based on expected user volume and budget. 
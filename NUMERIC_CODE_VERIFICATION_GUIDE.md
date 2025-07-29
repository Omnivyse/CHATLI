# Numeric Code Verification System Guide

## Overview
This guide covers the implementation of a 5-digit numeric code verification system for the CHATLI app, replacing the previous token-based email verification with a more user-friendly approach.

## Features Implemented

### ✅ **Core Features:**
- **5-digit numeric codes** - Easy to enter and remember
- **1-minute expiration** - Quick security with short timeouts
- **Auto-focus input fields** - Smooth user experience
- **Auto-submit** - Verification happens automatically when code is complete
- **Resend functionality** - 60-second cooldown with countdown timer
- **Professional email templates** - Beautiful HTML emails with code display
- **Mobile-optimized UI** - Dedicated verification screen with numeric input

### ✅ **Security Features:**
- **Unique email constraint** - Database-level uniqueness
- **1-minute code expiration** - Short timeout for security
- **Secure code generation** - Random 5-digit numbers
- **Email validation** - Proper email format checking

## Technical Implementation

### **Backend (Node.js + Express)**

**Files Modified:**
- `server/models/User.js` - Changed `verificationToken` to `verificationCode`
- `server/services/emailService.js` - Updated email templates and code generation
- `server/routes/auth.js` - Updated registration and verification endpoints
- `server/package.json` - Confirmed nodemailer dependency

**New User Model Fields:**
```javascript
{
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null }, // Changed from verificationToken
  verificationExpires: { type: Date, default: null }
}
```

**New API Endpoints:**
- `POST /api/auth/verify-email` - Verify email with 5-digit code
- `POST /api/auth/resend-verification` - Resend verification code

### **Mobile App (React Native)**

**Files Modified:**
- `mobile-app/src/services/api.js` - Updated verification methods
- `mobile-app/src/screens/EmailVerificationScreen.js` - Complete redesign with numeric input
- `mobile-app/src/screens/RegisterScreen.js` - Updated to navigate to verification
- `mobile-app/src/screens/LoginScreen.js` - Handle unverified users

## User Flow

### **Registration Flow:**
1. **User registers** → Account created with `emailVerified: false`
2. **5-digit code sent** → User receives email with verification code
3. **User enters code** → Code verified, account activated
4. **User can login** → Full access to app features

### **Verification Screen Features:**
- **5 separate input boxes** for each digit
- **Auto-focus** - Automatically moves to next input
- **Auto-submit** - Verifies when all 5 digits entered
- **Backspace support** - Moves to previous input on backspace
- **1-minute countdown timer** - Shows code expiration
- **Resend button** - 60-second cooldown with timer
- **Error handling** - Clear error messages for invalid codes

## Email Templates

### **Verification Email Features:**
- **Professional HTML design** with CHATLI branding
- **Large code display** - Prominent 5-digit code in monospace font
- **Mongolian language** content
- **Mobile-responsive** layout
- **1-minute expiration notice** - Clear timeout information
- **Fallback text version** for email clients

### **Email Content:**
- **Subject:** "CHATLI - Имэйл баталгаажуулалт"
- **Greeting:** Personalized with user's name
- **Instructions:** Clear steps to enter code
- **Code Display:** Large, prominent 5-digit code
- **Timeout Notice:** "Энэ кодыг 1 минутын дотор оруулна уу"
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

### **POST /api/auth/verify-email**
**Request:**
```json
{
  "code": "12345",
  "email": "user@example.com"
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

## Mobile App Features

### **Verification Screen UI:**
- **5 separate input boxes** - Each for one digit
- **Auto-focus navigation** - Smooth input experience
- **Visual feedback** - Error states and loading indicators
- **Countdown timer** - Shows remaining time (MM:SS format)
- **Resend button** - With cooldown timer
- **Email app integration** - One-tap to open email

### **Input Handling:**
```javascript
const handleCodeChange = (text, index) => {
  // Auto-focus next input
  if (text && index < 4) {
    inputRefs.current[index + 1]?.focus();
  }
  
  // Auto-submit when complete
  if (index === 4 && text && newCode.every(digit => digit !== '')) {
    handleVerification();
  }
};
```

### **Timer Implementation:**
```javascript
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

## Error Handling

### **Common Error Scenarios:**

1. **Invalid Code:**
   ```json
   {
     "success": false,
     "message": "Баталгаажуулах код буруу эсвэл хугацаа дууссан байна"
   }
   ```

2. **Expired Code:**
   - Same error as invalid code
   - User can request new code via resend button

3. **Email Not Found:**
   ```json
   {
     "success": false,
     "message": "Энэ имэйл хаягтай хэрэглэгч олдсонгүй"
   }
   ```

### **Mobile App Error Handling:**
- **Invalid code** - Error message below input fields
- **Network errors** - Proper error messages
- **Expired codes** - Clear instructions to resend
- **Input validation** - Real-time validation feedback

## Security Considerations

### **Code Security:**
- **5-digit random codes** - 100,000 possible combinations
- **1-minute expiration** - Very short timeout for security
- **Single-use codes** - Deleted after verification
- **Email-specific** - Codes tied to specific email addresses

### **Rate Limiting:**
- **Resend cooldown** - 60 seconds between requests
- **Code expiration** - Automatic cleanup after 1 minute
- **Email validation** - Proper format checking

### **User Experience:**
- **Quick verification** - 1-minute timeout encourages fast action
- **Easy input** - 5 digits are easy to remember and enter
- **Auto-submit** - Reduces user friction
- **Clear feedback** - Immediate error messages

## Testing

### **Development Testing:**
```javascript
// Test code generation
const emailService = require('./services/emailService');
const code = emailService.generateVerificationCode();
console.log('Generated code:', code); // Should be 5 digits

// Test verification flow
// 1. Register new user
// 2. Check console for verification code
// 3. Enter code in mobile app
// 4. Test login with verified account
```

### **Production Testing:**
1. **Register with real email**
2. **Check email for 5-digit code**
3. **Enter code in mobile app**
4. **Verify login works**
5. **Test resend functionality**
6. **Test code expiration**

## Troubleshooting

### **Code Not Received:**
- Check email service configuration
- Verify environment variables
- Check email service logs
- Test with different email provider

### **Code Not Working:**
- Check code expiration (1 minute)
- Verify email address matches
- Check database connection
- Test with valid code

### **Mobile App Issues:**
- Check input field focus
- Verify auto-submit functionality
- Test timer countdown
- Check error message display

## Performance Considerations

### **Code Generation:**
- **Fast generation** - Simple random number generation
- **No database queries** - Codes generated in memory
- **Quick validation** - Simple string comparison

### **Email Delivery:**
- **Immediate sending** - No queuing or delays
- **Template caching** - HTML templates pre-generated
- **Fallback support** - Text version for email clients

## Future Enhancements

### **Planned Features:**
1. **SMS verification** - Send codes via SMS
2. **Voice calls** - Automated voice code delivery
3. **Biometric verification** - Fingerprint/face ID integration
4. **Multi-factor authentication** - Additional security layers
5. **Code history** - Track verification attempts

### **Advanced Features:**
1. **Custom code length** - Configurable code length
2. **Multiple attempts** - Allow limited retry attempts
3. **Geolocation verification** - Location-based security
4. **Device fingerprinting** - Device-specific verification
5. **Analytics tracking** - Verification success rates

## Migration Notes

### **Database Migration:**
- **Field rename** - `verificationToken` → `verificationCode`
- **Data cleanup** - Remove old token-based data
- **Index updates** - Update database indexes if needed

### **Backward Compatibility:**
- **API changes** - New endpoint parameters
- **Mobile app updates** - New verification screen
- **Email template changes** - New code-based emails

## Support

For issues related to:
- **Code generation** - Check random number generation
- **Email delivery** - Check email service configuration
- **Code verification** - Check database and API logs
- **Mobile app** - Check input handling and UI
- **Security** - Review code generation and validation

## Deployment Notes

### **Railway Deployment:**
1. Update environment variables if needed
2. Ensure email service is properly configured
3. Test code delivery in production
4. Monitor verification success rates

### **Email Service Limits:**
- **Gmail:** 500 emails/day (personal), 2000/day (business)
- **SendGrid:** 100 emails/day (free), 40k/month (paid)
- **Mailgun:** 5,000 emails/month (free), unlimited (paid)

Choose email service based on expected user volume and budget.

## Conclusion

The numeric code verification system provides:
- ✅ **Better user experience** - Easy 5-digit code input
- ✅ **Enhanced security** - 1-minute expiration
- ✅ **Professional emails** - Beautiful code display
- ✅ **Mobile optimization** - Dedicated verification screen
- ✅ **Auto-submit functionality** - Reduced user friction
- ✅ **Comprehensive error handling** - Clear feedback
- ✅ **Resend capability** - 60-second cooldown timer

This system replaces the token-based verification with a more user-friendly approach while maintaining security and reliability. 
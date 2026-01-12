# Email Verification Fix - Mobile App

## Issue
Emails work when tested with `test-email-external.js`, but when registering a new account through the mobile app and pressing the "Resend Code" button, emails are not being sent.

## Fixes Applied

### 1. Enhanced Resend Verification Endpoint (`server/routes/auth.js`)
- ✅ Added email normalization (lowercase, trim)
- ✅ Better logging to track email sending
- ✅ Fixed verification code expiration (changed from 1 minute to 24 hours to match registration)
- ✅ Uses `user.username` instead of `user.name` for consistency
- ✅ Returns more detailed response with `emailSent`, `messageId`, and `accepted` recipients

### 2. Improved Email Verification Modal (`mobile-app/src/components/EmailVerificationModal.js`)
- ✅ Better error handling and logging
- ✅ Shows verification code in development mode if email fails
- ✅ More informative error messages
- ✅ Validates user and email before attempting resend

### 3. Enhanced Email Service (`server/services/emailService.js`)
- ✅ Validates email format before sending
- ✅ Checks if email was accepted/rejected by server
- ✅ Better error messages with specific guidance
- ✅ Improved headers for better deliverability

## Testing Steps

### 1. Test Email Service Directly
```bash
cd server
node test-email-external.js test@example.com
```

### 2. Test Registration Flow
1. Open mobile app
2. Register a new account
3. Check server logs for:
   ```
   📧 Sending verification email to: user@example.com
   ✅ Verification email sent successfully to: user@example.com
   ```

### 3. Test Resend Verification
1. After registration, open verification modal
2. Click "Resend Code" button
3. Check server logs for:
   ```
   📧 Resending verification email to: user@example.com
   ✅ Verification email resent successfully to: user@example.com
   ```

## Debugging

### Check Server Logs
When you press "Resend Code" in the mobile app, you should see in server logs:

**Success:**
```
📧 Resend verification request for email: user@example.com
📧 Resending verification email to: user@example.com
📧 User: username
📧 Verification code: 12345
📧 Attempting to send verification email...
📧 To: user@example.com
✅ Verification email sent successfully!
📧 Accepted recipients: ['user@example.com']
✅ Verification email resent successfully to: user@example.com
```

**Failure:**
```
📧 Resend verification request for email: user@example.com
⚠️ Failed to resend verification email: [error message]
⚠️ Verification code for manual entry: 12345
```

### Check Mobile App Logs
In React Native debugger or Metro bundler console, you should see:

**Success:**
```
📧 Resending verification code to: user@example.com
📧 Resend verification response: { success: true, ... }
```

**Failure:**
```
❌ Resend verification failed: [error message]
```

## Common Issues

### Issue 1: Email Not Found
**Error:** "Энэ имэйл хаягтай хэрэглэгч олдсонгүй"

**Solution:**
- Make sure you're using the exact same email address used during registration
- Check if email was normalized (lowercase) during registration
- Verify user exists in database

### Issue 2: Email Already Verified
**Error:** "Имэйл хаяг аль хэдийн баталгаажсан байна"

**Solution:**
- User is already verified, no need to resend
- Check `user.emailVerified` in database

### Issue 3: Email Service Error
**Error:** "Имэйл илгээхэд алдаа гарлаа"

**Solution:**
- Check EMAIL_USER and EMAIL_PASS in config.env
- Verify Gmail App Password is correct
- Check server logs for specific error
- See EMAIL_TROUBLESHOOTING.md for detailed solutions

### Issue 4: Email Goes to Spam
**Solution:**
- Ask user to check spam folder
- Add sender email to contacts
- Check email headers (improved in latest update)

## Verification

After applying fixes, verify:

1. ✅ Registration sends email (check server logs)
2. ✅ Resend button sends email (check server logs)
3. ✅ Emails are accepted by server (check "Accepted recipients")
4. ✅ Emails arrive in inbox (not spam)
5. ✅ Verification code works when entered

## Next Steps

If emails still don't send:

1. **Check server logs** - Look for error messages
2. **Test with test script** - Verify email service works
3. **Check Gmail settings** - Ensure App Password is correct
4. **Check network** - Ensure server can reach Gmail SMTP
5. **Check rate limits** - Gmail has daily sending limits

## Files Modified

1. `server/routes/auth.js` - Enhanced resend verification endpoint
2. `server/services/emailService.js` - Better error handling and validation
3. `mobile-app/src/components/EmailVerificationModal.js` - Improved error handling

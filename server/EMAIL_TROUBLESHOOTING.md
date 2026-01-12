# Email Troubleshooting Guide - Gmail SMTP

## Problem: Emails Not Sending to Other Addresses

If emails work when sending to your own Gmail address but fail for other email addresses, this is typically a **Gmail security/configuration issue**, not a code problem.

## Common Causes & Solutions

### 1. Gmail "Less Secure App Access" (Deprecated)

**Note:** Gmail no longer supports "Less Secure App Access". You **MUST** use an **App Password**.

### 2. Using Regular Password Instead of App Password

**This is the most common issue!**

Gmail requires an **App Password** for SMTP authentication, not your regular Gmail password.

#### How to Generate Gmail App Password:

1. **Enable 2-Step Verification** (Required):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:
   - Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "CHATLI Server" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update config.env**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # Use the 16-character App Password
   ```

### 3. Gmail Blocking External Emails

Gmail may silently block emails to external addresses if:
- Your account is new
- You're sending too many emails
- Gmail detects suspicious activity

#### Solutions:

**A. Check Gmail Security Settings:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Review "Recent security activity"
3. Check for any security alerts

**B. Verify App Password is Correct:**
- Make sure you're using the App Password, not your regular password
- App Passwords are 16 characters (may have spaces - remove them)
- Regenerate if unsure

**C. Check Spam Folder:**
- Emails might be delivered but marked as spam
- Ask recipients to check spam/junk folder
- Add your email to their contacts

### 4. Gmail Daily Sending Limits

Gmail has limits on how many emails you can send:
- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2000 emails/day

If you exceed this, Gmail will block further emails.

### 5. Domain Authentication Issues

If sending from a custom domain, you need:
- SPF records
- DKIM records
- DMARC policy

For regular Gmail accounts, this is handled automatically.

## Testing Email Delivery

### Test 1: Send to Different Email Provider

Try sending to:
- Yahoo: `test@yahoo.com`
- Outlook: `test@outlook.com`
- Another Gmail: `test@gmail.com`

### Test 2: Check Server Logs

When sending an email, check the server console for:

```
✅ Verification email sent successfully!
📧 Accepted recipients: ['recipient@example.com']
📧 Rejected recipients: []
```

If you see emails in `rejected`, that's the problem.

### Test 3: Use Gmail Web Interface

Send a test email manually from Gmail web interface to the same address. If it works, the issue is with SMTP configuration.

## Code Improvements Made

The email service has been updated with:

1. **Better Error Handling**:
   - Checks if email was accepted by server
   - Logs rejected recipients
   - Validates email format

2. **Improved Headers**:
   - Added `replyTo` header
   - Added proper email headers
   - Better spam filter compliance

3. **Enhanced Logging**:
   - Shows accepted/rejected recipients
   - Logs verification codes
   - Better error messages

## Alternative Solutions

### Option 1: Use a Different Email Service

If Gmail continues to cause issues, consider:

**SendGrid** (Free tier: 100 emails/day):
```javascript
// In emailService.js, replace transporter with:
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

**Mailgun** (Free tier: 5,000 emails/month):
```javascript
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
```

**AWS SES** (Very cheap, pay per email):
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});
```

### Option 2: Use Google Workspace

Google Workspace (paid) has:
- Higher sending limits
- Better deliverability
- More reliable SMTP

### Option 3: Use a Transactional Email Service

Services like:
- **Resend** (modern, developer-friendly)
- **Postmark** (excellent deliverability)
- **Mailjet** (good free tier)

## Quick Checklist

- [ ] Using App Password (not regular password)
- [ ] 2-Step Verification enabled
- [ ] App Password is 16 characters (spaces removed)
- [ ] `EMAIL_USER` and `EMAIL_PASS` set correctly in `config.env`
- [ ] Server restarted after changing config
- [ ] Checked spam folder
- [ ] Tested with different email providers
- [ ] Checked server logs for errors
- [ ] Not exceeding Gmail daily limits

## Debugging Steps

1. **Test email service**:
   ```bash
   cd server
   node test-email.js
   ```

2. **Check server logs** when registering:
   - Look for "Accepted recipients"
   - Look for "Rejected recipients"
   - Check for error messages

3. **Try sending to your own email first**:
   - If it works, the service is configured correctly
   - If it fails, check App Password

4. **Try sending to a different email provider**:
   - If Gmail works but others don't, it's a Gmail security issue
   - If none work, check SMTP configuration

## Still Not Working?

1. **Check Gmail Activity**:
   - Go to [Gmail Activity](https://myaccount.google.com/security)
   - Look for blocked login attempts
   - Review security alerts

2. **Regenerate App Password**:
   - Delete old App Password
   - Generate new one
   - Update `config.env`

3. **Test with Different Email**:
   - Try with a different Gmail account
   - See if issue persists

4. **Contact Support**:
   - If using production, consider switching to a dedicated email service
   - Gmail SMTP is fine for development, but production apps should use transactional email services

## Expected Behavior

When working correctly, you should see in server logs:

```
📧 Attempting to send verification email...
📧 To: user@example.com
📧 From: your-email@gmail.com
✅ Verification email sent successfully!
📧 Accepted recipients: ['user@example.com']
📧 Rejected recipients: []
📧 Sent to: user@example.com
```

If you see emails in "Rejected recipients", that's where the problem is.

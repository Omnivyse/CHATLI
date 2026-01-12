# Setting Up Email on Railway

## Problem
You're seeing this error:
```
Email service not configured. Please check EMAIL_USER and EMAIL_PASS in config.env
```

This happens because **Railway doesn't use `config.env` files** - it uses environment variables set in the Railway dashboard.

## Solution: Set Environment Variables in Railway

### Step 1: Get Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Other (Custom name)"
5. Enter "CHATLI Railway" as the name
6. Click "Generate"
7. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### Step 2: Set Variables in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **CHATLI** project
3. Click on your **server service**
4. Go to the **Variables** tab
5. Click **"New Variable"**

Add these two variables:

**Variable 1:**
- **Name**: `EMAIL_USER`
- **Value**: `omnivyse@gmail.com` (or your Gmail address)
- Click **"Add"**

**Variable 2:**
- **Name**: `EMAIL_PASS`
- **Value**: `your-16-character-app-password` (remove spaces, e.g., `abcdefghijklmnop`)
- Click **"Add"**

### Step 3: Redeploy

After adding the variables:

1. Railway will automatically redeploy, OR
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment

### Step 4: Verify

1. Check Railway logs - you should see:
   ```
   ✅ Email service initialized and verified successfully
   📧 Email will be sent from: omnivyse@gmail.com
   ```

2. Test email sending:
   ```bash
   # In Railway, go to your service → Settings → Generate Shell
   # Or SSH into your Railway instance
   node test-email-external.js test@example.com
   ```

## Quick Checklist

- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password generated (16 characters)
- [ ] `EMAIL_USER` variable added in Railway
- [ ] `EMAIL_PASS` variable added in Railway (App Password, no spaces)
- [ ] Service redeployed
- [ ] Server logs show email service initialized

## Important Notes

1. **App Password, NOT Regular Password**:
   - ❌ Don't use your Gmail account password
   - ✅ Use the 16-character App Password

2. **Remove Spaces**:
   - App Password might show as: `abcd efgh ijkl mnop`
   - Use in Railway as: `abcdefghijklmnop` (no spaces)

3. **Railway vs Local**:
   - **Local**: Uses `server/config.env` file
   - **Railway**: Uses environment variables in dashboard
   - They are **separate** - setting in one doesn't affect the other

4. **After Adding Variables**:
   - Railway automatically redeploys
   - Check logs to verify email service initialized
   - Test with a registration to confirm emails send

## Troubleshooting

### Still Not Working?

1. **Check Railway Logs**:
   - Look for "Email service initialized" message
   - Check for "EMAIL_USER: ❌ Not set" warnings

2. **Verify Variables**:
   - Go to Railway → Variables tab
   - Make sure `EMAIL_USER` and `EMAIL_PASS` are listed
   - Check for typos in variable names

3. **Test App Password**:
   - Try generating a new App Password
   - Make sure it's exactly 16 characters (no spaces)

4. **Check Gmail Settings**:
   - Ensure 2-Step Verification is enabled
   - Check if Gmail is blocking the connection

## Expected Server Logs

**On Startup (Success):**
```
📧 Initializing email service...
📧 Email user: omnivyse@gmail.com
✅ Email service initialized and verified successfully
📧 Email will be sent from: omnivyse@gmail.com
EMAIL_USER: ✅ Set
EMAIL_PASS: ✅ Set (hidden)
```

**On Startup (Failure):**
```
⚠️ Email credentials not configured (EMAIL_USER or EMAIL_PASS missing)
EMAIL_USER: ❌ Not set
EMAIL_PASS: ❌ Not set
⚠️ WARNING: Email service is not configured!
```

## Security Best Practices

1. **Never commit `config.env`** to Git (it's in `.gitignore`)
2. **Use App Passwords** - more secure than regular passwords
3. **Rotate App Passwords** periodically
4. **Monitor email sending** - Gmail has daily limits

## Alternative: Use a Transactional Email Service

If Gmail continues to cause issues, consider:

- **SendGrid** (100 emails/day free)
- **Resend** (modern, developer-friendly)
- **Mailgun** (5,000 emails/month free)
- **AWS SES** (very cheap, pay per email)

These services are more reliable for production applications.

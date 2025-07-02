# 🚨 Upload Fix Guide - 500 Error

## Issue: File upload failing with 500 Internal Server Error

### Most Likely Cause: Missing Cloudinary Environment Variables in Railway

## ✅ Quick Fix Steps:

### 1. Check Railway Environment Variables
Go to [Railway Dashboard](https://railway.app/dashboard) → Your CHATLI Project → **Variables** tab

**Verify these variables are set:**
```
CLOUDINARY_CLOUD_NAME=dtwemkff6
CLOUDINARY_API_KEY=453282523491793
CLOUDINARY_API_SECRET=wAS4HfMyQtI3vrPC3cTPTWQpYys
```

### 2. If Variables Are Missing:
Click **"New Variable"** and add each one:

```
Name: CLOUDINARY_CLOUD_NAME
Value: dtwemkff6

Name: CLOUDINARY_API_KEY  
Value: 453282523491793

Name: CLOUDINARY_API_SECRET
Value: wAS4HfMyQtI3vrPC3cTPTWQpYys
```

### 3. Redeploy Railway
After adding variables:
- Railway will auto-redeploy (1-2 minutes)
- Or manually click "Deploy" → "Redeploy"

### 4. Test Upload
Try uploading an image after redeploy completes.

## 🔧 What I Fixed in Code:
- ✅ Auto-create upload directory if missing
- ✅ Better error handling for multer
- ✅ Improved file cleanup
- ✅ More detailed error logging
- ✅ Graceful error recovery

## 🎯 Expected Result:
After setting Cloudinary variables:
- ✅ Image uploads work
- ✅ Video uploads work  
- ✅ Files upload to Cloudinary cloud
- ✅ No more 500 errors

## 📞 If Still Not Working:
1. Check Railway logs for Cloudinary errors
2. Verify Cloudinary account is active
3. Make sure API keys are correct 
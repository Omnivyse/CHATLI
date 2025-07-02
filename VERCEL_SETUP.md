# Vercel Frontend Setup Guide

## 🚀 Connect Frontend to Railway Backend

Your backend is deployed at: `https://chatli-production.up.railway.app`

### 1. Update Vercel Environment Variables

Go to your **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables:

```
Name: REACT_APP_API_URL
Value: https://chatli-production.up.railway.app/api

Name: REACT_APP_SOCKET_URL  
Value: https://chatli-production.up.railway.app

Name: NODE_ENV
Value: production
```

### 2. Redeploy Frontend

After adding environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **"Redeploy"** on your latest deployment
3. Or push a new commit to trigger auto-deployment

### 3. Update Railway Backend

Make sure your Railway backend has the correct CORS settings:

In Railway dashboard → Your project → Variables, add/update:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 4. Test Connection

1. **Health Check:** Visit `https://chatli-production.up.railway.app/api/health`
2. **Frontend:** Your Vercel app should now connect to Railway backend
3. **Real-time:** Socket.IO should work for live messaging

### 🔧 Troubleshooting

**If connection fails:**
1. Check Vercel environment variables are set correctly
2. Verify Railway app is running (visit health endpoint)
3. Check browser console for CORS errors
4. Ensure Railway has correct FRONTEND_URL variable

**Common Issues:**
- CORS errors → Update FRONTEND_URL in Railway
- Socket connection fails → Check REACT_APP_SOCKET_URL
- API errors → Verify REACT_APP_API_URL

### ✅ Success Indicators

- Health endpoint returns: `{"success":true,"message":"Сервер ажиллаж байна"}`
- Frontend loads without API errors
- Real-time messaging works
- Login/register functions properly

Your full stack is now deployed! 🎉 
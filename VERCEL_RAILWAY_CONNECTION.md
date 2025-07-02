# 🔗 Connect Railway Backend with Vercel Frontend

## Step 1: Configure Vercel Environment Variables

### 1.1 Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your CHATLI project
3. Go to **Settings** tab
4. Click **Environment Variables** in the sidebar

### 1.2 Add These Environment Variables

Click **"Add New"** for each variable:

```
Name: REACT_APP_API_URL
Value: https://chatli-production.up.railway.app/api
Environment: Production, Preview, Development

Name: REACT_APP_SOCKET_URL
Value: https://chatli-production.up.railway.app
Environment: Production, Preview, Development

Name: NODE_ENV
Value: production
Environment: Production
```

### 1.3 Save and Redeploy
After adding variables:
- Click **"Save"**
- Go to **Deployments** tab
- Click **"Redeploy"** on your latest deployment

## Step 2: Configure Railway Backend CORS

### 2.1 Go to Railway Dashboard
1. Visit [railway.app/dashboard](https://railway.app/dashboard)
2. Click on your CHATLI project
3. Click **Variables** tab

### 2.2 Add/Update CORS Variables

Add your Vercel URL to allow frontend connections:

```
Name: FRONTEND_URL
Value: https://your-vercel-app.vercel.app

Name: CORS_ORIGIN
Value: https://your-vercel-app.vercel.app
```

**Replace `your-vercel-app` with your actual Vercel app name!**

## Step 3: Test the Connection

### 3.1 Backend Health Check
Visit: `https://chatli-production.up.railway.app/api/health`

Should return:
```json
{
  "success": true,
  "message": "Сервер ажиллаж байна",
  "timestamp": "2024-..."
}
```

### 3.2 Frontend Connection Test
1. Open your Vercel app
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Look for API connection messages
5. Try to login/register to test full connection

## Step 4: Troubleshooting Common Issues

### Issue 1: CORS Errors
**Symptoms:** Browser console shows CORS errors
**Fix:** 
- Update `FRONTEND_URL` in Railway with exact Vercel URL
- Make sure no trailing slash in URLs

### Issue 2: Socket.IO Connection Failed
**Symptoms:** Real-time features don't work
**Fix:**
- Verify `REACT_APP_SOCKET_URL` in Vercel
- Check Railway logs for socket errors

### Issue 3: API Calls Fail
**Symptoms:** Login, register, or other API calls fail
**Fix:**
- Check `REACT_APP_API_URL` in Vercel
- Verify Railway backend is running (health check)

## Step 5: Environment URL Examples

### Development (Local)
```
Frontend: http://localhost:3000
Backend: http://localhost:5000
API URL: http://localhost:5000/api
Socket URL: http://localhost:5000
```

### Production
```
Frontend: https://chatli-app.vercel.app
Backend: https://chatli-production.up.railway.app
API URL: https://chatli-production.up.railway.app/api
Socket URL: https://chatli-production.up.railway.app
```

## Step 6: Auto-Deployment Setup

### 6.1 Vercel Auto-Deploy
- Vercel automatically deploys when you push to GitHub
- Environment variables persist across deployments

### 6.2 Railway Auto-Deploy
- Railway automatically deploys when you push to GitHub
- Make sure to push both frontend and backend changes

## ✅ Success Checklist

- [ ] Environment variables added to Vercel
- [ ] CORS configured in Railway
- [ ] Backend health check returns success
- [ ] Frontend loads without console errors
- [ ] Login/register works
- [ ] Real-time messaging works
- [ ] File uploads work (if applicable)

## 🚀 Final Result

Once connected properly:
- **Frontend (Vercel):** Serves your React app globally
- **Backend (Railway):** Handles API, database, and real-time features
- **Database (MongoDB Atlas):** Stores all your data in the cloud
- **Files (Cloudinary):** Handles image/video uploads

Your full-stack CHATLI app will be live and accessible worldwide! 🌍 
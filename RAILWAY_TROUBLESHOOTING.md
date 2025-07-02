# Railway Deployment Troubleshooting

## 🚨 Current Issue: 502 Error

Your Railway app at `https://chatli-production.up.railway.app` is returning a 502 error, which means the application failed to respond.

## 🔍 Troubleshooting Steps

### 1. Check Railway Logs
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your project
3. Click on **"Logs"** tab
4. Look for error messages

### 2. Verify Environment Variables
Make sure these variables are set in Railway:
```
MONGODB_URI=mongodb+srv://Chatli:T8F%25Jt-reBp3%40hL@cluster0.txbmos3.mongodb.net/chatli?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=dtwemkff6
CLOUDINARY_API_KEY=453282523491793
CLOUDINARY_API_SECRET=wAS4HfMyQtI3vrPC3cTPTWQpYys
```

### 3. Check Build/Deploy Settings
In Railway project settings:
- **Build Command:** Should be `npm install`
- **Start Command:** Should be `npm start`
- **Root Directory:** Should be `/server` (if your server is in a subdirectory)

### 4. Common Issues & Fixes

#### Issue: Port Configuration
- Railway automatically assigns a PORT environment variable
- Make sure your `server.js` uses: `const PORT = process.env.PORT || 5000;`

#### Issue: Missing Dependencies
- Ensure all dependencies are in `package.json`
- Check if `npm install` runs successfully in logs

#### Issue: MongoDB Connection
- Verify MongoDB Atlas connection string is correct
- Check if IP whitelist includes Railway servers (use 0.0.0.0/0 for all IPs)

#### Issue: File Path Problems
- If server code is in `/server` folder, set Railway root directory to `server`
- Or move server files to project root

### 5. Quick Fixes to Try

1. **Redeploy:**
   - Go to Railway dashboard
   - Click "Deploy" → "Redeploy"

2. **Check MongoDB Atlas:**
   - Login to MongoDB Atlas
   - Go to Network Access
   - Add IP: `0.0.0.0/0` (allows all IPs)

3. **Verify package.json:**
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

### 6. Manual Testing
Try these URLs in browser:
- `https://chatli-production.up.railway.app` (should show something)
- `https://chatli-production.up.railway.app/api/health` (should return JSON)

## 🆘 If Still Not Working

1. **Check Railway Logs** for specific error messages
2. **Share the error logs** so I can help debug
3. **Verify MongoDB connection** is working
4. **Double-check environment variables** are set correctly

## 📞 Next Steps
Once you check the Railway logs, let me know what errors you see, and I'll help you fix them! 
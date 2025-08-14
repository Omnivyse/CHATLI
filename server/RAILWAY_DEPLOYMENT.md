# 🚂 Railway Deployment Guide for CHATLI Backend

## Overview
This guide helps you deploy the CHATLI backend to Railway and resolve common deployment issues.

## 🚀 Quick Deploy

### 1. **Connect to Railway**
- Go to [Railway.app](https://railway.app)
- Connect your GitHub repository
- Select the `server` folder as the source

### 2. **Environment Variables**
Set these environment variables in Railway:
```bash
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here
MONGODB_URI=your_mongodb_atlas_connection_string
RAILWAY_ENVIRONMENT=production
```

### 3. **Deploy**
- Railway will automatically detect the Node.js project
- It will run `npm install` and then `npm start`
- Monitor the build logs for any errors

## 🔧 Troubleshooting Common Issues

### **Issue: npm ci Error - Package Lock Out of Sync**
**Error**: `npm ci can only install packages when your package.json and package-lock.json are in sync`

**Solution**: 
1. The package-lock.json has been updated locally
2. Commit and push the updated files to GitHub
3. Railway will use the new lock file

### **Issue: Missing Dependencies**
**Error**: `Missing: dompurify@3.2.6 from lock file`

**Solution**: 
- All dependencies are now properly installed
- The package-lock.json has been regenerated
- Railway should now deploy successfully

### **Issue: Production Warning**
**Warning**: `npm warn config production Use --omit=dev instead`

**Solution**: 
- This is just a warning, not an error
- Railway will still deploy successfully
- The `.npmrc` file helps minimize this warning

## 📁 Important Files for Railway

### **Required Files**
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions
- `server.js` - Main application file
- `.npmrc` - NPM configuration
- `railway.json` - Railway-specific configuration

### **Configuration Files**
- `config.env` - Environment configuration
- `.dockerignore` - Build optimization

## 🚀 Build Process

### **What Railway Does**
1. **Detect**: Identifies Node.js project
2. **Install**: Runs `npm install --production=false`
3. **Build**: No build step needed for Node.js
4. **Start**: Runs `npm start` (which runs `node server.js`)

### **Build Commands**
```bash
# Railway automatically runs these:
npm install --production=false  # Install all dependencies
npm start                      # Start the application
```

## 🔍 Monitoring Deployment

### **Build Logs**
Watch for these success indicators:
```
✓ Installed 47 packages
✓ Found 0 vulnerabilities
✓ Starting server on port 5000
✓ MongoDB connected successfully
```

### **Health Check**
Railway will check: `/api/health`
- Should return 200 OK
- Confirms server is running

## 🛠️ Manual Troubleshooting

### **If Deployment Still Fails**

1. **Check Dependencies**
```bash
cd server
npm install
npm ls --depth=0
```

2. **Verify Package Lock**
```bash
rm package-lock.json
npm install
```

3. **Test Locally**
```bash
npm start
# Should start without errors
```

4. **Check Environment Variables**
- Ensure all required variables are set in Railway
- Check for typos in variable names

### **Common Environment Variables**
```bash
# Required
NODE_ENV=production
JWT_SECRET=your_secret
MONGODB_URI=your_mongodb_uri

# Optional but recommended
PORT=5000
RAILWAY_ENVIRONMENT=production
```

## 📊 Deployment Status

### **Success Indicators**
- ✅ Build completes without errors
- ✅ Health check returns 200 OK
- ✅ Application logs show successful startup
- ✅ MongoDB connection established

### **Failure Indicators**
- ❌ Build fails with dependency errors
- ❌ Application crashes on startup
- ❌ Health check fails
- ❌ Environment variable errors

## 🔄 Redeployment

### **Automatic Redeployment**
- Railway automatically redeploys on git push
- No manual intervention needed

### **Manual Redeployment**
- Go to Railway dashboard
- Click "Deploy" button
- Monitor build logs

### **Force Redeploy**
- Make a small change to any file
- Commit and push to GitHub
- Railway will trigger new deployment

## 📞 Support

### **Railway Support**
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### **Common Issues**
1. **Dependencies**: Always commit package-lock.json
2. **Environment Variables**: Double-check spelling
3. **Port Configuration**: Railway sets PORT automatically
4. **Build Time**: First build may take 5-10 minutes

## 🎯 Best Practices

### **For Development**
1. Test locally before pushing
2. Keep dependencies updated
3. Use exact versions in package.json

### **For Deployment**
1. Monitor build logs
2. Set all required environment variables
3. Test health check endpoint
4. Keep deployment logs for debugging

---

**Last Updated**: December 2024  
**Railway Version**: Latest  
**Node.js Version**: 18+  
**NPM Version**: 8+

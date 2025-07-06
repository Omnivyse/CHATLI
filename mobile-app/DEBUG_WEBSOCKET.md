# WebSocket Debugging Guide for Railway

## Quick Test Steps

### 1. Test Server Health
Visit these URLs in your browser:

**Health Check:**
```
https://chatli-production.up.railway.app/api/health
```

**Socket Health:**
```
https://chatli-production.up.railway.app/api/socket-health
```

**Socket Test:**
```
https://chatli-production.up.railway.app/api/socket-test
```

### 2. Test WebSocket Connection
Run the test script:
```bash
cd mobile-app
node test-socket.js
```

### 3. Check Mobile App Console
Open your mobile app and check the console logs for:
- ✅ Socket connected successfully
- 🔗 Socket ID: [some-id]
- 🔐 Authenticating socket with token...
- 😀 Adding reaction: [data]
- ✅ Reaction added successfully: [response]

## Common Issues and Solutions

### Issue 1: "Cannot connect to socket"
**Symptoms:** Socket connection fails immediately

**Solutions:**
1. Check if Railway service is running
2. Verify environment variables are set
3. Check CORS configuration
4. Try both WebSocket and polling transports

### Issue 2: "Socket connects but reactions don't update"
**Symptoms:** Socket connects successfully but reactions don't sync in real-time

**Solutions:**
1. Check if users are in the same chat room
2. Verify reaction events are being emitted
3. Check if reaction listeners are properly set up
4. Ensure chat room joining is working

### Issue 3: "Reactions work locally but not on Railway"
**Symptoms:** Everything works in development but not in production

**Solutions:**
1. Check Railway environment variables
2. Verify production URLs are correct
3. Check Railway logs for errors
4. Ensure HTTPS is being used

## Debugging Checklist

### Server Side
- [ ] Server is running on Railway
- [ ] Environment variables are set correctly
- [ ] CORS origins include your frontend URLs
- [ ] Socket.IO is properly configured
- [ ] Reaction event handlers are working
- [ ] Chat room joining is working

### Client Side
- [ ] Mobile app is using correct socket URL
- [ ] Socket connection is established
- [ ] User authentication is working
- [ ] Chat room joining is working
- [ ] Reaction event listeners are set up
- [ ] Reaction events are being emitted

### Network
- [ ] No firewall blocking WebSocket connections
- [ ] Railway service is accessible
- [ ] HTTPS is being used in production
- [ ] No proxy interfering with connections

## Railway-Specific Debugging

### Check Railway Logs
```bash
railway logs
```

Look for:
- Socket connection messages
- Reaction event logs
- Error messages
- Memory usage warnings

### Check Railway Variables
```bash
railway variables
```

Ensure these are set:
- `NODE_ENV=production`
- `RAILWAY_ENVIRONMENT=true`
- `FRONTEND_URL=https://your-frontend-url.com`

### Check Railway Status
Visit: https://status.railway.app/

## Testing Steps

### Step 1: Basic Connection Test
1. Open mobile app
2. Check console for connection logs
3. Verify socket ID is generated
4. Check if authentication works

### Step 2: Chat Room Test
1. Open a chat
2. Check if "Joined chat" message appears
3. Verify chat room is created

### Step 3: Reaction Test
1. Add a reaction to a message
2. Check console for reaction logs
3. Verify reaction is saved to database
4. Check if other users receive the reaction

### Step 4: Real-time Test
1. Open chat on two devices
2. Add reaction on one device
3. Check if reaction appears on other device
4. Verify reaction count updates

## Environment Variables Check

### Production (.env.production)
```bash
API_BASE_URL=https://chatli-production.up.railway.app/api
SOCKET_URL=https://chatli-production.up.railway.app
```

### Development (.env.development)
```bash
API_BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
```

## Console Log Analysis

### Good Logs (Everything Working)
```
🔌 Connecting to socket: https://chatli-production.up.railway.app
✅ Socket connected successfully
🔗 Socket ID: abc123
🔐 Authenticating socket with token...
😀 Adding reaction: {chatId: "123", messageId: "456", userId: "789", emoji: "❤️"}
✅ Reaction added successfully: {success: true}
```

### Bad Logs (Issues)
```
❌ Socket connection error: xhr poll error
⚠️ Cannot add reaction - socket not connected
🔌 User disconnected: transport close
```

## Railway $5 Plan Limitations

**What's Supported:**
- ✅ WebSocket connections
- ✅ Real-time messaging
- ✅ Reaction synchronization
- ✅ Up to 1000 concurrent connections

**Potential Issues:**
- ⚠️ Memory limitations (512MB)
- ⚠️ CPU sharing
- ⚠️ Bandwidth limits (100GB/month)

**If You Hit Limits:**
- Upgrade to Pro plan ($20/month)
- Implement connection pooling
- Add connection limits

## Still Having Issues?

1. **Check Railway Status:** https://status.railway.app/
2. **Contact Railway Support:** If issues persist
3. **Upgrade Plan:** Consider Pro plan for better support
4. **Alternative:** Consider other hosting providers (Heroku, DigitalOcean)

## Quick Fix Commands

```bash
# Restart Railway service
railway up

# Check logs
railway logs

# Check variables
railway variables

# Test connection
curl https://chatli-production.up.railway.app/api/socket-health
``` 
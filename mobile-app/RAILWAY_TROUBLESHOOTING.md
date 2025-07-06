# Railway WebSocket Troubleshooting Guide

## Railway $5 Basic Bundle WebSocket Support

Railway's $5 basic bundle **DOES support WebSocket connections**, but there are some limitations and configurations that need to be properly set up.

## Common Issues and Solutions

### 1. WebSocket Connection Fails

**Symptoms:**
- Socket connection errors in console
- Reactions not updating in real-time
- "Cannot connect to socket" messages

**Solutions:**

#### Check Railway Environment Variables
Make sure these are set in your Railway project:
```bash
NODE_ENV=production
RAILWAY_ENVIRONMENT=true
```

#### Verify Port Configuration
Railway automatically assigns ports. Make sure your server listens on the correct port:
```javascript
const PORT = process.env.PORT || 5000;
```

#### Check CORS Settings
Railway requires specific CORS configuration:
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://chatli.vercel.app',
      'https://chatli-mobile.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
};
```

### 2. Socket.IO Configuration for Railway

**Required Settings:**
```javascript
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, 'https://chatli.vercel.app', 'https://chatli-mobile.vercel.app'].filter(Boolean)
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:19006"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8,
  allowRequest: (req, callback) => {
    callback(null, true);
  }
});
```

### 3. Mobile App Socket Configuration

**Required Settings:**
```javascript
this.socket = io(socketURL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: true,
  upgrade: true,
  rememberUpgrade: false,
  path: '/socket.io/',
  withCredentials: true,
  extraHeaders: {
    'User-Agent': 'Chatli-Mobile-App'
  }
});
```

### 4. Environment Variables for Mobile App

**Production (.env.production):**
```bash
API_BASE_URL=https://chatli-production.up.railway.app/api
SOCKET_URL=https://chatli-production.up.railway.app
```

**Development (.env.development):**
```bash
API_BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
```

### 5. Testing WebSocket Connection

#### Server Health Check
Visit: `https://your-railway-app.up.railway.app/api/socket-health`

Expected response:
```json
{
  "success": true,
  "message": "WebSocket сервер ажиллаж байна",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "socketConnections": 0,
  "connectedUsers": [],
  "environment": "production",
  "railway": true
}
```

#### Client Connection Test
Check console logs for:
- ✅ Socket connected successfully
- 🔗 Socket ID: [some-id]
- 🔐 Authenticating socket with token...

### 6. Railway-Specific Limitations

**$5 Basic Bundle Limits:**
- **Concurrent Connections:** Up to 1000 (should be sufficient for most apps)
- **Memory:** 512MB RAM
- **CPU:** Shared resources
- **Bandwidth:** 100GB/month

**If you hit limits:**
- Upgrade to Pro plan ($20/month)
- Implement connection pooling
- Add connection limits in your code

### 7. Debugging Steps

1. **Check Railway Logs:**
   ```bash
   railway logs
   ```

2. **Check Socket Health:**
   ```bash
   curl https://your-app.up.railway.app/api/socket-health
   ```

3. **Test with Simple Client:**
   ```javascript
   const socket = io('https://your-app.up.railway.app');
   socket.on('connect', () => console.log('Connected!'));
   ```

4. **Check Environment Variables:**
   ```bash
   railway variables
   ```

### 8. Common Railway Errors

**"Transport closed"**
- Usually means Railway is restarting the service
- Implement proper reconnection logic

**"Connection timeout"**
- Increase timeout values
- Check if Railway service is healthy

**"CORS error"**
- Verify CORS origins are correct
- Check if using HTTPS in production

### 9. Performance Optimization

**For Railway $5 Plan:**
```javascript
// Limit concurrent connections
const MAX_CONNECTIONS = 500;
if (connectionCount >= MAX_CONNECTIONS) {
  socket.disconnect();
  return;
}

// Implement connection cleanup
setInterval(() => {
  // Clean up stale connections
}, 30000);
```

### 10. Monitoring

**Add to your Railway app:**
```javascript
// Monitor connection count
setInterval(() => {
  console.log(`📊 Active connections: ${connectionCount}`);
  console.log(`💾 Memory usage: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`);
}, 60000);
```

## Still Having Issues?

1. Check Railway status: https://status.railway.app/
2. Verify your Railway plan supports WebSockets
3. Contact Railway support if issues persist
4. Consider upgrading to Pro plan for better WebSocket support

## Quick Fix Checklist

- [ ] Environment variables set correctly
- [ ] CORS origins include your frontend URLs
- [ ] Socket.IO configured for Railway
- [ ] Mobile app using correct socket URL
- [ ] Server listening on `process.env.PORT`
- [ ] Railway service is running and healthy
- [ ] No firewall or proxy blocking WebSocket connections 
# Real-time Reaction Debugging Guide

## Problem Description
User 1 (mobile) and User 2 (web) are in a chat. When User 2 reacts to User 1's message, User 1 doesn't see the reaction in real-time, but it appears after navigating back to chat list and returning to the chat.

## Root Cause Analysis
This indicates that:
1. ✅ Data is being saved correctly (reaction appears after navigation)
2. ❌ Real-time WebSocket events are not reaching the mobile user
3. ❌ Chat room joining or event broadcasting is not working properly

## Debugging Steps

### Step 1: Check Socket Connection Status

**In Mobile App Console, look for:**
```
🔌 Setting up socket for chat: [chatId]
✅ Socket connected successfully
🎯 Joining chat room: [chatId]
✅ Chat room joined successfully: {chatId: "...", userId: "...", timestamp: "..."}
```

**If you see errors like:**
```
⚠️ Socket not ready, attempting to connect...
❌ Failed to join chat room after retries
```

### Step 2: Check Server Logs

**In Railway logs, look for:**
```
🎯 User joined chat: [chatId]
👥 Users in chat room: 2
🔥 REACTION ADDED: ❤️ to message [messageId] in chat [chatId] by user [userName]
👥 User IDs in chat room: [socketId1, socketId2]
✅ Reaction broadcasted successfully to 2 users
```

**If you see:**
```
👥 Users in chat room: 1
```
This means only one user is in the chat room.

### Step 3: Test Real-time Connection

Run the test script:
```bash
cd mobile-app
node test-realtime.js
```

Expected output:
```
📱 User 1 (Mobile) connected: [socketId1]
💻 User 2 (Web) connected: [socketId2]
📱 User 1 joined chat: {chatId: "test-chat-123", ...}
💻 User 2 joined chat: {chatId: "test-chat-123", ...}
💻 User 2 adding reaction...
📱 User 1 received reaction: {chatId: "test-chat-123", messageId: "test-message-456", ...}
```

### Step 4: Check Environment Variables

**Verify mobile app environment:**
```bash
# .env.production
API_BASE_URL=https://chatli-production.up.railway.app/api
SOCKET_URL=https://chatli-production.up.railway.app
```

**Verify server environment:**
```bash
# Railway variables
NODE_ENV=production
RAILWAY_ENVIRONMENT=true
FRONTEND_URL=https://your-frontend-url.com
```

## Common Issues and Solutions

### Issue 1: Mobile User Not Joining Chat Room

**Symptoms:**
- Mobile console shows "Socket connected" but no "Chat room joined"
- Server logs show only 1 user in chat room

**Solutions:**
1. Check if mobile app is calling `socketService.joinChat(chatId)`
2. Verify chat ID is correct
3. Check if socket is ready before joining

### Issue 2: Events Not Broadcasting to All Users

**Symptoms:**
- Server logs show multiple users in room but reactions don't sync
- Web user sees reactions but mobile doesn't

**Solutions:**
1. Check if using `io.to()` instead of `socket.to()`
2. Verify chat room name format: `chat_${chatId}`
3. Check if users are in the same room

### Issue 3: Mobile App Not Receiving Events

**Symptoms:**
- Server logs show events being broadcasted
- Mobile console shows no reaction events received

**Solutions:**
1. Check if event listeners are properly set up
2. Verify event names match exactly
3. Check if socket connection is stable

### Issue 4: Railway-Specific Issues

**Symptoms:**
- Works locally but not on Railway
- Intermittent connection issues

**Solutions:**
1. Check Railway service health
2. Verify environment variables
3. Check Railway logs for errors
4. Consider upgrading to Pro plan

## Testing Checklist

### Mobile App Testing
- [ ] Socket connects successfully
- [ ] User authenticates properly
- [ ] Chat room join is confirmed
- [ ] Reaction events are received
- [ ] UI updates in real-time

### Server Testing
- [ ] Users join chat room successfully
- [ ] Reaction events are processed
- [ ] Events are broadcasted to all users
- [ ] Chat room contains correct users

### Network Testing
- [ ] WebSocket connection is stable
- [ ] No firewall blocking connections
- [ ] Railway service is accessible
- [ ] HTTPS is working properly

## Debugging Commands

### Check Server Health
```bash
curl https://chatli-production.up.railway.app/api/socket-health
```

### Check Railway Logs
```bash
railway logs
```

### Test WebSocket Connection
```bash
cd mobile-app
node test-socket.js
```

### Test Real-time Reactions
```bash
cd mobile-app
node test-realtime.js
```

## Console Log Analysis

### Good Logs (Everything Working)
```
🔌 Setting up socket for chat: abc123
✅ Socket connected successfully
🎯 Joining chat room: abc123
✅ Chat room joined successfully: {chatId: "abc123", ...}
🔥 CLIENT: Adding reaction: ❤️ to message: def456
😀 Adding reaction: {chatId: "abc123", messageId: "def456", ...}
✅ Reaction added acknowledgment: {success: true, ...}
Received reaction_added event: {chatId: "abc123", messageId: "def456", ...}
```

### Bad Logs (Issues)
```
⚠️ Socket not ready, attempting to connect...
❌ Failed to join chat room after retries
⚠️ Cannot add reaction - socket not connected
```

## Quick Fixes

### Fix 1: Force Reconnect
```javascript
// In mobile app
socketService.forceReconnect();
```

### Fix 2: Rejoin Chat Room
```javascript
// In mobile app
socketService.leaveChat(chatId);
setTimeout(() => {
  socketService.joinChat(chatId);
}, 1000);
```

### Fix 3: Restart Railway Service
```bash
railway up
```

## Still Having Issues?

1. **Check Railway Status:** https://status.railway.app/
2. **Run Test Scripts:** Use the provided test scripts
3. **Check Console Logs:** Look for specific error messages
4. **Contact Support:** If issues persist

## Expected Behavior

**When User 2 (web) reacts to User 1's (mobile) message:**
1. User 2 clicks reaction
2. Server receives `add_reaction` event
3. Server broadcasts `reaction_added` to all users in chat room
4. User 1 (mobile) receives `reaction_added` event
5. User 1's mobile app updates UI immediately
6. Reaction appears in real-time without navigation

**If this doesn't happen, follow the debugging steps above.** 
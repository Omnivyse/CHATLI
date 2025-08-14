# 📱 Mobile App JWT Token Compatibility Guide

## 🚨 Problem Solved

The mobile app was getting **"Token missing required claims"** errors because the enhanced security system expects JWT tokens with additional claims (`jti`, `aud`, `iss`) that older tokens don't have.

## ✅ Solution Implemented

### **Backward Compatibility**
- **Old tokens** (without new claims) are now accepted with warnings
- **New tokens** (with all claims) are validated strictly
- **Automatic claim addition** for legacy tokens

### **New API Endpoints**
- `POST /api/auth/refresh` - Refresh tokens using refresh token
- `POST /api/auth/validate` - Validate existing token and get new one if needed

## 🔧 How It Works

### **1. Token Validation Flow**
```
Mobile App → API Request → Auth Middleware → Token Check
                                    ↓
                            [Backward Compatibility]
                                    ↓
                    Old Token → Add Missing Claims → Accept
                    New Token → Validate All Claims → Accept/Reject
```

### **2. Claim Requirements**
- **Required**: `userId` (or `id`)
- **New Tokens**: `jti`, `aud`, `iss` (strictly validated)
- **Old Tokens**: Missing claims are automatically added

## 📱 Mobile App Implementation

### **Option 1: Automatic Token Refresh (Recommended)**

```javascript
// In your API service
class ApiService {
  constructor() {
    this.baseURL = 'https://chatli-production.up.railway.app/api';
    this.token = null;
    this.refreshToken = null;
  }

  // Enhanced request method with automatic token refresh
  async request(endpoint, options = {}) {
    try {
      // Add token to headers
      if (this.token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${this.token}`
        };
      }

      // Make request
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      
      if (response.status === 401) {
        // Token might be invalid - try to refresh
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry request with new token
          options.headers['Authorization'] = `Bearer ${this.token}`;
          return await fetch(`${this.baseURL}${endpoint}`, options);
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.data.token;
        this.refreshToken = data.data.refreshToken;
        
        // Store new tokens
        await this.storeTokens(this.token, this.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }

  // Validate and potentially refresh token
  async validateToken() {
    try {
      if (!this.token) return false;

      const response = await fetch(`${this.baseURL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data.needsRefresh) {
          // Token is valid but missing claims - update with new token
          this.token = data.data.token;
          this.refreshToken = data.data.refreshToken;
          await this.storeTokens(this.token, this.refreshToken);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
    }
    
    return false;
  }
}
```

### **Option 2: Simple Token Check**

```javascript
// Simple approach - just check if token works
async function checkTokenValidity() {
  try {
    const response = await fetch('https://chatli-production.up.railway.app/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token is invalid - redirect to login
      redirectToLogin();
    } else {
      // Token is valid - continue
      return true;
    }
  } catch (error) {
    console.error('Token check failed:', error);
    return false;
  }
}
```

## 🔄 Token Lifecycle Management

### **1. App Startup**
```javascript
async function initializeApp() {
  // Load stored tokens
  const tokens = await loadStoredTokens();
  
  if (tokens.accessToken) {
    // Validate existing token
    const isValid = await validateToken();
    
    if (!isValid) {
      // Token is invalid - redirect to login
      redirectToLogin();
      return;
    }
  } else {
    // No tokens - redirect to login
    redirectToLogin();
    return;
  }
  
  // App is ready
  startApp();
}
```

### **2. Before API Calls**
```javascript
async function makeApiCall() {
  // Check if token is about to expire
  if (isTokenExpiringSoon()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      redirectToLogin();
      return;
    }
  }
  
  // Make API call
  const response = await apiService.request('/some-endpoint');
  // Handle response...
}
```

### **3. Token Storage**
```javascript
// Secure token storage
async function storeTokens(accessToken, refreshToken) {
  try {
    // Store in secure storage (AsyncStorage, Keychain, etc.)
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    // Store expiration time
    const decoded = jwt_decode(accessToken);
    await AsyncStorage.setItem('tokenExpiry', decoded.exp.toString());
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

async function loadStoredTokens() {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Failed to load tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
}
```

## 🚀 Immediate Fix for Existing Users

### **1. Force Token Refresh**
```javascript
// Call this when user opens the app
async function forceTokenRefresh() {
  try {
    const response = await fetch('https://chatli-production.up.railway.app/api/auth/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data.needsRefresh) {
        // Update tokens
        updateTokens(data.data.token, data.data.refreshToken);
        console.log('✅ Tokens refreshed successfully');
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}
```

### **2. Handle 401 Errors Gracefully**
```javascript
// In your API interceptor
if (response.status === 401) {
  const errorData = await response.json();
  
  if (errorData.code === 'TOKEN_INVALID_CLAIMS') {
    // Token is valid but missing claims - try to refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request
      return retryOriginalRequest();
    }
  }
  
  // Other 401 errors - redirect to login
  redirectToLogin();
}
```

## 📊 Testing

### **1. Test Token Compatibility**
```bash
cd server
npm run test:token
```

### **2. Test API Endpoints**
```bash
# Test token validation
curl -X POST https://chatli-production.up.railway.app/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test token refresh
curl -X POST https://chatli-production.up.railway.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## 🔍 Monitoring

### **1. Server Logs**
Look for these log messages:
- `⚠️ Old token format detected` - Legacy tokens being used
- `🔐 User authenticated` - Successful authentication
- `🚫 Token missing required claims` - Invalid tokens (should be rare now)

### **2. Mobile App Logs**
Monitor for:
- Token refresh attempts
- 401 errors
- Successful API calls after token refresh

## 🎯 Success Criteria

- ✅ **No more "Token missing required claims" errors**
- ✅ **Existing users can continue using the app**
- ✅ **New users get enhanced security tokens**
- ✅ **Automatic token refresh works**
- ✅ **Backward compatibility maintained**

## 🚨 Emergency Rollback

If issues persist, you can temporarily disable enhanced validation:

```javascript
// In auth middleware - comment out strict validation
// if (decoded.aud !== 'chatli-app') {
//   return res.status(401).json({ ... });
// }
```

## 📞 Support

### **If Issues Persist**
1. Check server logs for authentication errors
2. Verify mobile app is calling the right endpoints
3. Test token validation endpoint manually
4. Check if tokens are being stored correctly

### **Common Issues**
- **Token not stored**: Check AsyncStorage/Keychain implementation
- **Refresh token missing**: Ensure login response includes refresh token
- **Network errors**: Verify API endpoint URLs are correct

---

**Last Updated**: December 2024  
**Status**: ✅ Backward Compatibility Implemented  
**Mobile App Ready**: Yes

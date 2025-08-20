import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback API URLs if environment variables are not loaded
const FALLBACK_API_URL = 'https://chatli-production.up.railway.app/api';
const FALLBACK_DEV_API_URL = 'http://localhost:5000/api';

// Try to import environment variables, fallback to hardcoded values
let API_BASE_URL, DEV_API_URL;

try {
  const env = require('@env');
  API_BASE_URL = env.API_BASE_URL;
  DEV_API_URL = env.DEV_API_URL;
} catch (error) {
  console.log('⚠️ Environment variables not loaded, using fallback URLs');
  API_BASE_URL = FALLBACK_API_URL;
  DEV_API_URL = FALLBACK_DEV_API_URL;
}

// Use environment variable or fallback to production URL
const getApiUrl = () => {
  // In development, prefer DEV_API_URL if available, otherwise use API_BASE_URL
  if (__DEV__ && DEV_API_URL && DEV_API_URL !== 'http://localhost:5000/api') {
    console.log('🔧 Development mode: Using DEV_API_URL:', DEV_API_URL);
    return DEV_API_URL;
  }
  
  // In production or if no dev URL, use API_BASE_URL
  console.log('🚀 Production mode: Using API_BASE_URL:', API_BASE_URL);
  return API_BASE_URL || FALLBACK_API_URL;
};

const API_URL = getApiUrl();

// Debug: Log the API URL being used (only in development)
if (__DEV__) {
  console.log('🔗 Mobile App API URL:', API_URL);
  console.log('🔗 Environment:', __DEV__ ? 'Development' : 'Production');
}

// Global flag to prevent recursive token clearing
let isClearingToken = false;

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.token = null;
    this.onTokenExpiration = null; // Callback for token expiration
    this.initializeToken();
  }

  // Set global token expiration handler
  setTokenExpirationHandler(handler) {
    this.onTokenExpiration = handler;
  }

  async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (this.token) {
        // Validate the token immediately
        if (this.isTokenExpired(this.token)) {
          if (__DEV__) {
            console.log('🔐 Stored token is expired, attempting refresh...');
          }
          
          // Try to refresh the token
          if (refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
              if (__DEV__) {
                console.log('🔐 Token refresh failed, clearing all tokens');
              }
              await this.clearToken();
            }
          } else {
            if (__DEV__) {
              console.log('🔐 No refresh token available, clearing expired token');
            }
            await this.clearToken();
          }
        } else {
          if (__DEV__) console.log('🔍 Valid token found in storage');
        }
      } else {
        if (__DEV__) console.log('ℹ️ No token found in storage');
      }
    } catch (error) {
      if (__DEV__) console.error('Error initializing token:', error);
      // Clear token on error
      await this.clearToken();
    }
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('token', token);
    } else {
      await AsyncStorage.removeItem('token');
    }
  }

  async clearToken() {
    // Prevent recursive calls
    if (isClearingToken) {
      if (__DEV__) console.log('🔐 Already clearing token, skipping...');
      return;
    }
    
    isClearingToken = true;
    
    try {
      this.token = null;
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      
      // Call global token expiration handler if set (only once)
      if (this.onTokenExpiration && !isClearingToken) {
        this.onTokenExpiration();
      }
    } finally {
      isClearingToken = false;
    }
  }

  // Store both access and refresh tokens
  async storeTokens(accessToken, refreshToken) {
    this.token = accessToken;
    if (accessToken) {
      await AsyncStorage.setItem('token', accessToken);
    } else {
      await AsyncStorage.removeItem('token');
    }
    
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    } else {
      await AsyncStorage.removeItem('refreshToken');
    }
  }

  // Get refresh token from storage
  async getRefreshToken() {
    return await AsyncStorage.getItem('refreshToken');
  }

  // Refresh access token using refresh token
  async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        if (__DEV__) console.log('🔐 No refresh token available');
        return false;
      }

      if (__DEV__) console.log('🔄 Refreshing access token...');
      
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Refresh-Token': refreshToken
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success && data.data.token) {
        if (__DEV__) console.log('✅ Access token refreshed successfully');
        await this.storeTokens(data.data.token, data.data.refreshToken || refreshToken);
        return true;
      } else {
        if (__DEV__) console.log('❌ Failed to refresh token:', data.message);
        await this.clearToken();
        return false;
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Token refresh error:', error);
      await this.clearToken();
      return false;
    }
  }

  // Check if token is expired (basic JWT expiration check)
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        if (__DEV__) console.log('🔐 Invalid token format');
        return true;
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      
      if (__DEV__) {
        console.log('🔐 Token payload:', {
          exp: payload.exp,
          iat: payload.iat,
          currentTime: Math.floor(Date.now() / 1000),
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          issuedAt: new Date(payload.iat * 1000).toISOString()
        });
      }
      
      // Check if token has expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        if (__DEV__) {
          console.log('🔐 Token expired at:', new Date(payload.exp * 1000));
        }
        return true;
      }
      
      return false;
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking token expiration:', error);
      }
      return true; // Consider invalid tokens as expired
    }
  }

  // Validate and clean token before use
  async validateToken() {
    if (this.token && this.isTokenExpired(this.token)) {
      if (__DEV__) {
        console.log('🔐 Stored token is expired, clearing it');
      }
      await this.clearToken();
      return false;
    }
    return !!this.token;
  }

  // Proactively refresh token if it's close to expiring
  async ensureValidToken() {
    if (!this.token) return false;
    
    try {
      // Check if token expires in the next 5 minutes
      const parts = this.token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const expiresIn = payload.exp - (Date.now() / 1000);
      
      if (expiresIn < 300) { // Less than 5 minutes
        if (__DEV__) {
          console.log('🔄 Token expires soon, refreshing proactively...');
        }
        return await this.refreshAccessToken();
      }
      
      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking token expiration:', error);
      }
      return false;
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Validate token before using it
    if (this.token && !this.isTokenExpired(this.token)) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.token) {
      // Token is expired, clear it asynchronously to prevent loops
      setTimeout(() => {
        this.clearToken();
      }, 0);
    }
    
    return headers;
  }

  // Get headers with proactive token validation
  async getValidHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Ensure token is valid before using it
    if (await this.ensureValidToken()) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}, retryCount = 3) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get valid headers with proactive token validation
    const headers = await this.getValidHeaders();
    
    const config = {
      method: 'GET',
      headers: { ...headers, ...options.headers },
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    if (__DEV__) {
      console.log('🌐 Making request:', {
        url,
        method: config.method,
        headers: config.headers,
        body: config.body ? 'Present' : 'None'
      });
    }

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        if (__DEV__) {
          console.log(`🌐 Making request to: ${url} (attempt ${attempt + 1})`);
        }

        const response = await fetch(url, config);
        if (__DEV__) {
          console.log('🌐 Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
        }
        
        const data = await response.json();
        if (__DEV__) {
          console.log('🌐 Response data:', data);
        }

        if (!response.ok) {
          // Handle rate limiting - don't retry
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after') || data.retryAfter || 900;
            const minutes = Math.ceil(retryAfter / 60);
            throw new Error(`Rate limited. Please try again in ${minutes} minutes.`);
          }
          
          // Handle token expiration immediately - don't retry
          if (response.status === 401) {
            if (__DEV__) {
              console.log('🔐 Token expired or invalid, attempting refresh...');
            }
            
            // Try to refresh the token
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              if (__DEV__) {
                console.log('🔄 Token refreshed, retrying request...');
              }
              // Update headers with new token and retry once
              const newHeaders = await this.getValidHeaders();
              config.headers = { ...newHeaders, ...options.headers };
              const retryResponse = await fetch(url, config);
              const retryData = await retryResponse.json();
              
              if (!retryResponse.ok) {
                throw new Error(retryData.message || `HTTP ${retryResponse.status}`);
              }
              
              return retryData;
            } else {
              if (__DEV__) {
                console.log('🔐 Token refresh failed, clearing token');
              }
              await this.clearToken();
              throw new Error('Token has expired');
            }
          }
          
                     // Handle input validation errors specifically
           if (response.status === 400 && (data.message?.includes('Оролтын алдаа') || data.message?.includes('Input Error'))) {
             console.error('🔍 Input validation error from server:', data);
             
             // Check for specific field validation errors
             if (data.errors && Array.isArray(data.errors)) {
               const fieldErrors = data.errors.map(err => `${err.path}: ${err.msg}`).join(', ');
               throw new Error(`Validation failed: ${fieldErrors}`);
             }
             
             throw new Error(data.message || 'Input validation failed');
           }
          
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
      } catch (error) {
        if (__DEV__) {
          console.error(`API Error (attempt ${attempt + 1}):`, {
            url,
            error: error.message,
            status: error.status
          });
        }

        // Don't retry on token expiration, auth errors, or rate limiting
        if (error.message.includes('Token has expired') || 
            error.message.includes('401') || 
            error.message.includes('Rate limited')) {
          throw error;
        }

        if (attempt === retryCount - 1) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        if (__DEV__) {
          console.log(`Retrying in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (response.success && response.data.token) {
      await this.storeTokens(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  async register(name, username, email, password) {
    if (__DEV__) {
      console.log('📡 API Service: register called with:', { 
        name: name ? `${name.substring(0, 3)}***` : 'empty', 
        username: username ? `${username.substring(0, 3)}***` : 'empty', 
        email: email ? `${email.substring(0, 3)}***` : 'empty', 
        passwordLength: password?.length || 0 
      });
    }
    
    // Additional validation before sending to API
    if (!name || !username || !email || !password) {
      throw new Error('All fields are required');
    }
    
    if (name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    if (username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: { name: name.trim(), username: username.trim(), email: email.trim(), password }
      });

      if (__DEV__) {
        console.log('📡 API Service: register response:', response);
      }

      if (response.success && response.data.token) {
        await this.storeTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error) {
      if (__DEV__) {
        console.error('📡 API Service: register error:', error);
      }
      // Re-throw the error with more context
      if (error.message.includes('Оролтын алдаа') || error.message.includes('Input Error')) {
        throw new Error('Registration failed: Please check your input data. Make sure all fields are filled correctly.');
      }
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // when token is already invalidated (e.g., after password change)
      if (__DEV__) console.log('Logout API call failed (expected if token invalidated):', error.message);
      // Always clear token even if logout fails
    } finally {
      await this.clearToken();
    }
  }

  // Email verification
  async verifyEmail(email, code) {
    if (__DEV__) {
      console.log('🔐 Verifying email with code:', code, 'for email:', email);
    }

    const response = await this.request('/auth/verify-email', {
      method: 'POST',
      body: { email, code }
    });

    if (__DEV__) {
      console.log('📧 Email verification response:', response);
    }

    // If verification successful, set the token for automatic login
    if (response.success && response.data.token) {
      if (__DEV__) console.log('✅ Setting token after successful verification');
      await this.storeTokens(response.data.token, response.data.refreshToken);
    } else {
      if (__DEV__) console.log('❌ No token in verification response');
    }

    return response;
  }

  async resendVerificationCode(email) {
    try {
      const response = await this.request('/auth/resend-verification', {
        method: 'POST',
        body: { email }
      });
      return response;
    } catch (error) {
      if (__DEV__) console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Forgot password functionality
  async forgotPassword(email) {
    try {
      const response = await this.request('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      return response;
    } catch (error) {
      if (__DEV__) console.error('Forgot password error:', error);
      throw error;
    }
  }

  async verifyResetCode(email, code) {
    try {
      const response = await this.request('/auth/verify-reset-code', {
        method: 'POST',
        body: { email, code }
      });
      return response;
    } catch (error) {
      if (__DEV__) console.error('Verify reset code error:', error);
      throw error;
    }
  }

  async resetPassword(email, resetToken, newPassword) {
    if (__DEV__) {
      console.log('🔄 API: Resetting password with token:', resetToken);
    }

    try {
      const response = await this.request('/auth/reset-password', {
        method: 'POST',
        body: { email, resetToken, newPassword }
      });

      if (__DEV__) {
        console.log('🔄 API: Reset password response:', response);
      }

      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ API: Reset password error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    if (__DEV__) {
      console.log('🔄 API: Changing password...');
    }

    try {
      const response = await this.request('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      });

      if (__DEV__) {
        console.log('🔄 API: Change password response:', response);
      }

      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ API: Change password error:', error);
      throw error;
    }
  }

  async getPrivacySettings() {
    try {
      const response = await this.request('/auth/privacy-settings', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      if (__DEV__) console.error('Get privacy settings error:', error);
      throw error;
    }
  }

  async updatePrivacySettings(settings) {
    return this.request('/auth/privacy-settings', {
      method: 'PUT',
      body: settings
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updatePushToken(pushToken) {
    return this.request('/auth/push-token', {
      method: 'PUT',
      body: { pushToken },
    });
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async deleteAccount(password) {
    return this.request('/auth/delete-account', {
      method: 'DELETE',
      body: { password },
    });
  }

  // Chat endpoints
  async getChats() {
    return this.request('/chats');
  }

  async getChat(chatId) {
    return this.request(`/chats/${chatId}`);
  }

  async createChat(chatData) {
    return this.request('/chats', {
      method: 'POST',
      body: chatData,
    });
  }

  async getMessages(chatId, page = 1, limit = 50) {
    // Note: Getting messages automatically marks them as read on the backend
    return this.request(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(chatId, messageData) {
    if (__DEV__) {
      console.log('📤 Sending message:', {
        chatId,
        messageData,
        token: this.token ? 'Present' : 'Missing'
      });
    }
    
    try {
      const response = await this.request(`/chats/${chatId}/messages`, {
        method: 'POST',
        body: messageData, // The request method will handle JSON.stringify
      });
      
              if (__DEV__) {
          console.log('✅ Message sent successfully:', response);
        }
      
      return response;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Send message error details:', {
          chatId,
          messageData,
          error: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  async editMessage(chatId, messageId, newText) {
    return this.request(`/chats/${chatId}/messages/${messageId}`, {
      method: 'PUT',
      body: { content: { text: newText } },
    });
  }

  async deleteMessage(chatId, messageId) {
    return this.request(`/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async deleteChat(chatId) {
    return this.request(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  // This endpoint doesn't exist on the backend - messages are marked as read automatically when fetched
  async markChatAsRead(chatId) {
    // Just return success since the backend handles this automatically when getting messages
    return { success: true };
  }

  // Post endpoints
  async getPosts(page = 1) {
    return this.request(`/posts?page=${page}`);
  }

  async getTopWeeklyPosts() {
    return this.request('/posts/top-weekly');
  }

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: postData,
    });
  }

  async verifySecretPostPassword(postId, password) {
    return this.request(`/posts/${postId}/verify-password`, {
      method: 'POST',
      body: { password },
    });
  }

  async likePost(postId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async commentOnPost(postId, content) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content },
    });
  }

  async getComments(postId) {
    // Comments are included in the post data, so we get the single post
    return this.request(`/posts/${postId}`);
  }

  async addComment(postId, content) {
    return this.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: { content },
    });
  }

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async hidePost(postId, isHidden) {
    return this.request(`/posts/${postId}/hide`, {
      method: 'PATCH',
      body: { isHidden },
    });
  }

  // Notification endpoints
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId) {
    // Validate notification ID
    if (!notificationId || notificationId === 'undefined' || notificationId === undefined) {
      if (__DEV__) console.error('Invalid notification ID provided:', notificationId);
      throw new Error('Invalid notification ID');
    }
    
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST',
    });
  }

  // User search
  async searchUsers(query) {
    return this.request(`/auth/users/search?q=${encodeURIComponent(query)}`);
  }

  // Get user profile by ID
  async getUserProfile(userId) {
    return this.request(`/auth/users/${userId}`);
  }

  // Get user posts by user ID
  async getUserPosts(userId) {
    return this.request(`/posts/user/${userId}`);
  }

  // Follow system
  async followUser(userId) {
    return this.request(`/auth/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId) {
    return this.request(`/auth/users/${userId}/unfollow`, {
      method: 'POST',
    });
  }

  async acceptFollowRequest(requesterId) {
    return this.request(`/auth/users/${requesterId}/accept-follow-request`, {
      method: 'POST',
    });
  }

  async rejectFollowRequest(requesterId) {
    return this.request(`/auth/users/${requesterId}/reject-follow-request`, {
      method: 'POST',
    });
  }

  async cancelFollowRequest(userId) {
    return this.request(`/auth/users/${userId}/cancel-follow-request`, {
      method: 'POST',
    });
  }

  async getFollowing() {
    return this.request('/auth/following');
  }

  // File upload for React Native
  async uploadFile(formData) {
    const response = await fetch(`${this.baseURL}/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // 'Content-Type': 'multipart/form-data', // Let fetch set this automatically
      },
      body: formData,
    });
    
    return response.json();
  }

  async uploadFiles(files) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `file_${index}.jpg`,
      });
    });

    const response = await fetch(`${this.baseURL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // 'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    return response.json();
  }

  async uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'file.jpg',
    });

    const response = await fetch(`${this.baseURL}/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // 'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    return response.json();
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'avatar.jpg',
    });

    const response = await fetch(`${this.baseURL}/upload/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // 'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    return response.json();
  }

  async uploadCoverImage(file) {
    const formData = new FormData();
    formData.append('cover', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'cover.jpg',
    });

    const response = await fetch(`${this.baseURL}/upload/cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // 'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    return response.json();
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.request('/health');
      if (__DEV__) console.log('✅ Health check successful:', response);
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ Health check failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Message reactions
  async reactToMessage(chatId, messageId, emoji) {
    return this.request(`/chats/${chatId}/messages/${messageId}/react`, {
      method: 'POST',
      body: { emoji },
    });
  }

  // Reply to message
  async replyToMessage(chatId, messageId, content) {
    return this.request(`/chats/${chatId}/messages/${messageId}/reply`, {
      method: 'POST',
      body: { content }
    });
  }

  // Event-related API functions
  async getEvents() {
    return this.request('/events');
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: eventData,
    });
  }

  async joinEvent(eventId, password = null) {
    const body = password ? { password } : {};
    return this.request(`/events/${eventId}/join`, {
      method: 'POST',
      body: body,
    });
  }

  async leaveEvent(eventId) {
    return this.request(`/events/${eventId}/leave`, {
      method: 'POST',
    });
  }

  async kickEventUser(eventId, userId) {
    return this.request(`/events/${eventId}/kick/${userId}`, {
      method: 'POST',
    });
  }

  async likeEvent(eventId) {
    return this.request(`/events/${eventId}/like`, {
      method: 'POST',
    });
  }

  async commentOnEvent(eventId, content) {
    return this.request(`/events/${eventId}/comments`, {
      method: 'POST',
      body: { content }
    });
  }

  async getEvent(eventId) {
    return this.request(`/events/${eventId}`);
  }

  async deleteEvent(eventId) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Event Chat Methods
  async getEventChatMessages(eventId, page = 1, limit = 50) {
    return this.request(`/events/${eventId}/chat?page=${page}&limit=${limit}`);
  }

  async sendEventChatMessage(eventId, content, type = 'text') {
    return this.request(`/events/${eventId}/chat`, {
      method: 'POST',
      body: { content, type }
    });
  }

  async markEventChatAsRead(eventId) {
    return this.request(`/events/${eventId}/chat/read`, {
      method: 'POST',
    });
  }

  // Report functionality
  async submitReport(category, description) {
    return this.request('/reports', {
      method: 'POST',
      body: { category, description },
    });
  }
}

const apiService = new ApiService();
export default apiService; 
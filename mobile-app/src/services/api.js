import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, DEV_API_URL } from '@env';

// Use environment variable or fallback to production URL
const getApiUrl = () => {
  if (__DEV__ && DEV_API_URL) {
    return DEV_API_URL;
  }
  return API_BASE_URL || 'https://chatli-production.up.railway.app/api';
};

const API_URL = getApiUrl();

// Debug: Log the API URL being used (only in development)
if (__DEV__) {
  console.log('🔗 Mobile App API URL:', API_URL);
  console.log('🔗 Environment:', __DEV__ ? 'Development' : 'Production');
}

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.token = null;
    this.initializeToken();
  }

  async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('token');
      if (this.token) {
        if (__DEV__) console.log('🔍 Token found in storage');
      } else {
        if (__DEV__) console.log('ℹ️ No token found in storage');
      }
    } catch (error) {
      if (__DEV__) console.error('Error initializing token:', error);
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
    this.token = null;
    await AsyncStorage.removeItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}, retryCount = 3) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        if (__DEV__) {
          console.log(`Making request to: ${url} (attempt ${attempt + 1})`);
        }

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
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
      await this.setToken(response.data.token);
    }

    return response;
  }

  async register(name, username, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: { name, username, email, password }
    });

    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }

    return response;
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
      await this.setToken(response.data.token);
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
    try {
      const response = await this.request('/auth/privacy-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      return response;
    } catch (error) {
      if (__DEV__) console.error('Update privacy settings error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      if (__DEV__) console.log('getCurrentUser error:', error.message);
      // Clear token on any error
      await this.clearToken();
      return { success: false, message: 'Authentication failed' };
    }
  }

  async updatePushToken(pushToken) {
    try {
      const response = await this.request('/auth/push-token', {
        method: 'POST',
        body: JSON.stringify({ pushToken })
      });
      return response;
    } catch (error) {
      if (__DEV__) console.error('Update push token error:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async deleteAccount(password) {
    return this.request('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
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
      body: JSON.stringify(chatData),
    });
  }

  async getMessages(chatId, page = 1, limit = 50) {
    // Note: Getting messages automatically marks them as read on the backend
    return this.request(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(chatId, messageData) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async editMessage(chatId, messageId, newText) {
    return this.request(`/chats/${chatId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: { text: newText } }),
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
      body: JSON.stringify(postData),
    });
  }

  async verifySecretPostPassword(postId, password) {
    return this.request(`/posts/${postId}/verify-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
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
      body: JSON.stringify({ content }),
    });
  }

  async getComments(postId) {
    // Comments are included in the post data, so we get the single post
    return this.request(`/posts/${postId}`);
  }

  async addComment(postId, content) {
    return this.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
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
      body: JSON.stringify({ emoji }),
    });
  }

  // Reply to message
  async replyToMessage(chatId, messageId, content) {
    return this.request(`/chats/${chatId}/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Event-related API functions
  async getEvents() {
    return this.request('/events');
  }

  async createEvent(eventData) {
    const formData = new FormData();
    
    // Add text fields
    formData.append('name', eventData.name);
    formData.append('description', eventData.description);
    formData.append('userNumber', eventData.userNumber.toString());
    formData.append('isPrivate', eventData.isPrivate.toString());
    
    // Add password if it's a private event
    if (eventData.isPrivate && eventData.password) {
      formData.append('password', eventData.password);
    }
    
    // Add image file
    if (eventData.image) {
      const imageUri = eventData.image;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type
      });
    }

    return this.request('/events', {
      method: 'POST',
      body: formData
    });
  }

  async joinEvent(eventId, password = null) {
    const body = password ? { password } : {};
    return this.request(`/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify(body),
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
      method: 'POST'
    });
  }

  async commentOnEvent(eventId, content) {
    return this.request(`/events/${eventId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content })
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
    return this.request(`/event-chats/${eventId}/messages?page=${page}&limit=${limit}`);
  }

  async sendEventChatMessage(eventId, content, type = 'text') {
    return this.request(`/event-chats/${eventId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  async markEventChatAsRead(eventId) {
    return this.request(`/event-chats/${eventId}/messages/read`, {
      method: 'PUT',
    });
  }
}

const apiService = new ApiService();
export default apiService; 
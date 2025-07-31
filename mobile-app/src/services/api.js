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

// Debug: Log the API URL being used
console.log('🔗 Mobile App API URL:', API_URL);
console.log('🔗 Environment:', __DEV__ ? 'Development' : 'Production');

class ApiService {
  constructor() {
    this._baseURL = API_URL;
    this.token = null;
    this.initializeToken();
  }

  get baseURL() {
    return this._baseURL || API_URL;
  }

  set baseURL(url) {
    this._baseURL = url;
  }

  async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('token');
      if (this.token) {
        console.log('🔍 Token found in storage');
      } else {
        console.log('ℹ️ No token found in storage');
      }
    } catch (error) {
      console.error('Error initializing token:', error);
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

  async request(endpoint, options = {}) {
    const url = `${this._baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      timeout: 30000, // 30 second timeout
      ...options,
    };

    // Retry logic for failed requests
    const maxRetries = 2;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Making request to: ${url} (attempt ${attempt + 1})`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Хүсэлт хугацаа дууссан. Интернет холболтоо шалгана уу.')), 30000)
        );

        // Make the request with timeout
        const response = await Promise.race([
          fetch(url, config),
          timeoutPromise
        ]);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || 'Серверийн алдаа';
          } catch {
            errorMessage = response.status === 404 ? 'Хуудас олдсонгүй' : 'Серверийн алдаа';
          }

          // Handle auth errors gracefully
          if (response.status === 401) {
            await this.setToken(null);
            if (endpoint === '/notifications') {
              return { success: true, data: { notifications: [] } };
            }
            // For auth check, don't throw error, just return failure
            if (endpoint === '/auth/me') {
              return { success: false, message: 'Authentication failed' };
            }
            throw new Error('Нэвтрэх эрх дууссан. Дахин нэвтэрнэ үү.');
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        console.error(`API Error (attempt ${attempt + 1}):`, {
          url,
          error: error.message,
          endpoint
        });

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // If it's a network error or timeout, retry after a delay
        if (error.message.includes('Network request failed') || 
            error.message.includes('fetch') || 
            error.message.includes('timeout') || 
            error.message.includes('Application failed to respond')) {
          
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // For other errors, don't retry
        break;
      }
    }

    // Provide user-friendly error messages
    if (lastError.message.includes('Network request failed') || lastError.message.includes('fetch')) {
      throw new Error('Интернет холболтоо шалгаад дахин оролдоно уу.');
    }
    
    if (lastError.message.includes('timeout') || lastError.message.includes('Хүсэлт хугацаа')) {
      throw new Error('Хүсэлт хугацаа дууссан. Интернет холболтоо шалгана уу.');
    }

    if (lastError.message.includes('Application failed to respond')) {
      throw new Error('Сервер хариулахад асуудал гарлаа. Дахин оролдоно уу.');
    }

    throw lastError;
  }

  // Auth endpoints
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.setToken(null);
    }
  }

  // Email verification methods
  async verifyEmail(code, email) {
    try {
      console.log('🔐 Verifying email with code:', code, 'for email:', email);
      const response = await this.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ code, email })
      });
      
      console.log('📧 Email verification response:', response);
      
      // If verification successful, set the token for automatic login
      if (response.success && response.data.token) {
        console.log('✅ Setting token after successful verification');
        await this.setToken(response.data.token);
      } else {
        console.log('❌ No token in verification response');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Email verification error:', error);
      throw error;
    }
  }

  async resendVerificationEmail(email) {
    try {
      const response = await this.request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return response;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Forgot password functionality
  async forgotPassword(email) {
    try {
      const response = await this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async verifyResetCode(email, code) {
    try {
      const response = await this.request('/auth/verify-reset-code', {
        method: 'POST',
        body: JSON.stringify({ email, code })
      });
      return response;
    } catch (error) {
      console.error('Verify reset code error:', error);
      throw error;
    }
  }

  async resetPassword(resetToken, newPassword) {
    try {
      const response = await this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword })
      });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return response;
    } catch (error) {
      console.error('Change password error:', error);
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
      console.error('Get privacy settings error:', error);
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
      console.error('Update privacy settings error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      console.log('getCurrentUser error:', error.message);
      // Clear token on any error
      await this.clearToken();
      return { success: false, message: 'Authentication failed' };
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
    // Server doesn't support pagination yet, so we ignore the page parameter
    return this.request('/posts');
  }

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
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
      console.error('Invalid notification ID provided:', notificationId);
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
      console.log('✅ Health check successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
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
      method: 'DELETE'
    });
  }
}

const apiService = new ApiService();
export default apiService; 
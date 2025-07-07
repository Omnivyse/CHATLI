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

    try {
      console.log(`Making request to: ${url}`);
      
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
          throw new Error('Нэвтрэх эрх дууссан. Дахин нэвтэрнэ үү.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', {
        url,
        error: error.message,
        endpoint
      });

      // Provide user-friendly error messages
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        throw new Error('Интернет холболтоо шалгаад дахин оролдоно уу.');
      }
      
      if (error.message.includes('timeout') || error.message.includes('Хүсэлт хугацаа')) {
        throw new Error('Хүсэлт хугацаа дууссан. Интернет холболтоо шалгана уу.');
      }

      throw error;
    }
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

  async getCurrentUser() {
    return this.request('/auth/me');
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
  async getPosts() {
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
    return this.request('/health');
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
      body: JSON.stringify(content),
    });
  }
}

const apiService = new ApiService();
export default apiService; 
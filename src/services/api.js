const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
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
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Серверийн алдаа');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
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
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
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
      this.setToken(null);
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

  async getFollowing() {
    return this.request('/auth/following');
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

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // File Upload endpoints
  async uploadFiles(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseURL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return response.json();
  }

  async uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return response.json();
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${this.baseURL}/upload/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return response.json();
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
    return this.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
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

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllComments(postId) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'DELETE',
    });
  }

  async getPost(postId) {
    return this.request(`/posts/${postId}`);
  }

  async deleteComment(postId, commentId) {
    return this.request(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async followUser(userId) {
    return this.request(`/auth/users/${userId}/follow`, { method: 'POST' });
  }

  async unfollowUser(userId) {
    return this.request(`/auth/users/${userId}/unfollow`, { method: 'POST' });
  }

  async acceptFollowRequest(userId, requesterId) {
    return this.request(`/auth/users/${userId}/accept-request`, {
      method: 'POST',
      body: JSON.stringify({ requesterId })
    });
  }

  async rejectFollowRequest(userId, requesterId) {
    return this.request(`/auth/users/${userId}/reject-request`, {
      method: 'POST',
      body: JSON.stringify({ requesterId })
    });
  }

  async searchUsers(query) {
    return this.request(`/auth/users/search?q=${encodeURIComponent(query)}`);
  }

  async updatePost(postId, postData) {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
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
      body: JSON.stringify({ content }),
    });
  }

  // Forward message
  async forwardMessage(chatId, messageId, targetChatId) {
    return this.request(`/chats/${chatId}/messages/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ targetChatId }),
    });
  }

  // Pin message
  async pinMessage(chatId, messageId) {
    return this.request(`/chats/${chatId}/messages/${messageId}/pin`, {
      method: 'POST',
    });
  }

  // Unpin message
  async unpinMessage(chatId, messageId) {
    return this.request(`/chats/${chatId}/messages/${messageId}/unpin`, {
      method: 'DELETE',
    });
  }

  // Get pinned messages
  async getPinnedMessages(chatId) {
    return this.request(`/chats/${chatId}/pinned-messages`);
  }

  // Mark chat as read
  async markChatAsRead(chatId) {
    return this.request(`/chats/${chatId}/read`, {
      method: 'POST',
    });
  }

  // Delete chat
  async deleteChat(chatId) {
    return this.request(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  // Get chat participants
  async getChatParticipants(chatId) {
    return this.request(`/chats/${chatId}/participants`);
  }

  // Add participant to group chat
  async addParticipant(chatId, userId) {
    return this.request(`/chats/${chatId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Remove participant from group chat
  async removeParticipant(chatId, userId) {
    return this.request(`/chats/${chatId}/participants/${userId}`, {
      method: 'DELETE',
    });
  }

  // Update group chat settings
  async updateChatSettings(chatId, settings) {
    return this.request(`/chats/${chatId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Search messages in chat
  async searchMessages(chatId, query) {
    return this.request(`/chats/${chatId}/messages/search?q=${encodeURIComponent(query)}`);
  }

  // Report endpoints
  async submitReport(reportData) {
    return this.request('/reports/submit', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReports() {
    return this.request('/reports/admin');
  }

  async updateReportStatus(reportId, status) {
    return this.request(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Admin endpoints
  async adminLogin(credentials) {
    const response = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      // Store admin token separately
      localStorage.setItem('adminToken', response.token);
    }

    return response;
  }

  async adminLogout() {
    try {
      await this.request('/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
    }
  }

  async verifyAdminToken() {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('No admin token found');
    }

    const response = await fetch(`${this.baseURL}/admin/verify`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    return response.json();
  }

  async getAdminStats() {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async getAllUsersAdmin(page = 1, limit = 20, search = '') {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async deleteUserAdmin(userId) {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async getAdminReports(page = 1, limit = 20, status = '') {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/reports?page=${page}&limit=${limit}&status=${status}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async updateAdminReportStatus(reportId, status, adminNotes = '') {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, adminNotes })
    });
    return response.json();
  }

  // Analytics endpoints
  async getAnalyticsDailyStats(days = 7) {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/analytics/daily?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async getAnalyticsPopularPages(limit = 10) {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/analytics/pages?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async getAnalyticsUserActivity(days = 30) {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/analytics/activity?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async getAnalyticsDeviceStats(days = 7) {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/analytics/devices?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async getAnalyticsRealtime() {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/analytics/realtime`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.json();
  }

  async trackAnalyticsEvent(eventData) {
    const adminToken = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseURL}/admin/analytics/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    return response.json();
  }
}

const apiService = new ApiService();
export default apiService; 
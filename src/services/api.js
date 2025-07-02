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
}

const apiService = new ApiService();
export default apiService; 
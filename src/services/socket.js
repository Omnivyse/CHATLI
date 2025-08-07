import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    // Use production URL to match mobile app
    const socketURL = 'https://chatli-production.up.railway.app';
    console.log('🔌 WEB: Connecting to socket:', socketURL);

    this.socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ WEB: Socket connected successfully');
      this.isConnected = true;
      
      // Authenticate with token
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WEB: Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WEB: Socket connection error:', error);
      this.isConnected = false;
    });

    // Add authentication listeners
    this.socket.on('authenticated', (data) => {
      console.log('✅ WEB: Socket authenticated successfully');
    });

    this.socket.on('authentication_failed', (error) => {
      console.error('❌ WEB: Socket authentication failed:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join chat room
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      console.log('🎯 WEB: Joining chat room:', chatId);
      this.socket.emit('join_chat', chatId);
    } else {
      console.warn('⚠️ WEB: Cannot join chat - socket not connected');
      console.log('🔍 WEB: Socket status:', {
        socket: !!this.socket,
        connected: this.isConnected,
        socketId: this.socket?.id
      });
    }
  }

  // Leave chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      console.log('🎯 WEB: Leaving chat room:', chatId);
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Send message
  sendMessage(chatId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', { chatId, message });
    }
  }

  // Typing indicators
  startTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', chatId);
    }
  }

  stopTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', chatId);
    }
  }

  // Add reaction
  addReaction(chatId, messageId, userId, emoji, userName) {
    if (this.socket && this.isConnected) {
      const data = { chatId, messageId, userId, emoji, userName };
      console.log('😀 WEB: Adding reaction:', data);
      this.socket.emit('add_reaction', data);
    } else {
      console.warn('⚠️ WEB: Cannot add reaction - socket not connected');
    }
  }

  // Remove reaction
  removeReaction(chatId, messageId, userId, emoji) {
    if (this.socket && this.isConnected) {
      const data = { chatId, messageId, userId, emoji };
      console.log('🗑️ WEB: Removing reaction:', data);
      this.socket.emit('remove_reaction', data);
    } else {
      console.warn('⚠️ WEB: Cannot remove reaction - socket not connected');
    }
  }

  // Delete message
  deleteMessage(chatId, messageId, userId) {
    if (this.socket && this.isConnected) {
      const data = { chatId, messageId, userId };
      console.log('🗑️ WEB: Deleting message:', data);
      this.socket.emit('delete_message', data);
    } else {
      console.warn('⚠️ WEB: Cannot delete message - socket not connected');
    }
  }

  // Event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket) {
      console.log('🎧 WEB: Adding listener for event:', event);
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (this.socket) {
      console.log('🎧 WEB: Removing listener for event:', event);
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners
  removeAllListeners(event) {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket ID for debugging
  getSocketId() {
    return this.socket?.id;
  }

  // Check if socket is ready
  isReady() {
    return this.socket && this.isConnected;
  }

  // Emit custom events
  emit(event, data) {
    if (this.socket && this.isConnected) {
      console.log('📡 WEB: Emitting event:', event, 'with data:', data);
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ WEB: Cannot emit ${event} - socket not connected`);
      console.log('🔍 WEB: Socket status:', {
        socket: !!this.socket,
        connected: this.isConnected,
        socketId: this.socket?.id
      });
    }
  }
}

const socketService = new SocketService();
export default socketService; 
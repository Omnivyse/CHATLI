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

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      
      // Authenticate with token
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
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
      this.socket.emit('join_chat', chatId);
    }
  }

  // Leave chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
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

  // Event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket) {
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
}

const socketService = new SocketService();
export default socketService; 
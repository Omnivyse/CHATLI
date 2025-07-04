import io from 'socket.io-client';
import { Platform } from 'react-native';
import { SOCKET_URL, DEV_SOCKET_URL } from '@env';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  getSocketURL() {
    // Use environment variable or fallback to production URL
    if (__DEV__ && DEV_SOCKET_URL) {
      return DEV_SOCKET_URL;
    }
    return SOCKET_URL || 'https://chatli-production.up.railway.app';
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    const socketURL = this.getSocketURL();
    console.log('Connecting to socket:', socketURL);

    this.socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Authenticate with token
      if (token) {
        this.socket.emit('authenticate', token);
      }

      // Re-register all existing listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.on(event, callback);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      // Attempt to reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      // Auto-reconnect for other reasons
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.attemptReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      this.isConnected = false;
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && !this.isConnected) {
          this.socket.connect();
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  // Join chat room
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', chatId);
      console.log('Joined chat:', chatId);
    } else {
      console.warn('Cannot join chat - socket not connected');
    }
  }

  // Leave chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', chatId);
      console.log('Left chat:', chatId);
    }
  }

  // Send message
  sendMessage(chatId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', { chatId, message });
      console.log('Message sent to chat:', chatId);
    } else {
      console.warn('Cannot send message - socket not connected');
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

  // Update user status
  updateStatus(status) {
    if (this.socket && this.isConnected) {
      this.socket.emit('status_update', status);
    }
  }

  // Event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket && this.isConnected) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
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

  // Force reconnect
  forceReconnect() {
    if (this.socket) {
      this.disconnect();
      setTimeout(() => {
        this.connect();
      }, 1000);
    }
  }

  // Emit custom events
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event} - socket not connected`);
    }
  }

  // Check if socket is ready
  isReady() {
    return this.socket && this.isConnected;
  }
}

const socketService = new SocketService();
export default socketService; 
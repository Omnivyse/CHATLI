import io from 'socket.io-client';
import { Platform } from 'react-native';
import { SOCKET_URL, DEV_SOCKET_URL } from '@env';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false; // Track if we're currently connecting
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.activeChatRooms = new Set(); // Track active chat rooms
    this.authToken = null; // Store auth token for reconnection
    this.lastReconnectAttempt = 0; // Track last reconnection attempt time
    this.reconnectDebounceMs = 5000; // Minimum 5 seconds between reconnection attempts
  }

  getSocketURL() {
    // Use environment variable or fallback to production URL
    if (__DEV__ && DEV_SOCKET_URL) {
      return DEV_SOCKET_URL;
    }
    const socketURL = SOCKET_URL || 'https://chatli-production.up.railway.app';
    console.log('🔗 Mobile App Socket URL:', socketURL);
    return socketURL;
  }

  connect(token) {
    // Prevent rapid reconnection attempts
    const now = Date.now();
    if (this.lastReconnectAttempt && (now - this.lastReconnectAttempt) < this.reconnectDebounceMs) {
      console.log('⏳ Reconnection attempt blocked by debounce, waiting...');
      return;
    }
    
    if (this.socket && this.isConnected) {
      console.log('✅ Already connected, skipping connection attempt');
      return;
    }
    
    if (this.isConnecting) {
      console.log('⏳ Already connecting, skipping duplicate attempt');
      return;
    }

    // Store the auth token for reconnection
    this.authToken = token;
    this.lastReconnectAttempt = now;
    this.isConnecting = true;

    const socketURL = this.getSocketURL();
    console.log('🔌 Connecting to socket:', socketURL);
    console.log('🚂 Environment:', __DEV__ ? 'Development' : 'Production');

    this.socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: false, // Disable automatic reconnection to prevent blinking
      reconnectionAttempts: 0,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false, // Don't force new connection
      upgrade: true,
      rememberUpgrade: true, // Remember upgrade to prevent reconnection
      // Railway-specific settings
      path: '/socket.io/',
      withCredentials: true,
      extraHeaders: {
        'User-Agent': 'Chatli-Mobile-App'
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log('🔗 Socket ID:', this.socket.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Authenticate with token - ensure token is valid
      if (token && typeof token === 'string' && token.trim().length > 0) {
        console.log('🔐 Authenticating socket with token...');
        this.socket.emit('authenticate', token);
        
        // Listen for authentication result
        this.socket.once('authenticated', (data) => {
          console.log('✅ Socket authenticated successfully:', data);
        });
        
        this.socket.once('authentication_failed', (error) => {
          console.error('❌ Socket authentication failed:', error);
          // Don't disconnect immediately, just log the error
          console.log('⚠️ Continuing with unauthenticated socket for now');
        });
      } else {
        console.warn('⚠️ Invalid token format, skipping authentication');
      }

      // Re-register all existing listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.on(event, callback);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      
      // Only attempt to reconnect for specific reasons, not all disconnects
      if (reason === 'io client disconnect' || reason === 'transport close') {
        console.log('🔄 Client-initiated disconnect, will reconnect when needed');
        // Don't auto-reconnect, let the app handle it
      } else if (reason === 'io server disconnect') {
        console.log('🛑 Server initiated disconnect, not reconnecting');
      } else {
        console.log('⚠️ Unexpected disconnect reason:', reason);
        // Only attempt reconnection for unexpected disconnects
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        description: error.description,
        context: error.context
      });
      this.isConnected = false;
      this.isConnecting = false;
      
      // Don't auto-reconnect on connection errors to prevent blinking
      console.log('⚠️ Connection error, will reconnect when explicitly requested');
    });

    // Remove automatic reconnection events since we disabled auto-reconnection
    this.socket.on('error', (error) => {
      console.error('🚂 Railway socket error:', error);
      this.isConnecting = false;
    });
  }

  attemptReconnect() {
    // Prevent rapid reconnection attempts
    const now = Date.now();
    if (this.lastReconnectAttempt && (now - this.lastReconnectAttempt) < this.reconnectDebounceMs) {
      console.log('⏳ Reconnection attempt blocked by debounce, waiting...');
      return;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.lastReconnectAttempt = now;
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
      console.log('🎯 Joining chat room:', chatId);
      this.socket.emit('join_chat', chatId);
      
      // Track this chat room as active
      this.activeChatRooms.add(chatId);
      
      // Add confirmation listener
      this.socket.once('chat_joined', (data) => {
        console.log('✅ Successfully joined chat room:', data);
      });
      
      // Add error listener
      this.socket.once('chat_join_error', (error) => {
        console.error('❌ Failed to join chat room:', error);
        // Remove from active rooms if join failed
        this.activeChatRooms.delete(chatId);
      });
      
      console.log('📡 Join chat event emitted for:', chatId);
    } else {
      console.warn('⚠️ Cannot join chat - socket not connected');
      console.log('🔍 Socket status:', {
        socket: !!this.socket,
        connected: this.isConnected,
        socketId: this.socket?.id
      });
      
      // Only attempt to reconnect if we don't have a socket instance
      // This prevents aggressive reconnection attempts
      if (!this.socket) {
        console.log('🔄 No socket instance, creating new connection...');
        this.connect(this.authToken);
        
        // Wait for connection and then join
        const checkAndJoin = () => {
          if (this.isConnected) {
            console.log('✅ Socket connected, now joining chat room:', chatId);
            this.joinChat(chatId);
          } else if (this.socket) {
            // Only retry if we still have a socket instance
            setTimeout(checkAndJoin, 1000);
          }
        };
        setTimeout(checkAndJoin, 1000);
      }
    }
  }

  // Leave chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', chatId);
      console.log('Left chat:', chatId);
    }
    
    // Remove from active chat rooms
    this.activeChatRooms.delete(chatId);
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

  // Add reaction
  addReaction(chatId, messageId, userId, emoji, userName) {
    if (this.socket && this.isConnected) {
      const data = { chatId, messageId, userId, emoji, userName };
      console.log('😀 Adding reaction:', data);
      this.socket.emit('add_reaction', data);
    } else {
      console.warn('⚠️ Cannot add reaction - socket not connected');
      console.log('🔍 Socket status:', {
        socket: !!this.socket,
        connected: this.isConnected,
        socketId: this.socket?.id
      });
    }
  }

  // Remove reaction
  removeReaction(chatId, messageId, userId, emoji) {
    if (this.socket && this.isConnected) {
      const data = { chatId, messageId, userId, emoji };
      console.log('🗑️ Removing reaction:', data);
      this.socket.emit('remove_reaction', data);
    } else {
      console.warn('⚠️ Cannot remove reaction - socket not connected');
      console.log('🔍 Socket status:', {
        socket: !!this.socket,
        connected: this.isConnected,
        socketId: this.socket?.id
      });
    }
  }

  // Delete message
  deleteMessage(chatId, messageId, userId) {
    if (this.socket && this.isConnected) {
      const data = { chatId, messageId, userId };
      console.log('🗑️ Deleting message:', data);
      this.socket.emit('delete_message', data);
    } else {
      console.warn('⚠️ Cannot delete message - socket not connected');
      console.log('🔍 Socket status:', {
        socket: !!this.socket,
        connected: this.isConnected,
        socketId: this.socket?.id
      });
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

  // Rejoin all active chat rooms after reconnection
  rejoinActiveChatRooms() {
    if (this.socket && this.isConnected && this.activeChatRooms.size > 0) {
      console.log(`🔄 Rejoining ${this.activeChatRooms.size} active chat rooms after reconnection...`);
      this.activeChatRooms.forEach(chatId => {
        console.log(`🎯 Rejoining chat room: ${chatId}`);
        this.socket.emit('join_chat', chatId);
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get active chat rooms (for debugging)
  getActiveChatRooms() {
    return Array.from(this.activeChatRooms);
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
    return this.socket && this.isConnected && !this.isConnecting;
  }

  // Check if we're already in a specific chat room
  isInChatRoom(chatId) {
    return this.activeChatRooms.has(chatId);
  }

  // Check if we should attempt reconnection
  shouldAttemptReconnect() {
    return !this.isConnecting && !this.isConnected && this.authToken;
  }

  // Gracefully handle screen focus - only reconnect if actually needed
  handleScreenFocus(chatId) {
    // If we're already connected and in the chat room, do nothing
    if (this.isReady() && this.isInChatRoom(chatId)) {
      console.log('✅ Already connected and in chat room:', chatId);
      return true; // No action needed
    }
    
    // If we have a socket but it's not connected, try to reconnect gently
    if (this.socket && !this.isConnected && !this.isConnecting) {
      console.log('🔌 Socket exists but not connected, attempting gentle reconnect...');
      // Don't create a new connection, just try to reconnect the existing one
      if (this.socket.connect) {
        this.socket.connect();
        return false; // Action taken
      }
    }
    
    // If we don't have a socket at all and should attempt reconnection, create one
    if (!this.socket && this.shouldAttemptReconnect()) {
      console.log('🔌 No socket instance, creating new connection...');
      this.connect(this.authToken);
      return false; // Action taken
    }
    
    // If we're connected but not in the chat room, join it
    if (this.isReady() && !this.isInChatRoom(chatId)) {
      console.log('🎯 Connected but not in chat room, joining:', chatId);
      this.joinChat(chatId);
      return false; // Action taken
    }
    
    return true; // No action needed
  }

  // Like post
  likePost(postId, likedBy, postOwner) {
    if (this.socket && this.isConnected) {
      this.socket.emit('like_post', { postId, likedBy, postOwner });
    }
  }

  // Comment post
  commentPost(postId, commentBy, postOwner, commentText) {
    if (this.socket && this.isConnected) {
      console.log('💬 Emitting comment_post:', { postId, commentBy, postOwner, commentText });
      this.socket.emit('comment_post', { postId, commentBy, postOwner, commentText });
    } else {
      console.warn('⚠️ Cannot comment post - socket not connected');
    }
  }

  // Follow user
  followUser(followedUserId, followedBy) {
    if (this.socket && this.isConnected) {
      console.log('👥 Emitting follow_user:', { followedUserId, followedBy });
      this.socket.emit('follow_user', { followedUserId, followedBy });
    } else {
      console.warn('⚠️ Cannot follow user - socket not connected');
    }
  }

  // Listen for real-time notifications
  onNotification(callback) {
    this.on('notification', callback);
  }

  offNotification(callback) {
    this.off('notification', callback);
  }

  // Listen for real-time comment updates
  onCommentAdded(callback) {
    this.on('comment_added', callback);
  }

  offCommentAdded(callback) {
    this.off('comment_added', callback);
  }

  // Listen for real-time like updates
  onPostLiked(callback) {
    this.on('post_liked', callback);
  }

  offPostLiked(callback) {
    this.off('post_liked', callback);
  }

  // Listen for real-time post updates
  onPostUpdated(callback) {
    this.on('post_updated', callback);
  }

  offPostUpdated(callback) {
    this.off('post_updated', callback);
  }

  // Join post room for real-time updates
  joinPostRoom(postId) {
    if (this.socket && this.isConnected) {
      console.log('📝 Joining post room:', postId);
      this.socket.emit('join_post_room', postId);
      
      this.socket.once('post_room_joined', (data) => {
        console.log('✅ Successfully joined post room:', data);
      });
      
      this.socket.once('post_room_error', (error) => {
        console.error('❌ Failed to join post room:', error);
      });
    } else {
      console.warn('⚠️ Cannot join post room - socket not connected');
    }
  }

  // Leave post room
  leavePostRoom(postId) {
    if (this.socket && this.isConnected) {
      console.log('📝 Leaving post room:', postId);
      this.socket.emit('leave_post_room', postId);
    } else {
      console.warn('⚠️ Cannot leave post room - socket not connected');
    }
  }

  // Listen for user status updates
  onUserStatusUpdate(callback) {
    this.on('user_status_update', callback);
  }

  offUserStatusUpdate(callback) {
    this.off('user_status_update', callback);
  }

  // Listen for new messages in chats
  onNewMessage(callback) {
    this.on('new_message', callback);
  }

  offNewMessage(callback) {
    this.off('new_message', callback);
  }

  // Listen for typing indicators
  onTypingIndicator(callback) {
    this.on('typing_indicator', callback);
  }

  offTypingIndicator(callback) {
    this.off('typing_indicator', callback);
  }
}

const socketService = new SocketService();
export default socketService; 
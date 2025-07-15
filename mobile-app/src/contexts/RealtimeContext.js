import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children, user }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!user || !user.token) return;

    // Connect to socket when user is available
    socketService.connect(user.token);

    // Listen for connection status changes
    const handleConnect = () => {
      console.log('🔗 RealtimeContext: Socket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      console.log('🔗 RealtimeContext: Socket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      console.log('🔗 RealtimeContext: Socket connection error');
      setIsConnected(false);
      setConnectionStatus('error');
    };

    const handleReconnect = () => {
      console.log('🔗 RealtimeContext: Socket reconnected');
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    // Set up event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);
    socketService.on('reconnect', handleReconnect);

    // Check initial connection status
    setIsConnected(socketService.getConnectionStatus());
    setConnectionStatus(socketService.getConnectionStatus() ? 'connected' : 'disconnected');

    return () => {
      // Cleanup listeners
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
      socketService.off('reconnect', handleReconnect);
    };
  }, [user]);

  // Global real-time event handlers
  const handleGlobalNotification = (data) => {
    console.log('🔔 Global notification:', data);
    // You can add global notification handling here
    // For example, show a toast notification
  };

  const handleGlobalPostUpdate = (data) => {
    console.log('📝 Global post update:', data);
    // You can add global post update handling here
  };

  const handleGlobalUserStatus = (data) => {
    console.log('👤 Global user status update:', data);
    // You can add global user status handling here
  };

  useEffect(() => {
    if (!isConnected) return;

    // Set up global real-time listeners
    socketService.onNotification(handleGlobalNotification);
    socketService.onPostUpdated(handleGlobalPostUpdate);
    socketService.onUserStatusUpdate(handleGlobalUserStatus);

    return () => {
      socketService.offNotification(handleGlobalNotification);
      socketService.offPostUpdated(handleGlobalPostUpdate);
      socketService.offUserStatusUpdate(handleGlobalUserStatus);
    };
  }, [isConnected]);

  const value = {
    isConnected,
    connectionStatus,
    socketService,
    // Helper methods
    joinPostRoom: (postId) => socketService.joinPostRoom(postId),
    leavePostRoom: (postId) => socketService.leavePostRoom(postId),
    joinChat: (chatId) => socketService.joinChat(chatId),
    leaveChat: (chatId) => socketService.leaveChat(chatId),
    // Event listeners
    onNotification: (callback) => socketService.onNotification(callback),
    offNotification: (callback) => socketService.offNotification(callback),
    onCommentAdded: (callback) => socketService.onCommentAdded(callback),
    offCommentAdded: (callback) => socketService.offCommentAdded(callback),
    onPostLiked: (callback) => socketService.onPostLiked(callback),
    offPostLiked: (callback) => socketService.offPostLiked(callback),
    onPostUpdated: (callback) => socketService.onPostUpdated(callback),
    offPostUpdated: (callback) => socketService.offPostUpdated(callback),
    onNewMessage: (callback) => socketService.onNewMessage(callback),
    offNewMessage: (callback) => socketService.offNewMessage(callback),
    onTypingIndicator: (callback) => socketService.onTypingIndicator(callback),
    offTypingIndicator: (callback) => socketService.offTypingIndicator(callback),
    // Emit methods
    likePost: (postId, likedBy, postOwner) => socketService.likePost(postId, likedBy, postOwner),
    commentPost: (postId, commentBy, postOwner, commentText) => 
      socketService.commentPost(postId, commentBy, postOwner, commentText),
    followUser: (followedUserId, followedBy) => socketService.followUser(followedUserId, followedBy),
    sendMessage: (chatId, message) => socketService.sendMessage(chatId, message),
    startTyping: (chatId) => socketService.startTyping(chatId),
    stopTyping: (chatId) => socketService.stopTyping(chatId),
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}; 
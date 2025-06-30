import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Phone, Video, Search, Loader2, X } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatSearch from './ChatSearch';

const ChatWindow = ({ chatId, user, onBack, isMobile }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionTarget, setReactionTarget] = useState(null);

  const loadChat = async () => {
    try {
      const response = await api.getChat(chatId);
      if (response.success) {
        setChat(response.data.chat);
      }
    } catch (error) {
      console.error('Load chat error:', error);
      setError('Чат уншихад алдаа гарлаа');
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.getMessages(chatId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Load messages error:', error);
      setError('Мессежүүдийг уншихад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.chatId === chatId) {
      setMessages(prev => [...prev, data.message]);
      // Clear typing indicators when message is received
      setTypingUsers(new Set());
    }
  };

  const handleUserTyping = (data) => {
    if (data.chatId === chatId) {
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(chatId);
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(chatId);
    }
  };

  const handleMessageSelect = (message) => {
    // Scroll to the selected message
    setShowSearch(false);
    // You can implement scroll to message functionality here
    console.log('Selected message:', message);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const response = await api.reactToMessage(chatId, messageId, emoji);
      if (response.success) {
        // Update the message's reactions in state
        setMessages(prevMsgs => prevMsgs.map(msg =>
          msg._id === messageId
            ? { ...msg, reactions: response.data.reactions }
            : msg
        ));
      }
    } catch (error) {
      console.error('React to message error:', error);
    }
  };

  useEffect(() => {
    if (chatId) {
      loadChat();
      loadMessages();
      // Join chat room
      socketService.joinChat(chatId);
      
      // Listen for new messages and typing indicators
      socketService.on('new_message', handleNewMessage);
      socketService.on('user_typing', handleUserTyping);
      
      return () => {
        // Leave chat room and stop typing
        socketService.leaveChat(chatId);
        socketService.stopTyping(chatId);
        socketService.off('new_message', handleNewMessage);
        socketService.off('user_typing', handleUserTyping);
      };
    }
  }, [chatId]);

  const handleSendMessage = async (text) => {
    try {
      let response;
      if (replyingTo) {
        response = await api.replyToMessage(chatId, replyingTo._id, { text });
      } else {
        response = await api.sendMessage(chatId, {
          type: 'text',
          content: { text }
        });
      }
      if (response.success) {
        const newMessage = response.data.message;
        setMessages(prev => [...prev, newMessage]);
        socketService.sendMessage(chatId, newMessage);
        handleTypingStop();
        setReplyingTo(null); // Clear reply state
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const getChatTitle = () => {
    if (!chat) return 'Чат';
    
    if (chat.type === 'group') {
      return chat.name;
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatAvatar = () => {
    if (!chat) return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    
    if (chat.type === 'group') {
      return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop&crop=face';
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    }
  };

  const getChatStatus = () => {
    if (!chat) return '';
    
    if (chat.type === 'group') {
      return `${chat.participants.length} гишүүн`;
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.status === 'online' ? 'Онлайн' : 'Офлайн';
    }
  };

  const getTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    
    const typingUserNames = Array.from(typingUsers).map(userId => {
      if (chat.type === 'group') {
        const participant = chat.participants.find(p => p._id === userId);
        return participant?.name || 'Unknown';
      } else {
        const otherParticipant = chat.participants.find(p => p._id !== user._id);
        return otherParticipant?.name || 'Unknown';
      }
    });
    
    const names = typingUserNames.join(', ');
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-secondary">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span>{names} бичиж байна...</span>
      </div>
    );
  };

  if (showSearch) {
    return (
      <ChatSearch
        chatId={chatId}
        onClose={() => setShowSearch(false)}
        onMessageSelect={handleMessageSelect}
      />
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        <div className="text-center">
          <p className="text-sm mb-2">{error}</p>
          <button 
            onClick={loadChat}
            className="text-xs text-primary hover:underline"
          >
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-background dark:bg-background-dark shadow-sm">
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <img 
            src={getChatAvatar()} 
            alt={getChatTitle()}
            className="w-12 h-12 rounded-full object-cover border-2 border-border dark:border-border-dark"
          />
          <div>
            <h2 className="font-bold text-base">{getChatTitle()}</h2>
            <p className="text-xs text-secondary">{getChatStatus()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-hidden bg-background dark:bg-background-dark px-2 py-4 md:px-8 md:py-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            currentUserId={user._id}
            chatId={chatId}
            onReply={handleReply}
            onReact={handleReact}
            reactionTarget={reactionTarget}
            setReactionTarget={setReactionTarget}
          />
        )}
      </div>
      {/* Typing Indicator */}
      {getTypingIndicator()}
      {/* Reply preview above input */}
      {replyingTo && (
        <div className="border-t border-border dark:border-border-dark bg-muted/50 dark:bg-muted-dark/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-primary dark:text-white">Хариулах:</span>
                <span className="text-secondary truncate dark:text-white">{replyingTo.sender?.name}</span>
              </div>
              <div className="text-sm text-foreground dark:text-foreground-dark truncate mt-1">
                {replyingTo.content.text}
              </div>
            </div>
            <button 
              onClick={handleCancelReply} 
              className="flex-shrink-0 p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark text-secondary hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Input */}
      <div className="border-t border-border dark:border-border-dark bg-background dark:bg-background-dark shadow-lg">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>
    </div>
  );
};

export default ChatWindow; 
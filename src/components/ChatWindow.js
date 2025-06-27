import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Phone, Video, Search, Loader2 } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ chatId, user, onBack, isMobile }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    }
  };

  useEffect(() => {
    if (chatId) {
      loadChat();
      loadMessages();
      // Join chat room
      socketService.joinChat(chatId);
      
      // Listen for new messages
      socketService.on('new_message', handleNewMessage);
      
      return () => {
        // Leave chat room
        socketService.leaveChat(chatId);
        socketService.off('new_message', handleNewMessage);
      };
    }
  }, [chatId]);

  const handleSendMessage = async (text) => {
    try {
      const response = await api.sendMessage(chatId, {
        type: 'text',
        content: { text }
      });
      
      if (response.success) {
        const newMessage = response.data.message;
        setMessages(prev => [...prev, newMessage]);
        
        // Send via socket for real-time
        socketService.sendMessage(chatId, newMessage);
      }
    } catch (error) {
      console.error('Send message error:', error);
      // You might want to show an error toast here
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <img 
              src={getChatAvatar()} 
              alt={getChatTitle()}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-sm">{getChatTitle()}</h2>
              <p className="text-xs text-secondary">{getChatStatus()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            currentUserId={user._id}
          />
        )}
      </div>

      {/* Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow; 
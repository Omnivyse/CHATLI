import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, Video, Search, Loader2, Trash2 } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatSearch from './ChatSearch';

const ChatWindow = ({ chatId, user, onBack, isMobile, onChatDeleted, updateChatListWithNewMessage }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadChat = useCallback(async () => {
    try {
      const response = await api.getChat(chatId);
      if (response.success) {
        setChat(response.data.chat);
      }
    } catch (error) {
      console.error('Load chat error:', error);
      setError('Чат уншихад алдаа гарлаа');
    }
  }, [chatId]);

  const loadMessages = useCallback(async (pageToLoad = 1, prepend = false) => {
    if (pageToLoad === 1) setLoading(true);
    if (pageToLoad > 1) setLoadingMore(true);
    setError('');
    try {
      const response = await api.getMessages(chatId, pageToLoad);
      if (response.success) {
        const newMessages = response.data.messages;
        setHasMore(response.data.pagination.hasMore);
        setPage(pageToLoad);
        setMessages(prev =>
          prepend ? [...newMessages, ...prev] : newMessages
        );
      }
    } catch (error) {
      console.error('Load messages error:', error);
      setError('Мессежүүдийг уншихад алдаа гарлаа');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [chatId]);

  // For infinite scroll: load more messages (older) and prepend
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    await loadMessages(page + 1, true);
  };

  const handleNewMessage = useCallback((data) => {
    if (data.chatId === chatId) {
      setMessages(prev => [...prev, data.message]);
      // Clear typing indicators when message is received
      setTypingUsers(new Set());
    }
  }, [chatId]);

  const handleUserTyping = useCallback((data) => {
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
  }, [chatId]);

  const handleReactionAdded = useCallback((data) => {
    console.log('🔥 WEB: Received reaction_added event:', data);
    
    if (data.chatId === chatId) {
      console.log('✅ WEB: Updating message with reaction:', data.messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === data.messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.userId === data.userId);
            
            if (existingReaction) {
              // Replace existing reaction
              const newReactions = reactions.map(r => 
                r.userId === data.userId 
                  ? { ...r, emoji: data.emoji, userName: data.userName }
                  : r
              );
              return { ...msg, reactions: newReactions };
            } else {
              // Add new reaction
              const newReactions = [...reactions, { 
                userId: data.userId, 
                emoji: data.emoji, 
                userName: data.userName 
              }];
              return { ...msg, reactions: newReactions };
            }
          }
          return msg;
        })
      );
    } else {
      console.log('WEB: Reaction event for different chat:', data.chatId, 'current chat:', chatId);
    }
  }, [chatId]);

  const handleReactionRemoved = useCallback((data) => {
    console.log('🗑️ WEB: Received reaction_removed event:', data);
    
    if (data.chatId === chatId) {
      console.log('✅ WEB: Removing reaction from message:', data.messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === data.messageId) {
            const reactions = msg.reactions || [];
            const newReactions = reactions.filter(r => r.userId !== data.userId);
            return { ...msg, reactions: newReactions };
          }
          return msg;
        })
      );
    } else {
      console.log('WEB: Reaction removal event for different chat:', data.chatId, 'current chat:', chatId);
    }
  }, [chatId]);

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
      console.log('🔥 WEB: Adding reaction:', emoji, 'to message:', messageId);
      
      // Check existing reaction first
      const currentMessage = messages.find(msg => String(msg._id) === String(messageId));
      const existingReaction = currentMessage?.reactions?.find(r => r.userId === user._id);
      
      // Update message locally first for immediate feedback
      setMessages(prevMsgs => prevMsgs.map(msg => {
        if (String(msg._id) === String(messageId)) {
          const reactions = msg.reactions || [];
          
          if (existingReaction) {
            if (existingReaction.emoji === emoji) {
              // Remove reaction if same emoji is tapped
              const newReactions = reactions.filter(r => r.userId !== user._id);
              return { ...msg, reactions: newReactions };
            } else {
              // Replace existing reaction with new emoji
              const newReactions = reactions.map(r => 
                r.userId === user._id 
                  ? { ...r, emoji, userName: user.name }
                  : r
              );
              return { ...msg, reactions: newReactions };
            }
          } else {
            // Add new reaction
            const newReactions = [...reactions, { userId: user._id, emoji, userName: user.name }];
            return { ...msg, reactions: newReactions };
          }
        }
        return msg;
      }));
      
      // Emit socket event for real-time sync
      if (existingReaction && existingReaction.emoji === emoji) {
        // Remove reaction
        socketService.removeReaction(chatId, messageId, user._id, emoji);
      } else {
        // Add/replace reaction
        socketService.addReaction(chatId, messageId, user._id, emoji, user.name);
      }
      
      // Also call API for persistence
      const response = await api.reactToMessage(chatId, messageId, emoji);
      if (!response.success) {
        console.error('API reaction failed:', response);
      }
    } catch (error) {
      console.error('React to message error:', error);
    }
  };

  const handleMessageDelete = (messageId) => {
    // Remove the deleted message from state
    setMessages(prevMsgs => prevMsgs.filter(msg => msg._id !== messageId));
  };

  const handleDeleteChat = async () => {
    setDeleting(true);
    try {
      const response = await api.deleteChat(chatId);
      if (response.success) {
        // Notify parent component that chat was deleted
        if (onChatDeleted) {
          onChatDeleted(chatId);
        }
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      setError('Чат устгахад алдаа гарлаа');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
      socketService.on('reaction_added', handleReactionAdded);
      socketService.on('reaction_removed', handleReactionRemoved);
      
      // Add test reaction listener
      socketService.on('test_reaction_received', (data) => {
        console.log('🧪 WEB: Test reaction received:', data);
      });
      
      // Add debug listeners to verify socket connection
      socketService.on('connect', () => {
        console.log('🔌 WEB: Socket connected successfully');
      });
      
      socketService.on('disconnect', () => {
        console.log('🔌 WEB: Socket disconnected');
      });
      
      socketService.on('chat_joined', (data) => {
        console.log('✅ WEB: Chat room joined successfully:', data);
      });
      
      return () => {
        // Leave chat room and stop typing
        socketService.leaveChat(chatId);
        socketService.stopTyping(chatId);
        socketService.off('new_message', handleNewMessage);
        socketService.off('user_typing', handleUserTyping);
        socketService.off('reaction_added', handleReactionAdded);
        socketService.off('reaction_removed', handleReactionRemoved);
        socketService.off('test_reaction_received');
      };
    }
  }, [chatId, handleNewMessage, handleUserTyping, handleReactionAdded, handleReactionRemoved, loadChat, loadMessages]);

  const handleSendMessage = async (text) => {
    try {
      let response;
      if (replyingTo) {
        response = await api.replyToMessage(chatId, replyingTo._id, { content: { text } });
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
        
        // Manually update sidebar with new message
        if (updateChatListWithNewMessage) {
          updateChatListWithNewMessage(chatId, newMessage);
        }
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
    <div className={`flex flex-col h-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark rounded-2xl shadow-lg overflow-hidden ${isMobile ? 'mobile-chat-window' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-background dark:bg-background-dark shadow-sm border-b border-border dark:border-border-dark ${isMobile ? 'mobile-chat-header' : ''}`}>
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {isMobile && (
            <button
              onClick={onBack}
              className="mobile-back-button flex-shrink-0"
              title="Буцах"
            >
              <ArrowLeft className="w-5 h-5 text-foreground dark:text-foreground-dark" />
            </button>
          )}
          <img 
            src={getChatAvatar()} 
            alt={getChatTitle()}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-border dark:border-border-dark flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm md:text-base truncate">{getChatTitle()}</h2>
            <p className="text-xs text-secondary dark:text-secondary-dark">{getChatStatus()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
            title="Мессеж хайх"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          {!isMobile && (
            <>
              <button className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors" title="Дуудах">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors" title="Видео дуудах">
                <Video className="w-5 h-5" />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-500"
            title="Чат устгах"
          >
            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background dark:bg-background-dark px-2 py-4 md:px-8 md:py-6">
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
            loadMore={loadMoreMessages}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onMessageDelete={handleMessageDelete}
          />
        )}
      </div>
      {/* Typing Indicator */}
      {getTypingIndicator()}
      {/* Input (reply preview is now handled in MessageInput) */}
      <div className="border-t border-border dark:border-border-dark bg-background dark:bg-background-dark shadow-lg">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-border dark:border-border-dark">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-foreground-dark">Чат устгах</h3>
                <p className="text-sm text-secondary dark:text-secondary-dark">Энэ үйлдлийг буцааж болохгүй</p>
              </div>
            </div>
            <p className="text-sm text-foreground dark:text-foreground-dark mb-6">
              Та энэ чатыг устгахдаа итгэлтэй байна уу? Бүх мессежүүд устгагдах болно.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark transition-colors disabled:opacity-50"
              >
                Болих
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Устгаж байна...
                  </>
                ) : (
                  'Устгах'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow; 
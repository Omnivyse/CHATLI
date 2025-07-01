import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import api from '../services/api';

const SCROLL_THRESHOLD = 100; // px from bottom to consider 'near bottom'

const MessageList = ({ messages, currentUserId, chatId, onReply, onReact, reactionTarget, setReactionTarget, loadMore, loadingMore, hasMore, onMessageDelete }) => {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [localMessages, setLocalMessages] = useState(messages);
  const prevMessagesLength = useRef(messages.length);
  const prevScrollHeight = useRef(0);

  // Update local messages when prop changes
  React.useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Track if user is near the bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD);
    // Infinite scroll: if at the very top, load more
    if (scrollTop === 0 && hasMore && loadMore && !loadingMore) {
      prevScrollHeight.current = scrollRef.current.scrollHeight;
      loadMore();
    }
  };

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (loadingMore && scrollRef.current) {
      prevScrollHeight.current = scrollRef.current.scrollHeight;
    }
  }, [loadingMore]);

  useEffect(() => {
    if (loadingMore && scrollRef.current && localMessages.length > prevMessagesLength.current) {
      // Restore scroll position after loading more
      const diff = scrollRef.current.scrollHeight - prevScrollHeight.current;
      scrollRef.current.scrollTop = diff;
    } else if (autoScroll && bottomRef.current && !loadingMore) {
      // Only scroll to bottom if not loading more
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
    prevMessagesLength.current = localMessages.length;
  }, [localMessages, autoScroll, loadingMore]);

  const handleReply = (message) => {
    if (onReply) onReply(message);
  };

  const handleReact = (messageId, emoji) => {
    if (onReact) onReact(messageId, emoji);
  };

  const handleDelete = async (messageId) => {
    try {
      const response = await api.deleteMessage(chatId, messageId);
      if (response.success) {
        // Remove message from local state immediately
        setLocalMessages(prev => prev.filter(msg => msg._id !== messageId));
        console.log('Message deleted:', messageId);
        // Notify parent component
        if (onMessageDelete) {
          onMessageDelete(messageId);
        }
      }
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const renderMessage = (message, index) => {
    const user = message.sender;
    const isOwnMessage = message.sender._id === currentUserId;
    return (
      <div key={message._id} className="animate-fade-in">
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`}>
              <MessageBubble 
                message={message}
                isOwnMessage={isOwnMessage}
                user={user}
                onReply={handleReply}
                onReact={handleReact}
                onDelete={handleDelete}
                reactionTarget={reactionTarget}
                setReactionTarget={setReactionTarget}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 md:px-4 py-2 md:py-4 space-y-6"
    >
      {/* Loading spinner for infinite scroll */}
      {loadingMore && (
        <div className="flex justify-center items-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary dark:border-primary-dark"></div>
        </div>
      )}
      {localMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-secondary">
          <div className="text-center">
            <p className="text-sm">Энд хэлэлцэх</p>
            <p className="text-xs">Зурвасаа бичнэ үү</p>
          </div>
        </div>
      ) : (
        localMessages.map((message, index) => (
          <div key={message._id} className="animate-fade-in">
            {renderMessage(message, index)}
          </div>
        ))
      )}
      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList; 
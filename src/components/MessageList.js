import React, { useRef, useEffect, useState } from 'react';
import { formatMongolianTime } from '../utils/dateUtils';
import MessageBubble from './MessageBubble';
import api from '../services/api';

const MessageList = ({ messages, currentUserId, chatId, onReply, onReact, reactionTarget, setReactionTarget }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        // Remove message from list
        console.log('Message deleted:', messageId);
      }
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const renderMessage = (message, index) => {
    const user = message.sender;
    const isOwnMessage = message.sender._id === currentUserId;
    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].sender._id !== message.sender._id);

    return (
      <div key={message._id} className="animate-fade-in">
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
            {showAvatar && (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            )}
            {!showAvatar && !isOwnMessage && (
              <div className="w-8 flex-shrink-0"></div>
            )}
            
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
              {/* Reply Preview */}
              {message.replyTo && (
                <div className={`mb-1 p-2 bg-muted dark:bg-muted-dark rounded-lg text-xs max-w-[200px] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  <div className="font-medium text-secondary">{message.replyTo.sender?.name}</div>
                  <div className="truncate">{message.replyTo.content.text}</div>
                </div>
              )}
              
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
              
              {/* Replies */}
              {message.replies && message.replies.length > 0 && (
                <div className="thread-indent mt-2 space-y-2">
                  {message.replies.map((reply) => {
                    const replyUser = reply.sender;
                    const isOwnReply = reply.sender._id === currentUserId;
                    
                    return (
                      <div key={reply._id} className={`flex ${isOwnReply ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex ${isOwnReply ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[60%]`}>
                          <img 
                            src={replyUser.avatar} 
                            alt={replyUser.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                          <div className={`flex flex-col ${isOwnReply ? 'items-end' : 'items-start'}`}>
                            <MessageBubble 
                              message={reply}
                              isOwnMessage={isOwnReply}
                              user={replyUser}
                              onReply={handleReply}
                              onReact={handleReact}
                              onDelete={handleDelete}
                              reactionTarget={reactionTarget}
                              setReactionTarget={setReactionTarget}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-2 md:px-4 py-2 md:py-4 space-y-6"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-secondary">
          <div className="text-center">
            <p className="text-sm">Энд хэлэлцэх</p>
            <p className="text-xs">Зурвасаа бичнэ үү</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div key={message._id} className="animate-fade-in">
            {renderMessage(message, index)}
          </div>
        ))
      )}
    </div>
  );
};

export default MessageList; 
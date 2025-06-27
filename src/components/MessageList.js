import React, { useRef, useEffect } from 'react';
import { formatMongolianTime } from '../utils/dateUtils';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, currentUserId }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessage = (message, index) => {
    const user = message.sender;
    const isOwnMessage = message.sender._id === currentUserId;
    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].sender._id !== message.sender._id);

    return (
      <div key={message._id} className="mb-4">
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
              <MessageBubble 
                message={message}
                isOwnMessage={isOwnMessage}
                user={user}
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
                            <div className={`chat-bubble ${isOwnReply ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                              <p className="text-sm">{reply.content.text}</p>
                            </div>
                            <span className="text-xs text-secondary mt-1">
                              {formatMongolianTime(reply.createdAt)}
                            </span>
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
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-secondary">
          <div className="text-center">
            <p className="text-sm">Энд хэлэлцэх</p>
            <p className="text-xs">Зурган дээр дарж зургаа илгээх</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => renderMessage(message, index))
      )}
    </div>
  );
};

export default MessageList; 
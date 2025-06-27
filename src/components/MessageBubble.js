import React, { useState } from 'react';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatMongolianTime } from '../utils/dateUtils';

const MessageBubble = ({ message, isOwnMessage, user }) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleReply = () => {
    // TODO: Implement reply functionality
    console.log('Reply to message:', message._id);
    setShowOptions(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content.text);
    setShowOptions(false);
  };

  return (
    <div className="relative group">
      <div className={`chat-bubble ${isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
        <p className="text-sm mongolian-text">{message.content.text}</p>
      </div>
      
      <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <span className="text-xs text-secondary">
          {formatMongolianTime(message.createdAt)}
        </span>
        
        {message.readBy && message.readBy.length > 0 && isOwnMessage && (
          <span className="text-xs text-secondary">✓✓</span>
        )}
      </div>

      {/* Message Options */}
      <div className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 shadow-lg">
          <button
            onClick={handleReply}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Хариулах"
          >
            <MessageCircle className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Нэмэлт"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dropdown Options */}
      {showOptions && (
        <div className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} bg-background border border-border rounded-lg p-2 shadow-lg z-10 min-w-[120px]`}>
          <button
            onClick={handleReply}
            className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors"
          >
            Хариулах
          </button>
          <button
            onClick={handleCopy}
            className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors"
          >
            Хуулах
          </button>
          {isOwnMessage && (
            <button
              onClick={() => setShowOptions(false)}
              className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors text-red-500"
            >
              Устгах
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble; 
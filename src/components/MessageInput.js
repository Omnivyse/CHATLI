import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X
} from 'lucide-react';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop, replyingTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (onTypingStop) {
        onTypingStop();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }

    // Handle typing indicators
    if (onTypingStart && onTypingStop) {
      if (newValue.trim()) {
        onTypingStart();
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing indicator after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          onTypingStop();
        }, 2000);
      } else {
        onTypingStop();
      }
    }
  };



  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);



  return (
    <div className="border-t border-border dark:border-border-dark bg-background dark:bg-background-dark p-4">
      {/* Reply preview */}
      {replyingTo && (
        <div className="max-w-4xl mx-auto flex items-center gap-3 mb-2 bg-muted/50 dark:bg-muted-dark/50 px-3 py-2 rounded-lg">
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
            onClick={onCancelReply} 
            className="flex-shrink-0 p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark text-secondary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Зурвасаа бичнэ үү..."
            className="w-full bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark rounded-2xl px-4 py-3 border-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark resize-none overflow-hidden mongolian-text text-sm leading-relaxed"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 shadow-sm ${
            message.trim() 
              ? 'bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
              : 'bg-muted dark:bg-muted-dark text-secondary dark:text-secondary-dark cursor-not-allowed'
          }`}
          title="Илгээх"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput; 
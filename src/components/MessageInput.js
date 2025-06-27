import React, { useState, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Mic, 
  MicOff,
  Paperclip,
  X
} from 'lucide-react';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
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
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
    console.log('Voice recording:', !isRecording);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implement image upload functionality
      console.log('Image uploaded:', file);
    }
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😎', '🤔', '😢', '😡'];

  return (
    <div className="input-area">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 bg-background border border-border rounded-lg p-2 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-secondary">Эможи</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="p-2 hover:bg-muted rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Picker */}
      {showImagePicker && (
        <div className="absolute bottom-full left-4 mb-2 bg-background border border-border rounded-lg p-2 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-secondary">Зураг</span>
            <button
              onClick={() => setShowImagePicker(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="block px-3 py-2 text-sm hover:bg-muted rounded cursor-pointer"
          >
            Галерейас сонгох
          </label>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 w-full">
        {/* Attachment Button */}
        <button
          onClick={() => setShowImagePicker(!showImagePicker)}
          className="emoji-button"
          title="Хавсаргах"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="emoji-button"
          title="Эможи"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Зурган дээр дарж зургаа илгээх..."
            className="message-input mongolian-text"
            rows={1}
          />
        </div>

        {/* Voice Button */}
        <button
          onClick={handleVoiceToggle}
          className={`voice-button ${isRecording ? 'bg-red-500' : ''}`}
          title={isRecording ? 'Дуу бичлэгийг зогсоох' : 'Дуу бичлэг'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={`p-2 rounded-full transition-colors ${
            message.trim() 
              ? 'bg-primary text-primary-dark hover:bg-primary/90' 
              : 'bg-muted text-secondary cursor-not-allowed'
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
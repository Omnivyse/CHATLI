import React, { useState } from 'react';
import { MessageCircle, MoreHorizontal, Heart, Smile } from 'lucide-react';
import { formatMongolianTime } from '../utils/dateUtils';

const MessageBubble = ({ message, isOwnMessage, user, onReply, onReact, onDelete, reactionTarget, setReactionTarget }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    setShowOptions(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content.text);
    setShowOptions(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message._id);
    }
    setShowOptions(false);
  };

  const handleReaction = (emoji) => {
    if (onReact) {
      onReact(message._id, emoji);
    }
    setShowReactions(false);
  };

  const getReactionCounts = () => {
    if (!message.reactions || message.reactions.length === 0) return {};
    
    const counts = {};
    message.reactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

  const reactionCounts = getReactionCounts();
  const hasReactions = Object.keys(reactionCounts).length > 0;

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 animate-fade-in`}>
      {/* Message bubble */}
      <div className={`chat-bubble ${isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'} px-5 py-3 rounded-3xl shadow-none border-none text-base font-normal ${isOwnMessage ? 'bg-primary/10 dark:bg-white/10 text-foreground dark:text-white' : 'bg-white dark:bg-background-dark text-foreground dark:text-white'}`}> 
        <p className="mongolian-text leading-relaxed">{message.content.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-secondary opacity-70">
            {formatMongolianTime(message.createdAt)}
          </span>
          {message.readBy && message.readBy.length > 0 && isOwnMessage && (
            <span className="text-xs text-secondary opacity-70">✓✓</span>
          )}
        </div>
        {/* Reactions display */}
        {hasReactions && (
          <div className="flex gap-1 mt-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} className="text-lg select-none">
                {emoji} {count > 1 && <span className="text-xs">{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Actions: reply and react, always visible, horizontally aligned */}
      <div className="flex flex-row gap-2 mb-2 relative">
        <button
          onClick={onReply ? () => onReply(message) : undefined}
          className="p-1 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors text-secondary dark:text-secondary-dark"
          title="Хариулах"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        <button
          onClick={setReactionTarget ? () => setReactionTarget(message._id) : undefined}
          className="p-1 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors text-secondary dark:text-secondary-dark"
          title="Реакц"
        >
          <Smile className="w-4 h-4" />
        </button>
        {/* Emoji picker */}
        {reactionTarget === message._id && (
          <div className="absolute z-10 bottom-8 left-0 bg-white dark:bg-background-dark border border-border dark:border-border-dark rounded-xl shadow p-2 flex gap-1">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                className="text-xl hover:scale-125 transition-transform"
                onClick={() => {
                  if (onReact) onReact(message._id, emoji);
                  if (setReactionTarget) setReactionTarget(null);
                }}
              >
                {emoji}
              </button>
            ))}
            <button className="ml-1 text-secondary text-xs" onClick={() => setReactionTarget && setReactionTarget(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 
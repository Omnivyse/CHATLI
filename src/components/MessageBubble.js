import React, { useState } from 'react';
import { MessageCircle, MoreHorizontal, Heart, Smile, Trash2 } from 'lucide-react';
import { formatMongolianTime } from '../utils/dateUtils';

const MessageBubble = ({ message, isOwnMessage, user, onReply, onReact, onDelete, reactionTarget, setReactionTarget }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showUnsendConfirm, setShowUnsendConfirm] = useState(false);

  // Close emoji picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionTarget === message._id && !event.target.closest('.emoji-picker')) {
        setReactionTarget && setReactionTarget(null);
      }
    };

    if (reactionTarget === message._id) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [reactionTarget, message._id, setReactionTarget]);

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

  const handleUnsend = () => {
    if (onDelete) {
      onDelete(message._id);
    }
    setShowUnsendConfirm(false);
  };

  const handleReaction = (emoji) => {
    console.log('Reaction clicked:', emoji, 'for message:', message._id);
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

  // Limit the number of reactions displayed to prevent overflow
  const displayReactions = Object.entries(reactionCounts).slice(0, 5);
  const hasMoreReactions = Object.keys(reactionCounts).length > 5;

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 w-full`}>
      {/* Avatar */}
      <img
        src={user.avatar}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      {/* Message and actions */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} w-full`}>
        {/* Reply preview above the bubble */}
        {message.replyTo && (
          <div
            className={`mb-1 flex flex-col max-w-[220px] bg-muted dark:bg-muted-dark rounded-lg text-xs ${isOwnMessage ? 'ml-auto' : ''}`}
            style={{ borderLeft: '3px solid #60a5fa', padding: '6px 10px 6px 10px', marginTop: 2 }}
          >
            <span className="font-semibold text-blue-600 dark:text-blue-400 truncate" style={{ fontSize: '12px' }}>
              {message.replyTo.sender?.name}
            </span>
            <span className="truncate text-secondary dark:text-secondary-dark" style={{ fontSize: '12px', marginTop: 1 }}>
              {message.replyTo.content?.text}
            </span>
          </div>
        )}
        {/* Bubble and actions in a row */}
        <div className="flex items-start gap-2">
          {/* Message bubble with relative positioning for picker anchor */}
          <div className="relative">
            <div className={`chat-bubble ${isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'} px-5 py-3 rounded-3xl shadow-none border-none text-base font-normal ${isOwnMessage ? 'bg-primary/10 dark:bg-white/10 text-foreground dark:text-white' : 'bg-white dark:bg-background-dark text-foreground dark:text-white'}`}
              style={{minWidth: 60, maxWidth: 320}}
            >
              {/* Timestamp at top */}
              <span className={`absolute text-xs text-secondary opacity-70 ${isOwnMessage ? 'right-3 top-2' : 'left-3 top-2'}`}>{formatMongolianTime(message.createdAt)}</span>
              <p className="mongolian-text leading-relaxed pt-1">{message.content.text}</p>
              {/* Emoji picker anchored to bubble bottom right/left */}
              {reactionTarget === message._id && (
                <>
                  {/* Mobile backdrop */}
                  <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setReactionTarget && setReactionTarget(null)} />
                  <div className={`absolute z-50 ${isOwnMessage ? 'right-0' : 'left-0'} bottom-0 translate-y-full mt-2`}>
                    <div className="bg-white dark:bg-background-dark border border-border dark:border-border-dark rounded-xl shadow-lg p-2 flex gap-1 min-w-[200px] justify-center">
                      {quickReactions.map(emoji => (
                        <button
                          key={emoji}
                          className="emoji-picker-button hover:scale-110 transition-transform"
                          onClick={() => {
                            console.log('Emoji clicked:', emoji, 'for message:', message._id);
                            if (onReact) onReact(message._id, emoji);
                            if (setReactionTarget) setReactionTarget(null);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button 
                        className="ml-2 text-secondary text-xs hover:text-primary dark:hover:text-primary-dark transition-colors p-1 rounded hover:bg-muted dark:hover:bg-muted-dark" 
                        onClick={() => setReactionTarget && setReactionTarget(null)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Reactions absolutely positioned at bubble corner */}
            {hasReactions && (
              <div className={`absolute ${isOwnMessage ? 'left-1' : 'right-1'} -bottom-5 flex gap-1`}>
                {displayReactions.map(([emoji, count]) => (
                  <span key={emoji} className="reaction-badge">
                    {emoji} {count > 1 && <span className="text-xs">{count}</span>}
                  </span>
                ))}
                {hasMoreReactions && (
                  <span className="reaction-badge">+{Object.keys(reactionCounts).length - 5}</span>
                )}
              </div>
            )}
          </div>
          {/* Actions: reply, react, and unsend */}
          <div className="flex flex-col gap-1 items-center justify-start mt-2">
            <button
              onClick={onReply ? () => onReply(message) : undefined}
              className="message-action-button"
              title="Хариулах"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReactionTarget(message._id)}
              className="message-action-button"
              title="Реакц"
            >
              <Smile className="w-4 h-4" />
            </button>
            {/* Unsend button for own messages */}
            {isOwnMessage && (
              <button
                onClick={() => setShowUnsendConfirm(true)}
                className="message-action-button text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Буцаах"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unsend Confirmation Modal */}
      {showUnsendConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-border dark:border-border-dark">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-foreground-dark">Зурвас буцаах</h3>
                <p className="text-sm text-secondary dark:text-secondary-dark">Энэ үйлдлийг буцааж болохгүй</p>
              </div>
            </div>
            <p className="text-sm text-foreground dark:text-foreground-dark mb-6">
              Та энэ зурвасыг буцаахдаа итгэлтэй байна уу? Зурвас бүх хэрэглэгчдээс устгагдах болно.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnsendConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark transition-colors"
              >
                Болих
              </button>
              <button
                onClick={handleUnsend}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Буцаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble; 
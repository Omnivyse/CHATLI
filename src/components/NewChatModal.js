import React, { useState, useEffect } from 'react';
import { X, Loader2, MessageCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const NewChatModal = ({ user, onClose, onChatCreated }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingChat, setCreatingChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.getFollowing();
      if (response.success) {
        setFollowing(response.data.following);
      } else {
        setError('Дагагчдыг ачаалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Fetch following error:', error);
      setError('Дагагчдыг ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (targetUser) => {
    setCreatingChat(targetUser._id);
    
    try {
      // Check if chat already exists
      const existingChats = await api.getChats();
      if (existingChats.success) {
        const existingChat = existingChats.data.chats.find(chat => 
          chat.type === 'direct' && 
          chat.participants.some(p => p._id === targetUser._id)
        );
        
        if (existingChat) {
          // Chat already exists, just open it
          onChatCreated(existingChat._id);
          onClose();
          return;
        }
      }

      // Create new chat
      const response = await api.createChat({
        type: 'direct',
        participants: [targetUser._id]
      });
      
      if (response.success) {
        onChatCreated(response.data.chat._id);
        onClose();
      } else {
        setError('Чат үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      setError('Чат үүсгэхэд алдаа гарлаа');
    } finally {
      setCreatingChat(null);
    }
  };

  const filteredFollowing = following.filter(followedUser =>
    followedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    followedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden border border-border dark:border-border-dark"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Шинэ чат эхлэх
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
            >
              <X className="w-5 h-5 text-foreground dark:text-foreground-dark" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border dark:border-border-dark">
            <input
              type="text"
              placeholder="Хэрэглэгч хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary dark:text-primary-dark" />
                <span className="ml-2 text-secondary dark:text-secondary-dark">
                  Ачаалж байна...
                </span>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500 text-sm mb-2">{error}</p>
                <button
                  onClick={fetchFollowing}
                  className="text-primary dark:text-primary-dark hover:underline text-sm"
                >
                  Дахин оролдох
                </button>
              </div>
            ) : filteredFollowing.length === 0 ? (
              <div className="p-8 text-center">
                <UserIcon className="w-12 h-12 text-secondary dark:text-secondary-dark mx-auto mb-3" />
                <p className="text-secondary dark:text-secondary-dark text-sm">
                  {searchQuery ? 'Хайлтын илэрц олдсонгүй' : 'Та хэнийг ч дагаагүй байна'}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-secondary dark:text-secondary-dark mt-1">
                    Хэрэглэгчдийг дагаж чат эхлүүлээрэй
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {filteredFollowing.map((followedUser) => (
                  <div
                    key={followedUser._id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted dark:hover:bg-muted-dark transition-colors cursor-pointer"
                    onClick={() => handleStartChat(followedUser)}
                  >
                    <div className="relative">
                      {followedUser.avatar ? (
                        <img
                          src={followedUser.avatar}
                          alt={followedUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
                          <img src="/img/logo.png" alt="CHATLI Logo" className="w-5 h-5 object-contain" />
                        </div>
                      )}
                      {/* Online status indicator */}
                      <div 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background dark:border-background-dark ${
                          followedUser.status === 'online' 
                            ? 'bg-black dark:bg-white' 
                            : 'bg-gray-400 dark:bg-gray-400'
                        }`}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground dark:text-foreground-dark truncate">
                        {followedUser.name}
                      </h3>
                      <p className="text-sm text-secondary dark:text-secondary-dark truncate">
                        @{followedUser.username}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {creatingChat === followedUser._id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary dark:text-primary-dark" />
                      ) : (
                        <MessageCircle className="w-5 h-5 text-primary dark:text-primary-dark" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && filteredFollowing.length > 0 && (
            <div className="p-4 border-t border-border dark:border-border-dark">
              <p className="text-xs text-secondary dark:text-secondary-dark text-center">
                {filteredFollowing.length} хэрэглэгч боломжтой
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal; 
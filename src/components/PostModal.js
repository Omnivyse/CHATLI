import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { X, Trash, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomVideoPlayer from './CustomVideoPlayer';

const PostModal = ({ postId, user, onClose, onPostUpdate, show = true, settingsModalOpen }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, commentId: null });
  const [currentMedia, setCurrentMedia] = useState(0);
  const [secretPasswordModalOpen, setSecretPasswordModalOpen] = useState(false);
  const [isSecretPostUnlocked, setIsSecretPostUnlocked] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.getPost(postId);
      if (res.success) {
        const fetchedPost = res.data.post;
        setPost(fetchedPost);
        
        // Check if this is a secret post and user needs to verify
        if (fetchedPost.isSecret && fetchedPost.author._id !== user._id) {
          // Check if user has already verified this post
          const hasVerified = fetchedPost.passwordVerifiedUsers && 
            fetchedPost.passwordVerifiedUsers.includes(user._id);
          
          if (!hasVerified) {
            setSecretPasswordModalOpen(true);
            return;
          } else {
            setIsSecretPostUnlocked(true);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecretPostPassword = async (password) => {
    try {
      console.log('🔐 Verifying password for post:', post._id);
      const response = await api.verifySecretPostPassword(post._id, password);
      console.log('🔐 Server response:', response);
      if (response.success) {
        // Update local post with server response to include the user in passwordVerifiedUsers
        console.log('✅ Password verified, updating local post with:', response.data.post);
        setPost(response.data.post);
        setIsSecretPostUnlocked(true);
        setSecretPasswordModalOpen(false);
        setSecretPassword('');
      }
    } catch (error) {
      console.error('❌ Password verification failed:', error);
      
      // Handle rate limiting responses
      if (error.status === 429) {
        // Rate limited - show retry after message
        const retryAfter = error.data?.retryAfter || 480; // Default to 8 minutes
        const minutes = Math.ceil(retryAfter / 60);
        alert(`Too many attempts. Please try again in ${minutes} minutes.`);
      } else if (error.status === 401) {
        // Wrong password - show attempts remaining
        const attemptsRemaining = error.data?.attemptsRemaining || 0;
        if (attemptsRemaining > 0) {
          alert(`Incorrect password. ${attemptsRemaining} attempts remaining.`);
        } else {
          alert(error.message || 'Failed to verify password');
        }
      } else {
        // Other errors
        alert(error.message || 'Failed to verify password');
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await api.commentOnPost(postId, comment);
      setComment('');
      fetchPost();
      onPostUpdate && onPostUpdate();
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteConfirm.commentId) return;
    await api.deleteComment(postId, deleteConfirm.commentId);
    setDeleteConfirm({ show: false, commentId: null });
    fetchPost();
  };

  const handleMediaNavigation = (direction) => {
    const mediaArray = Array.isArray(post.media) ? post.media : [];
    if (mediaArray.length > 1) {
      if (direction === 'next') {
        setCurrentMedia((currentMedia + 1) % mediaArray.length);
      } else {
        setCurrentMedia((currentMedia - 1 + mediaArray.length) % mediaArray.length);
      }
    }
  };

  if (loading || !post) {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            key="post-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm"
          >
            <motion.div
              key="post-modal-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.28 }}
              className="bg-background dark:bg-background-dark rounded-lg shadow-xl p-8 border border-border dark:border-border-dark"
            >
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="post-modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="post-modal-box"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.28 }}
            className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-lg w-full p-6 relative border border-border dark:border-border-dark"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark z-50">
              <X className="w-5 h-5 text-foreground dark:text-foreground-dark" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
                  <span className="text-secondary dark:text-secondary-dark font-bold text-lg">{post.author.name[0]}</span>
                </div>
              )}
              <div>
                <div className="font-semibold text-foreground dark:text-foreground-dark">{post.author.name}</div>
                <div className="text-xs text-secondary dark:text-secondary-dark">{new Date(post.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-2 whitespace-pre-line text-foreground dark:text-foreground-dark">
              {post.isSecret && !isSecretPostUnlocked && post.author._id !== user._id ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 text-secondary dark:text-secondary-dark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-secondary dark:text-secondary-dark">Content is protected</p>
                </div>
              ) : (
                post.content
              )}
            </div>
            {/* Media carousel for new posts */}
            {Array.isArray(post.media) && post.media.length > 0 && !settingsModalOpen && !(post.isSecret && !isSecretPostUnlocked && post.author._id !== user._id) && (
              <div className="relative w-full flex flex-col items-center mb-2">
                <div className="relative w-full flex items-center justify-center">
                  {post.media.length > 1 && (
                    <button 
                      type="button" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleMediaNavigation('prev'); 
                      }} 
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-20 hover:bg-black/60 transition-colors cursor-pointer touch-button carousel-nav-button"
                      title="Өмнөх зураг"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {post.media[currentMedia].type === 'image' ? (
                    <img
                      src={post.media[currentMedia].url}
                      alt="post"
                      className="max-h-96 w-auto mx-auto rounded object-contain border border-border dark:border-border-dark"
                      style={{ maxWidth: '100%' }}
                    />
                  ) : (
                    <CustomVideoPlayer
                      src={post.media[currentMedia].url}
                      className="rounded border border-border dark:border-border-dark"
                      autoPlay={true}
                      hideControls={false}
                      minimalControls={true}
                      inModal={true}
                    />
                  )}
                  {post.media.length > 1 && (
                    <button 
                      type="button" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleMediaNavigation('next'); 
                      }} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-20 hover:bg-black/60 transition-colors cursor-pointer touch-button carousel-nav-button"
                      title="Дараагийн зураг"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
                {post.media.length > 1 && (
                  <div className="flex gap-1 mt-2 justify-center">
                    {post.media.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMedia(idx);
                        }}
                        className={`w-1 h-1 rounded-full cursor-pointer carousel-indicator ${idx === currentMedia ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-200 dark:bg-gray-700'}`}
                        title={`${idx + 1} зураг`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Fallback for legacy posts with image/video fields */}
            {(!post.media || post.media.length === 0) && post.image && !settingsModalOpen && !(post.isSecret && !isSecretPostUnlocked && post.author._id !== user._id) && (
              <img src={post.image} alt="post" className="max-h-96 w-auto mx-auto rounded mb-2 object-contain" style={{ maxWidth: '100%' }} />
            )}
            {(!post.media || post.media.length === 0) && post.video && !settingsModalOpen && !(post.isSecret && !isSecretPostUnlocked && post.author._id !== user._id) && (
              <CustomVideoPlayer
                src={post.video}
                autoPlay={true}
                hideControls={false}
                minimalControls={true}
                inModal={true}
                className="mb-2 rounded"
              />
            )}
            <div className="flex items-center gap-4 mb-2">
              <span className="flex items-center gap-1 text-secondary dark:text-secondary-dark">
                <span>Лайк:</span> <span>{post.likes.length}</span>
              </span>
              <span className="flex items-center gap-1 text-secondary dark:text-secondary-dark">
                <span>Сэтгэгдэл:</span> <span>{post.comments.length}</span>
              </span>
            </div>
            {/* Comments */}
            {!(post.isSecret && !isSecretPostUnlocked && post.author._id !== user._id) && (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-2">
              {post.comments.map(c => {
                const canDelete = user._id === c.author._id || user._id === post.author._id;
                return (
                  <div key={c._id || c.createdAt} className="flex items-start gap-2 group">
                    {c.author.avatar ? (
                      <img src={c.author.avatar} alt={c.author.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
                        <span className="text-secondary dark:text-secondary-dark font-bold text-sm">{c.author.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-foreground dark:text-foreground-dark">{c.author.name}</div>
                        <div className="text-xs text-secondary dark:text-secondary-dark">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-foreground dark:text-foreground-dark">{c.content}</div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirm({ show: true, commentId: c._id })}
                        className="p-1 ml-2 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                        title="Сэтгэгдэл устгах"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
            )}
            {/* Add Comment */}
            {!(post.isSecret && !isSecretPostUnlocked && post.author._id !== user._id) && (
              <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded border border-border dark:border-border-dark bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark"
                placeholder="Сэтгэгдэл бичих..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={commenting}
              />
              <button type="submit" className="bg-primary dark:bg-primary-dark text-primary-dark dark:text-primary px-3 py-2 rounded hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition" disabled={commenting || !comment.trim()}>
                Илгээх
                              </button>
              </form>
            )}
            {/* Custom Delete Confirmation Modal */}
            {deleteConfirm.show && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]">
                <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl p-6 max-w-xs w-full text-center border border-border dark:border-border-dark">
                  <div className="mb-4 text-lg text-foreground dark:text-foreground-dark">Сэтгэгдлийг устгах уу?</div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleDeleteComment}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >Тийм</button>
                    <button
                      onClick={() => setDeleteConfirm({ show: false, commentId: null })}
                      className="px-4 py-2 bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark rounded hover:bg-muted/80 dark:hover:bg-muted-dark/80"
                    >Үгүй</button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      {/* Secret Post Password Modal */}
      {secretPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]">
          <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full p-6 relative border border-border dark:border-border-dark" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">Secret Post</h2>
              <button
                onClick={() => {
                  setSecretPasswordModalOpen(false);
                  onClose();
                }}
                className="text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <svg className="w-12 h-12 mx-auto mb-4 text-primary dark:text-primary-dark" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-secondary dark:text-secondary-dark mb-2">This post is protected with a password</p>
              {post?.author?.name && (
                <p className="text-sm text-secondary dark:text-secondary-dark italic">Posted by {post.author.name}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                Enter 4-digit password:
              </label>
              <input
                type="text"
                value={secretPassword}
                onChange={(e) => setSecretPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full p-3 rounded-xl border border-border dark:border-border-dark bg-muted dark:bg-muted-dark focus:bg-white dark:focus:bg-background-dark focus:border-primary dark:focus:border-primary-dark focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-dark/20 transition text-center text-lg tracking-widest"
                placeholder="0000"
                maxLength={4}
                autoFocus
              />
              <p className="text-xs text-secondary dark:text-secondary-dark mt-2">Password must be exactly 4 digits</p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-muted dark:bg-muted-dark rounded hover:bg-muted/80 dark:hover:bg-muted-dark/80 text-foreground dark:text-foreground-dark"
                onClick={() => {
                  setSecretPasswordModalOpen(false);
                  onClose();
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary dark:bg-primary-dark text-primary-dark dark:text-primary rounded font-semibold hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition disabled:opacity-50"
                onClick={() => handleSecretPostPassword(secretPassword)}
                disabled={secretPassword.length !== 4}
              >
                View Post
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PostModal; 
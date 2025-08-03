import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Heart, MessageCircle, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import PostModal from './PostModal';
import UserProfileModal from './UserProfileModal';
import CustomVideoPlayer from './CustomVideoPlayer';
import { formatShortRelativeTime } from '../utils/dateUtils';

const Post = ({ post, user, onPostUpdate, settingsModalOpen, onStartChat }) => {
  const [showModal, setShowModal] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const videoRef = useRef(null);
  const isOwner = localPost.author._id === user._id;
  const isLiked = localPost.likes.includes(user._id);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(localPost.content);
  const [editLoading, setEditLoading] = useState(false);
  const [secretPasswordModalOpen, setSecretPasswordModalOpen] = useState(false);
  const [isSecretPostUnlocked, setIsSecretPostUnlocked] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');

  // Update local post when prop changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const handleLike = async () => {
    setLiking(true);
    try {
      const response = await api.likePost(localPost._id);
      if (response.success) {
        // Update local post state instead of refetching all posts
        setLocalPost(prevPost => ({
          ...prevPost,
          likes: response.data.likes
        }));
      }
    } catch (error) {
      console.error('Like post error:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Постыг устгах уу?')) {
      await api.deletePost(localPost._id);
      onPostUpdate && onPostUpdate();
    }
  };

  const handleOpenProfile = () => {
    console.log('DEBUG post.author:', localPost.author);
    setShowProfile(true);
  };

  const handleOpenModal = () => {
    if (videoRef.current && videoRef.current.pause) {
      videoRef.current.pause();
    }
    setShowModal(true);
  };

  const handleSecretPostPassword = async (password) => {
    try {
      const response = await api.verifySecretPostPassword(localPost._id, password);
      if (response.success) {
        setIsSecretPostUnlocked(true);
        setSecretPasswordModalOpen(false);
        setSecretPassword('');
        // Don't update the post with server data - keep local state only
      }
    } catch (error) {
      alert(error.message || 'Failed to verify password');
    }
  };

  const handleSecretPostPress = () => {
    // Check if user is the author
    if (localPost.author._id === user._id) {
      setIsSecretPostUnlocked(true);
      return;
    }
    
    // Show password modal - no persistent verification
    setSecretPasswordModalOpen(true);
  };

  const handleMediaNavigation = (direction) => {
    const mediaArray = Array.isArray(localPost.media) ? localPost.media : [];
    if (mediaArray.length > 1) {
      if (direction === 'next') {
        setCurrentMedia((currentMedia + 1) % mediaArray.length);
      } else {
        setCurrentMedia((currentMedia - 1 + mediaArray.length) % mediaArray.length);
      }
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark rounded-lg shadow dark:shadow-white/15 p-4 z-auto border border-border dark:border-border-dark">
      <div className="flex items-center gap-3 mb-2">
        <div className="cursor-pointer" onClick={handleOpenProfile}>
          {localPost.author.avatar ? (
            <img src={localPost.author.avatar} alt={localPost.author.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-secondary dark:text-secondary-dark" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold cursor-pointer text-foreground dark:text-foreground-dark" onClick={handleOpenProfile}>
              {localPost.author.name}
            </div>
            {localPost.author.isVerified && (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="text-xs text-secondary dark:text-secondary-dark">{formatShortRelativeTime(localPost.createdAt)}</div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="p-2 rounded hover:bg-muted dark:hover:bg-muted-dark"
              title="Илүү"
            >
              <MoreHorizontal className="w-5 h-5 text-foreground dark:text-foreground-dark" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded shadow-lg z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-muted-dark text-foreground dark:text-foreground-dark"
                  onClick={() => { setMenuOpen(false); setEditModalOpen(true); setEditContent(localPost.content); }}
                >Засах</button>
                <button
                  className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                  onClick={() => { setMenuOpen(false); handleDeletePost(); }}
                >Устгах</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className={`mb-2 whitespace-pre-line cursor-pointer hover:bg-muted/50 dark:hover:bg-muted-dark/50 rounded transition text-foreground dark:text-foreground-dark ${
          localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user._id ? 'relative' : ''
        }`}
        onClick={localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user._id ? handleSecretPostPress : () => setShowModal(true)}
      >
        <div className="flex items-start gap-2">
          {localPost.isSecret && localPost.author._id !== user._id && (
            <div className="flex-shrink-0 mt-1">
              <svg className={`w-4 h-4 ${
                isSecretPostUnlocked ? 'text-primary dark:text-primary-dark' : 'text-secondary dark:text-secondary-dark'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            {localPost.content}
          </div>
        </div>
        {localPost.isSecret && !isSecretPostUnlocked && localPost.author._id !== user._id && (
          <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white bg-black/40 rounded-lg p-4 backdrop-blur-sm">
              <svg className="w-8 h-8 mx-auto mb-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">Click to enter password</p>
            </div>
          </div>
        )}
      </div>
      {/* Media carousel for new posts */}
      {Array.isArray(localPost.media) && localPost.media.length > 0 && !settingsModalOpen && (
        localPost.isSecret && !isSecretPostUnlocked ? (
          <div 
            className="relative w-full h-48 bg-muted dark:bg-muted-dark rounded-lg border-2 border-dashed border-border dark:border-border-dark flex items-center justify-center cursor-pointer hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-all duration-200"
            onClick={handleSecretPostPress}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-background dark:bg-background-dark rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-8 h-8 text-secondary dark:text-secondary-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground dark:text-foreground-dark">Media hidden</p>
              <p className="text-xs text-secondary dark:text-secondary-dark mt-1">Enter password to view</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full flex flex-col items-center mb-2">
            <div className="relative w-full flex items-center justify-center">
              {localPost.media.length > 1 && (
                <button 
                  type="button" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleMediaNavigation('prev'); 
                  }} 
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur rounded-full border border-white/20 shadow hover:bg-black/70 hover:scale-110 transition-all text-white cursor-pointer touch-button carousel-nav-button"
                  title="Өмнөх зураг"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {localPost.media[currentMedia].type === 'image' ? (
                <img
                  src={localPost.media[currentMedia].url}
                  alt="post"
                  className="max-h-80 w-auto mx-auto rounded object-contain border border-border dark:border-border-dark cursor-pointer hover:opacity-80 transition"
                  onClick={() => setShowModal(true)}
                  style={{ maxWidth: '100%' }}
                />
              ) : (
                <CustomVideoPlayer
                  ref={videoRef}
                  src={localPost.media[currentMedia].url}
                  className="rounded border border-border dark:border-border-dark cursor-pointer hover:opacity-80 transition"
                  onClick={handleOpenModal}
                  muted={true}
                  hideControls={true}
                  autoPlayOnView={true}
                  playPauseOnly={true}
                />
              )}
              {localPost.media.length > 1 && (
                <button 
                  type="button" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleMediaNavigation('next'); 
                  }} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur rounded-full border border-white/20 shadow hover:bg-black/70 hover:scale-110 transition-all text-white cursor-pointer touch-button carousel-nav-button"
                  title="Дараагийн зураг"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
            {localPost.media.length > 1 && (
              <div className="flex gap-1 mt-2 justify-center">
                {localPost.media.map((_, idx) => (
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
        )
      )}
      {/* Fallback for legacy posts with image/video fields */}
      {(!localPost.media || localPost.media.length === 0) && localPost.image && !settingsModalOpen && (
        <img
          src={localPost.image}
          alt="post"
          className="max-h-80 w-auto mx-auto rounded mb-2 object-contain cursor-pointer hover:opacity-80 transition"
          onClick={() => setShowModal(true)}
          style={{ maxWidth: '100%' }}
        />
      )}
      {(!localPost.media || localPost.media.length === 0) && localPost.video && !settingsModalOpen && (
        <CustomVideoPlayer
          ref={videoRef}
          src={localPost.video}
          className="rounded mb-2 cursor-pointer hover:opacity-80 transition"
          onClick={handleOpenModal}
          muted={true}
          hideControls={true}
          autoPlayOnView={true}
          playPauseOnly={true}
        />
      )}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={handleLike} disabled={liking} className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-secondary dark:text-secondary-dark'}`}>
          <Heart fill={isLiked ? 'currentColor' : 'none'} className="w-5 h-5" />
          <span>{localPost.likes.length}</span>
        </button>
        <span
          className="flex items-center gap-1 text-secondary dark:text-secondary-dark cursor-pointer hover:text-primary dark:hover:text-primary-dark"
          onClick={() => setShowModal(true)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{localPost.comments.length}</span>
        </span>
      </div>
      {/* Comments are hidden by default */}
      {showModal && (
        <PostModal postId={localPost._id} user={user} onClose={() => setShowModal(false)} onPostUpdate={onPostUpdate} settingsModalOpen={settingsModalOpen} />
      )}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9998]">
          <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full p-6 relative border border-border dark:border-border-dark" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-foreground dark:text-foreground-dark">Пост засах</h2>
            <textarea
              className="w-full p-3 rounded-xl border border-border dark:border-border-dark bg-muted dark:bg-muted-dark focus:bg-white dark:focus:bg-background-dark focus:border-primary dark:focus:border-primary-dark focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-dark/20 transition placeholder:text-secondary dark:placeholder:text-secondary-dark text-base resize-none min-h-[60px] mb-4 text-foreground dark:text-foreground-dark"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-muted dark:bg-muted-dark rounded hover:bg-muted/80 dark:hover:bg-muted-dark/80 text-foreground dark:text-foreground-dark"
                onClick={() => setEditModalOpen(false)}
                disabled={editLoading}
              >Болих</button>
              <button
                className="px-4 py-2 bg-primary dark:bg-primary-dark text-primary-dark dark:text-primary rounded font-semibold hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition disabled:opacity-50"
                onClick={async () => {
                  setEditLoading(true);
                  try {
                    await api.updatePost(localPost._id, { content: editContent });
                    setEditModalOpen(false);
                    onPostUpdate && onPostUpdate();
                  } finally {
                    setEditLoading(false);
                  }
                }}
                disabled={editLoading || !editContent.trim()}
              >Хадгалах</button>
            </div>
          </div>
        </div>
      )}
      <UserProfileModal 
        userId={localPost.author._id} 
        currentUser={user} 
        onClose={() => setShowProfile(false)} 
        show={showProfile}
        onStartChat={onStartChat}
      />
      
      {/* Secret Post Password Modal */}
      {secretPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full p-6 relative border border-border dark:border-border-dark" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">Secret Post</h2>
              <button
                onClick={() => setSecretPasswordModalOpen(false)}
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
              {localPost.author?.name && (
                <p className="text-sm text-secondary dark:text-secondary-dark italic">Posted by {localPost.author.name}</p>
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
                onClick={() => setSecretPasswordModalOpen(false)}
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
    </div>
  );
};

export default Post; 
import React, { useState, useRef } from 'react';
import api from '../services/api';
import { Heart, MessageCircle, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import PostModal from './PostModal';
import UserProfileModal from './UserProfileModal';
import CustomVideoPlayer from './CustomVideoPlayer';

const Post = ({ post, user, onPostUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const videoRef = useRef(null);
  const isOwner = post.author._id === user._id;
  const isLiked = post.likes.includes(user._id);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);

  const handleLike = async () => {
    setLiking(true);
    try {
      await api.likePost(post._id);
      onPostUpdate && onPostUpdate();
    } finally {
      setLiking(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Постыг устгах уу?')) {
      await api.deletePost(post._id);
      onPostUpdate && onPostUpdate();
    }
  };

  const handleOpenProfile = () => {
    console.log('DEBUG post.author:', post.author);
    setShowProfile(true);
  };

  const handleOpenModal = () => {
    if (videoRef.current && videoRef.current.pause) {
      videoRef.current.pause();
    }
    setShowModal(true);
  };

  return (
    <div className="bg-background dark:bg-background-dark rounded-lg shadow p-4 z-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="cursor-pointer" onClick={handleOpenProfile}>
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-secondary dark:text-secondary-dark" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold cursor-pointer text-foreground dark:text-foreground-dark" onClick={handleOpenProfile}>{post.author.name}</div>
          <div className="text-xs text-secondary dark:text-secondary-dark">{new Date(post.createdAt).toLocaleString()}</div>
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
              <div className="absolute right-0 mt-2 w-32 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded shadow-lg z-10">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-muted-dark text-foreground dark:text-foreground-dark"
                  onClick={() => { setMenuOpen(false); setEditModalOpen(true); setEditContent(post.content); }}
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
        className="mb-2 whitespace-pre-line cursor-pointer hover:bg-muted/50 dark:hover:bg-muted-dark/50 rounded transition text-foreground dark:text-foreground-dark"
        onClick={() => setShowModal(true)}
      >
        {post.content}
      </div>
      {/* Media carousel for new posts */}
      {Array.isArray(post.media) && post.media.length > 0 && (
        <div className="relative w-full flex flex-col items-center mb-2 z-0">
          <div className="relative w-full flex items-center justify-center z-0">
            {post.media.length > 1 && (
              <button type="button" onClick={e => { e.stopPropagation(); setCurrentMedia((currentMedia - 1 + post.media.length) % post.media.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-0">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {post.media[currentMedia].type === 'image' ? (
              <img
                src={post.media[currentMedia].url}
                alt="post"
                className="max-h-64 rounded object-contain border border-border dark:border-border-dark cursor-pointer hover:opacity-80 transition z-0"
                onClick={() => setShowModal(true)}
              />
            ) : (
              <CustomVideoPlayer
                ref={videoRef}
                src={post.media[currentMedia].url}
                className="max-h-64 rounded w-full object-contain border border-border dark:border-border-dark cursor-pointer hover:opacity-80 transition z-0"
                onClick={handleOpenModal}
                muted={true}
                hideControls={true}
                autoPlayOnView={true}
                playPauseOnly={true}
              />
            )}
            {post.media.length > 1 && (
              <button type="button" onClick={e => { e.stopPropagation(); setCurrentMedia((currentMedia + 1) % post.media.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-0">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
          {post.media.length > 1 && (
            <div className="flex gap-1 mt-2 justify-center">
              {post.media.map((_, idx) => (
                <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === currentMedia ? 'bg-primary dark:bg-primary-dark' : 'bg-muted dark:bg-muted-dark'}`}></span>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Fallback for legacy posts with image/video fields */}
      {(!post.media || post.media.length === 0) && post.image && (
        <img
          src={post.image}
          alt="post"
          className="max-h-64 rounded mb-2 object-contain cursor-pointer hover:opacity-80 transition"
          onClick={() => setShowModal(true)}
        />
      )}
      {(!post.media || post.media.length === 0) && post.video && (
        <CustomVideoPlayer
          ref={videoRef}
          src={post.video}
          className="max-h-64 rounded mb-2 w-full cursor-pointer hover:opacity-80 transition"
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
          <span>{post.likes.length}</span>
        </button>
        <span
          className="flex items-center gap-1 text-secondary dark:text-secondary-dark cursor-pointer hover:text-primary dark:hover:text-primary-dark"
          onClick={() => setShowModal(true)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments.length}</span>
        </span>
      </div>
      {/* Comments are hidden by default */}
      {showModal && (
        <PostModal postId={post._id} user={user} onClose={() => setShowModal(false)} onPostUpdate={onPostUpdate} />
      )}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
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
                    await api.updatePost(post._id, { content: editContent });
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
      <UserProfileModal userId={post.author._id} currentUser={user} onClose={() => setShowProfile(false)} show={showProfile} />
    </div>
  );
};

export default Post; 
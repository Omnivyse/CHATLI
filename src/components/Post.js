import React, { useState, useRef } from 'react';
import api from '../services/api';
import { Heart, MessageCircle, Trash, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import PostModal from './PostModal';
import UserProfileModal from './UserProfileModal';
import CustomVideoPlayer from './CustomVideoPlayer';
import { motion } from 'framer-motion';

const Post = ({ post, user, onPostUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const videoRef = useRef(null);
  const isOwner = post.author._id === user._id;
  const isLiked = post.likes.includes(user._id);
  const [currentMedia, setCurrentMedia] = useState(0);

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
    <div className="bg-background rounded-lg shadow p-4 z-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="cursor-pointer" onClick={handleOpenProfile}>
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-secondary" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold cursor-pointer" onClick={handleOpenProfile}>{post.author.name}</div>
          <div className="text-xs text-secondary">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
        {isOwner && (
          <button onClick={handleDeletePost} className="p-2 rounded hover:bg-red-100 text-red-500" title="Пост устгах">
            <Trash className="w-5 h-5" />
          </button>
        )}
      </div>
      <div
        className="mb-2 whitespace-pre-line cursor-pointer hover:bg-muted/50 rounded transition"
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
                className="max-h-64 rounded object-contain border border-border cursor-pointer hover:opacity-80 transition z-0"
                onClick={() => setShowModal(true)}
              />
            ) : (
              <CustomVideoPlayer
                ref={videoRef}
                src={post.media[currentMedia].url}
                className="max-h-64 rounded w-full object-contain border border-border cursor-pointer hover:opacity-80 transition z-0"
                onClick={handleOpenModal}
                muted={true}
                hideControls={true}
                autoPlayOnView={true}
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
                <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === currentMedia ? 'bg-primary' : 'bg-muted'}`}></span>
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
        />
      )}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={handleLike} disabled={liking} className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-secondary'}`}>
          <Heart fill={isLiked ? 'currentColor' : 'none'} className="w-5 h-5" />
          <span>{post.likes.length}</span>
        </button>
        <span
          className="flex items-center gap-1 text-secondary cursor-pointer hover:text-primary"
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
      <UserProfileModal userId={post.author._id} currentUser={user} onClose={() => setShowProfile(false)} show={showProfile} />
    </div>
  );
};

export default Post; 
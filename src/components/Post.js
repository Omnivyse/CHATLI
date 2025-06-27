import React, { useState } from 'react';
import api from '../services/api';
import { Heart, MessageCircle, Trash, Eye } from 'lucide-react';
import PostModal from './PostModal';
import UserProfileModal from './UserProfileModal';
import { motion } from 'framer-motion';

const Post = ({ post, user, onPostUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const isOwner = post.author._id === user._id;
  const isLiked = post.likes.includes(user._id);

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

  return (
    <div className="bg-background rounded-lg shadow p-4">
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
      {post.image && (
        <img
          src={post.image}
          alt="post"
          className="max-h-64 rounded mb-2 object-contain cursor-pointer hover:opacity-80 transition"
          onClick={() => setShowModal(true)}
        />
      )}
      {post.video && (
        <video
          src={post.video}
          controls
          className="max-h-64 rounded mb-2 w-full object-contain cursor-pointer hover:opacity-80 transition"
          onClick={() => setShowModal(true)}
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
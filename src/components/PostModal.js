import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { X, Trash, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomVideoPlayer from './CustomVideoPlayer';

const PostModal = ({ postId, user, onClose, onPostUpdate, show = true }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [deletingComments, setDeletingComments] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, commentId: null });

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.getPost(postId);
      if (res.success) setPost(res.data.post);
    } finally {
      setLoading(false);
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

  const handleDeleteAllComments = async () => {
    if (window.confirm('Бүх сэтгэгдлийг устгах уу?')) {
      setDeletingComments(true);
      await api.deleteAllComments(postId);
      fetchPost();
      onPostUpdate && onPostUpdate();
      setDeletingComments(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteConfirm.commentId) return;
    await api.deleteComment(postId, deleteConfirm.commentId);
    setDeleteConfirm({ show: false, commentId: null });
    fetchPost();
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              key="post-modal-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.28 }}
              className="bg-background rounded-lg shadow-xl p-8"
            >
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const isOwner = post.author._id === user._id;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="post-modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            key="post-modal-box"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.28 }}
            className="bg-background rounded-lg shadow-xl max-w-lg w-full p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-secondary font-bold text-lg">{post.author.name[0]}</span>
                </div>
              )}
              <div>
                <div className="font-semibold">{post.author.name}</div>
                <div className="text-xs text-secondary">{new Date(post.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-2 whitespace-pre-line">{post.content}</div>
            {post.image && (
              <img src={post.image} alt="post" className="max-h-64 rounded mb-2 object-contain" />
            )}
            {post.video && (
              <CustomVideoPlayer
                src={post.video}
                autoPlay={true}
                hideControls={false}
                minimalControls={true}
                className="mb-2"
              />
            )}
            <div className="flex items-center gap-4 mb-2">
              <span className="flex items-center gap-1 text-secondary">
                <span>Лайк:</span> <span>{post.likes.length}</span>
              </span>
              <span className="flex items-center gap-1 text-secondary">
                <span>Сэтгэгдэл:</span> <span>{post.comments.length}</span>
              </span>
            </div>
            {/* Comments */}
            <div className="space-y-3 max-h-60 overflow-y-auto mb-2">
              {post.comments.map(c => {
                const canDelete = user._id === c.author._id || user._id === post.author._id;
                return (
                  <div key={c._id || c.createdAt} className="flex items-start gap-2 group">
                    {c.author.avatar ? (
                      <img src={c.author.avatar} alt={c.author.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-secondary font-bold text-sm">{c.author.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold">{c.author.name}</div>
                        <div className="text-xs text-secondary">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm">{c.content}</div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirm({ show: true, commentId: c._id })}
                        className="p-1 ml-2 text-red-500 rounded hover:bg-red-100"
                        title="Сэтгэгдэл устгах"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Add Comment */}
            <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded border border-border bg-muted"
                placeholder="Сэтгэгдэл бичих..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={commenting}
              />
              <button type="submit" className="bg-primary text-primary-dark px-3 py-2 rounded" disabled={commenting || !comment.trim()}>
                Илгээх
              </button>
            </form>
            {/* Custom Delete Confirmation Modal */}
            {deleteConfirm.show && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-background rounded-lg shadow-xl p-6 max-w-xs w-full text-center">
                  <div className="mb-4 text-lg">Сэтгэгдлийг устгах уу?</div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleDeleteComment}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >Тийм</button>
                    <button
                      onClick={() => setDeleteConfirm({ show: false, commentId: null })}
                      className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
                    >Үгүй</button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostModal; 
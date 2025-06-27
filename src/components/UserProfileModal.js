import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { X as XIcon } from 'lucide-react';
import Post from './Post';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfileModal = ({ userId, currentUser, onClose, show }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Opening profile modal for', userId);
        const userRes = await api.request(`/auth/users/${userId}`);
        console.log('DEBUG userRes.data:', userRes.data);
        setUser(userRes.data.user);
        setIsFollowing(userRes.data.user.followers?.includes(currentUser._id));
        const postsRes = await api.request(`/posts/user/${userId}`);
        const posts = postsRes.posts || (postsRes.data && postsRes.data.posts) || [];
        setPosts(posts);
      } catch (e) {
        console.error('ERROR fetching user:', e);
        setUser(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, currentUser._id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.request(`/auth/users/${userId}/unfollow`, { method: 'POST' });
      } else {
        await api.request(`/auth/users/${userId}/follow`, { method: 'POST' });
      }
      // Refetch user to update counts and state
      const userRes = await api.request(`/auth/users/${userId}`);
      setUser(userRes.data.user);
      setIsFollowing(userRes.data.user.followers?.includes(currentUser._id));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = () => {
    // You can implement chat opening logic here (e.g., open chat window with user)
    alert('Чатлах үйлдэл (TODO): ' + user.name);
  };

  if (!userId) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="profile-modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <motion.div
            key="profile-modal-box"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.28 }}
            className="bg-background rounded-2xl shadow-xl max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Cover Image Blurred Background */}
            {user?.coverImage && (
              <div className="absolute left-0 top-0 w-full h-32 rounded-t-2xl overflow-hidden z-0">
                <img
                  src={user.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover blur-md scale-105"
                  style={{ filter: 'blur(5px) brightness(0.8)' }}
                />
              </div>
            )}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted z-10">
              <XIcon className="w-5 h-5" />
            </button>
            <div className="relative z-10">
              {loading ? (
                <div className="text-center py-10">Уншиж байна...</div>
              ) : user ? (
                <>
                  <div className="flex flex-col items-center gap-2 mb-6 mt-8">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl">
                        {user.name[0]}
                      </div>
                    )}
                    <div className="font-bold text-lg">{user.name}</div>
                    <div className="text-secondary text-sm">@{user.username}</div>
                    {user.bio && <div className="text-secondary text-center text-sm max-w-xs">{user.bio}</div>}
                    <div className="flex gap-6 mt-2 mb-2">
                      <div className="text-center">
                        <div className="font-bold">{user.followers?.length || 0}</div>
                        <div className="text-xs text-secondary">Дагагч</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{user.following?.length || 0}</div>
                        <div className="text-xs text-secondary">Дагaж буй</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {user._id !== currentUser._id && (
                        <button
                          onClick={handleFollow}
                          disabled={followLoading}
                          className={`px-5 py-1.5 rounded-full font-semibold transition ${isFollowing ? 'bg-muted text-primary' : 'bg-primary text-primary-dark'} hover:opacity-90`}
                        >
                          {isFollowing ? 'Дагахаа болих' : 'Дагах'}
                        </button>
                      )}
                      {user._id !== currentUser._id && (
                        <button
                          onClick={handleChat}
                          className="px-5 py-1.5 rounded-full font-semibold bg-muted text-primary hover:bg-primary hover:text-primary-dark transition"
                        >
                          Чатлах
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mb-2 font-semibold text-primary">Постууд</div>
                  {posts.length === 0 ? (
                    <div className="text-secondary text-center">Пост байхгүй байна</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {posts.map(post => (
                        <Post key={post._id} post={post} user={currentUser} onPostUpdate={() => {}} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-red-500">Хэрэглэгч олдсонгүй</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal; 
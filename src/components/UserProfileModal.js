import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { X as XIcon, Loader2 } from 'lucide-react';
import Post from './Post';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfileModal = ({ userId, currentUser, onClose, show }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Move fetchData outside useEffect so it can be reused
  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await api.request(`/auth/users/${userId}`);
      setUser(userRes.data.user);
      setIsFollowing(userRes.data.user.followers?.includes(currentUser._id));
      setIsRequestSent(userRes.data.user.followRequests?.includes(currentUser._id));
      let isPrivate = false;
      let posts = [];
      try {
        const postsRes = await api.request(`/posts/user/${userId}`);
        posts = postsRes.posts || (postsRes.data && postsRes.data.posts) || [];
      } catch (e) {
        if (e.message && e.message.includes('Энэ профайл хувийн байна')) {
          isPrivate = true;
        }
      }
      setPosts(posts);
      setPrivateProfile(isPrivate);
    } catch (e) {
      if (e.message && e.message.includes('Энэ профайл хувийн байна')) {
        setPrivateProfile(true);
      } else {
        setUser(null);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, currentUser._id]);

  const handleFollow = async () => {
    if (followLoading) return; // Prevent double requests
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.request(`/auth/users/${userId}/unfollow`, { method: 'POST' });
      } else {
        try {
          await api.request(`/auth/users/${userId}/follow`, { method: 'POST' });
          if (privateProfile) setIsRequestSent(true);
        } catch (e) {
          if (e.message && e.message.includes('Дагах хүсэлт илгээсэн байна')) {
            setIsRequestSent(true);
            return;
          } else {
            throw e;
          }
        }
      }
      // Refetch everything to update modal (cover, posts, etc)
      await fetchData();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setFollowLoading(true);
    try {
      await api.request(`/auth/users/${userId}/cancel-follow-request`, { method: 'POST' });
      await fetchData();
      setShowCancelDialog(false);
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
            className="bg-background dark:bg-background-dark rounded-2xl shadow-xl dark:shadow-[0_0_0_4px_rgba(255,255,255,0.15)] max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
              </div>
            ) : user ? (
              <>
                <div className="relative">
                  {user.coverImage && (
                    <div className="absolute left-0 top-0 w-full h-32 rounded-t-2xl overflow-hidden z-0">
                      <img
                        src={user.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover blur-md scale-105"
                        style={{ filter: 'blur(5px) brightness(0.8)' }}
                      />
                    </div>
                  )}
                  <div className="relative pt-24 z-10">
                    <div className="flex flex-col items-center gap-2 mb-6 mt-8 relative z-10" style={{ zIndex: 10 }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 ring-4 ring-white dark:ring-white ring-offset-2 dark:ring-offset-background-dark" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl shadow-none dark:shadow-[0_0_0_4px_rgba(255,255,255,0.7)] ring-4 ring-white dark:ring-white ring-offset-2 dark:ring-offset-background-dark">
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
                        {user._id !== currentUser._id && !isFollowing && !isRequestSent && (
                          <button
                            onClick={followLoading ? undefined : handleFollow}
                            disabled={followLoading}
                            className="px-5 py-1.5 rounded-full font-semibold transition bg-primary text-primary-dark hover:opacity-90 mt-2"
                          >
                            Дагах
                          </button>
                        )}
                        {user._id !== currentUser._id && isRequestSent && !isFollowing && (
                          <>
                            <button
                              disabled={followLoading}
                              className="px-5 py-1.5 rounded-full font-semibold transition bg-muted text-secondary mt-2 cursor-pointer"
                              onClick={() => setShowCancelDialog(true)}
                            >
                              Хүлээгдэж байна
                            </button>
                            {showCancelDialog && (
                              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
                                <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl p-6 max-w-xs w-full text-center">
                                  <div className="mb-4 text-lg font-semibold">Дагах хүсэлтийг цуцлах уу?</div>
                                  <div className="flex gap-4 justify-center">
                                    <button
                                      className="px-4 py-2 rounded bg-muted hover:bg-muted/80"
                                      onClick={() => setShowCancelDialog(false)}
                                      disabled={followLoading}
                                    >Үгүй</button>
                                    <button
                                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                                      onClick={handleCancelRequest}
                                      disabled={followLoading}
                                    >Тийм</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {user._id !== currentUser._id && isFollowing && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={handleFollow}
                              disabled={followLoading}
                              className="px-5 py-1.5 rounded-full font-semibold transition bg-muted text-primary hover:opacity-90"
                            >
                              Дагахаа болих
                            </button>
                            <button
                              onClick={handleChat}
                              className="px-5 py-1.5 rounded-full font-semibold bg-muted text-primary hover:bg-primary hover:text-primary-dark transition"
                            >
                              Чатлах
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-2 font-semibold text-primary">Постууд</div>
                {posts.length === 0 ? (
                  <div className="text-secondary text-center">Пост байхгүй байна</div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[45vh]">
                    <div className="flex flex-col gap-4">
                      {posts.map(post => (
                        <Post key={post._id} post={post} user={currentUser} onPostUpdate={() => {}} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-red-500">Хэрэглэгч олдсонгүй</div>
            )}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted z-30">
              <XIcon className="w-5 h-5 text-foreground dark:text-foreground-dark" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal; 
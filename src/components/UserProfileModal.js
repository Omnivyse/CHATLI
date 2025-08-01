import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { X as XIcon, Loader2 } from 'lucide-react';
import Post from './Post';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfileModal = ({ userId, currentUser, onClose, show, onStartChat }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Move fetchData outside useEffect so it can be reused
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await api.request(`/auth/users/${userId}`);
      setUser(userRes.data.user);
      setIsFollowing(userRes.data.user.followers?.includes(currentUser._id));
      
      // Check for follow request status
      if (userRes.data.user.followRequests?.includes(currentUser._id)) {
        // User is viewing their own profile and has follow requests
        setIsRequestSent(false);
      } else if (userRes.data.user.hasFollowRequestFromCurrentUser) {
        // Current user has sent a follow request to this profile
        setIsRequestSent(true);
      } else {
        setIsRequestSent(false);
      }
      
      // Check if user has private profile settings
      const isPrivateAccount = userRes.data.user.isPrivateAccount || false;
      let isPrivate = isPrivateAccount;
      let posts = [];
      
      // If it's a private account and current user is not following, don't try to fetch posts
      if (isPrivateAccount && !userRes.data.user.followers?.includes(currentUser._id) && userRes.data.user._id !== currentUser._id) {
        isPrivate = true;
        posts = [];
      } else {
        try {
          const postsRes = await api.request(`/posts/user/${userId}`);
          posts = postsRes.posts || (postsRes.data && postsRes.data.posts) || [];
        } catch (e) {
          if (e.message && e.message.includes('дагах шаардлагатай')) {
            isPrivate = true;
          }
        }
      }
      
      setPosts(posts);
      setPrivateProfile(isPrivate);
    } catch (e) {
      if (e.message && e.message.includes('дагах шаардлагатай')) {
        setPrivateProfile(true);
      } else {
        setUser(null);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser._id]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, currentUser._id, fetchData]);

  const handleFollow = async () => {
    if (followLoading) return; // Prevent double requests
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(userId);
        setIsFollowing(false);
        setIsRequestSent(false);
        // Refetch data after unfollow to update follower count
        await fetchData();
      } else {
        const response = await api.followUser(userId);
        if (response.success) {
          if (response.message === 'Дагах хүсэлт илгээгдлээ') {
            // Follow request sent for private user
            setIsRequestSent(true);
            // Don't refetch data here to preserve the request sent state
          } else {
            // Direct follow for public user
            setIsFollowing(true);
            setIsRequestSent(false);
            // Refetch data after direct follow to update follower count
            await fetchData();
          }
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setFollowLoading(true);
    try {
      const response = await api.cancelFollowRequest(userId);
      if (response.success) {
        setIsRequestSent(false);
      }
      await fetchData();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Cancel request error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = async () => {
    if (chatLoading) return;
    setChatLoading(true);
    
    try {
      // Create or get existing chat with this user
      const response = await api.createChat({
        type: 'direct',
        participants: [userId]
      });
      
      if (response.success) {
        // Close the profile modal
        onClose();
        
        // Notify parent component to start chat
        if (onStartChat) {
          onStartChat(response.data.chat._id);
        }
      }
    } catch (error) {
      console.error('Create chat error:', error);
      // If chat already exists, try to find it
      try {
        const chatsResponse = await api.getChats();
        if (chatsResponse.success) {
          const existingChat = chatsResponse.data.chats.find(chat => 
            chat.type === 'direct' && 
            chat.participants.some(p => p._id === userId)
          );
          
          if (existingChat) {
            onClose();
            if (onStartChat) {
              onStartChat(existingChat._id);
            }
          }
        }
      } catch (findError) {
        console.error('Find existing chat error:', findError);
      }
    } finally {
      setChatLoading(false);
    }
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
                          <div className="font-bold text-foreground dark:text-foreground-dark">{user.followers?.length || 0}</div>
                          <div className="text-xs text-secondary">Дагагч</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-foreground dark:text-foreground-dark">{user.following?.length || 0}</div>
                          <div className="text-xs text-secondary">Дагaж буй</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {user._id !== currentUser._id && !isFollowing && !isRequestSent && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={followLoading ? undefined : handleFollow}
                              disabled={followLoading}
                              className="px-5 py-1.5 rounded-full font-semibold transition bg-primary text-primary-dark hover:opacity-90"
                            >
                              {followLoading ? 'Уншиж байна...' : 'Дагах'}
                            </button>
                            <button
                              onClick={handleChat}
                              disabled={chatLoading}
                              className="px-5 py-1.5 rounded-full font-semibold bg-muted text-primary hover:bg-primary hover:text-primary-dark transition flex items-center gap-2"
                            >
                              {chatLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </>
                              ) : (
                                'Чатлах'
                              )}
                            </button>
                          </div>
                        )}
                        {user._id !== currentUser._id && isRequestSent && !isFollowing && (
                          <>
                            <button
                              disabled={followLoading}
                              className="px-5 py-1.5 rounded-full font-semibold transition bg-yellow-500 text-white mt-2 cursor-pointer"
                              onClick={() => setShowCancelDialog(true)}
                            >
                              Хүсэлт илгээгдсэн
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
                              {followLoading ? 'Уншиж байна...' : 'Дагасан'}
                            </button>
                            <button
                              onClick={handleChat}
                              disabled={chatLoading}
                              className="px-5 py-1.5 rounded-full font-semibold bg-muted text-primary hover:bg-primary hover:text-primary-dark transition flex items-center gap-2"
                            >
                              {chatLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </>
                              ) : (
                                'Чатлах'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-2 font-semibold text-primary">Постууд</div>
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    {privateProfile && !isFollowing && user._id !== currentUser._id ? (
                      <>
                        <div className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
                          Хувийн профайл
                        </div>
                        <div className="text-sm text-secondary dark:text-secondary-dark">
                          Энэ хэрэглэгчийн постуудыг харахын тулд дагах шаардлагатай
                        </div>
                      </>
                    ) : (
                      <div className="text-secondary text-center">
                        {user._id === currentUser._id 
                          ? 'Та одоогоор пост нийтлээгүй байна'
                          : 'Энэ хэрэглэгч одоогоор пост нийтлээгүй байна'
                        }
                      </div>
                    )}
                  </div>
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
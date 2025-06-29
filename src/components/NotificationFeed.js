import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import { Bell, Heart, MessageCircle, Loader2, User as UserIcon, Check, X as XIcon } from 'lucide-react';
import PostModal from './PostModal';

const NotificationFeed = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalPostId, setModalPostId] = useState(null);
  const lastFetchRef = useRef(0);
  const [followRequests, setFollowRequests] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const now = Date.now();
    if (now - lastFetchRef.current > 5000) { // 5 seconds cooldown
      api.markAllNotificationsRead();
      fetchNotifications();
      lastFetchRef.current = now;
    }
    // Listen for real-time notifications
    const handleRealtimeNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };
    socketService.on('notification', handleRealtimeNotification);
    return () => {
      socketService.off('notification', handleRealtimeNotification);
    };
  }, []);

  useEffect(() => {
    // Fetch current user profile for follow requests
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const res = await api.request(`/auth/users/${user._id}`);
        if (res.success) {
          setFollowRequests(res.data.user.followRequests || []);
          setIsPrivate(res.data.user.privateProfile);
        }
      } catch (e) {
        setProfileError('Профайл уншихад алдаа гарлаа');
      } finally {
        setProfileLoading(false);
      }
    };
    if (user?._id) fetchProfile();
  }, [user?._id]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getNotifications();
      if (res.success) setNotifications(res.data.notifications);
      else setError(res.message || 'Алдаа гарлаа');
    } catch (e) {
      setError('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId) => {
    await api.acceptFollowRequest(user._id, requesterId);
    setFollowRequests(followRequests.filter(id => id !== requesterId));
  };
  const handleReject = async (requesterId) => {
    await api.rejectFollowRequest(user._id, requesterId);
    setFollowRequests(followRequests.filter(id => id !== requesterId));
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6" /> Мэдэгдэл
        </h2>
      </div>
      {/* Follow Requests Section */}
      {isPrivate && followRequests.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="font-semibold mb-2">Дагах хүсэлтүүд</div>
          <div className="space-y-3">
            {followRequests.map((id) => (
              <FollowRequestItem key={id} userId={id} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-center text-secondary"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-secondary mt-10">Мэдэгдэл байхгүй байна</div>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => {
            const fromUsers = n.from || [];
            const firstUser = fromUsers[0];
            const extraCount = fromUsers.length - 1;
            let displayName = firstUser ? firstUser.name : 'Хэн нэгэн';
            let displayAvatar = firstUser ? firstUser.avatar : '';
            if (extraCount > 0) {
              displayName = `${displayName} болон ${extraCount} хүн`;
            }
            const handleClick = () => {
              if (n.post && n.post._id) setModalPostId(n.post._id);
            };
            return (
              <div
                key={n._id}
                className={`flex items-start gap-3 p-4 rounded-lg border border-border ${n.isRead ? 'bg-muted' : 'bg-yellow-50 dark:bg-yellow-900/20'} cursor-pointer hover:bg-muted/70 transition`}
                onClick={handleClick}
              >
                <div className="pt-1">
                  {n.type === 'like' ? <Heart className="w-5 h-5 text-red-500" /> : <MessageCircle className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-secondary font-bold text-sm">{displayName[0]}</span>
                      </div>
                    )}
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-secondary text-xs">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm mt-1">{n.message}</div>
                  {n.post && (
                    <div className="text-xs text-secondary mt-1 truncate">Пост: {n.post.content?.slice(0, 40)}...</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Post Modal for notification click */}
      {modalPostId && (
        <PostModal postId={modalPostId} user={user} onClose={() => setModalPostId(null)} />
      )}
    </div>
  );
};

function FollowRequestItem({ userId, onAccept, onReject }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.request(`/auth/users/${userId}`);
        setProfile(res.data.user);
      } catch {}
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);
  if (loading) return <div className="flex items-center gap-2 text-secondary text-sm"><Loader2 className="w-4 h-4 animate-spin" />Уншиж байна...</div>;
  if (!profile) return null;
  return (
    <div className="flex items-center gap-3">
      {profile.avatar ? (
        <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-secondary" />
        </div>
      )}
      <span className="font-medium">{profile.name}</span>
      <span className="text-secondary text-xs">@{profile.username}</span>
      <button
        onClick={() => onAccept(userId)}
        className="ml-auto px-3 py-1 rounded bg-black text-white hover:bg-gray-800 transition font-semibold"
      >
        Зөвшөөрөх
      </button>
      <button
        onClick={() => onReject(userId)}
        className="ml-2 px-3 py-1 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition font-semibold"
      >
        Цуцлах
      </button>
    </div>
  );
}

export default NotificationFeed; 
import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import { Bell, Heart, MessageCircle, Loader2, User as UserIcon, UserPlus } from 'lucide-react';
import PostModal from './PostModal';

const NotificationFeed = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalPostId, setModalPostId] = useState(null);
  const lastFetchRef = useRef(0);

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

  const handleAcceptFollowRequest = async (requesterId) => {
    try {
      const response = await api.acceptFollowRequest(requesterId);
      if (response.success) {
        // Remove the follow request notification
        setNotifications(prev => 
          prev.filter(notification => 
            !(notification.type === 'follow_request' && 
              notification.from && 
              notification.from.length > 0 && 
              notification.from[0]._id === requesterId)
          )
        );
      }
    } catch (error) {
      console.error('Accept follow request error:', error);
    }
  };

  const handleRejectFollowRequest = async (requesterId) => {
    try {
      const response = await api.rejectFollowRequest(requesterId);
      if (response.success) {
        // Remove the follow request notification
        setNotifications(prev => 
          prev.filter(notification => 
            !(notification.type === 'follow_request' && 
              notification.from && 
              notification.from.length > 0 && 
              notification.from[0]._id === requesterId)
          )
        );
      }
    } catch (error) {
      console.error('Reject follow request error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-primary" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'follow_request':
        return <UserPlus className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4 bg-white dark:bg-black rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6" /> Мэдэгдэл
        </h2>
      </div>
      
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

            // Handle follow request notifications
            if (n.type === 'follow_request' && firstUser) {
              return (
                <div
                  key={n._id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-zinc-900"
                >
                  <div className="pt-1">
                    {getNotificationIcon(n.type)}
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
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptFollowRequest(firstUser._id)}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition font-semibold text-sm"
                      >
                        Зөвшөөрөх
                      </button>
                      <button
                        onClick={() => handleRejectFollowRequest(firstUser._id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition font-semibold text-sm"
                      >
                        Цуцлах
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Handle other notifications
            const handleClick = () => {
              if (n.post && n.post._id) setModalPostId(n.post._id);
            };

            return (
              <div
                key={n._id}
                className={`flex items-start gap-3 p-4 rounded-lg border border-border ${n.isRead ? 'bg-muted dark:bg-zinc-900' : 'bg-yellow-50 dark:bg-zinc-900'} cursor-pointer hover:bg-muted/70 transition`}
                onClick={handleClick}
              >
                <div className="pt-1">
                  {getNotificationIcon(n.type)}
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

export default NotificationFeed; 
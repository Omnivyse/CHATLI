import React, { useEffect, useState } from 'react';
import { initializeTheme } from './utils/themeUtils';
import api from './services/api';
import socketService from './services/socket';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ProfileSettings from './components/ProfileSettings';
import PostFeed from './components/PostFeed';
import NotificationFeed from './components/NotificationFeed';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  useEffect(() => {
    // Initialize theme
    initializeTheme();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
            // Connect to socket
            socketService.connect(token);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Connect to socket with token
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSelectedChat(null);
      socketService.disconnect();
    }
  };

  const handleProfileSettings = () => {
    setShowProfileSettings(true);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    setShowProfileSettings(false);
  };

  const handleProfileClose = () => {
    setShowProfileSettings(false);
  };

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        const count = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadNotificationCount(count);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUnreadNotificationCount();
  }, []);

  // Update count when tab changes to notifications or on new notification
  useEffect(() => {
    if (activeTab === 'notifications') {
      setUnreadNotificationCount(0);
    } else {
      fetchUnreadNotificationCount();
    }
  }, [activeTab]);

  // Listen for real-time notification events
  useEffect(() => {
    const handleRealtimeNotification = () => {
      fetchUnreadNotificationCount();
    };
    import('./services/socket').then(socketService => {
      socketService.default.on('notification', handleRealtimeNotification);
    });
    return () => {
      import('./services/socket').then(socketService => {
        socketService.default.off('notification', handleRealtimeNotification);
      });
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      {/* Mobile Header - Only shown on mobile when sidebar is hidden */}
      {isMobile && !showSidebarMobile && (activeTab === 'feed' || activeTab === 'notifications' || selectedChat) && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              setShowSidebarMobile(true);
            }}
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-medium">Цэс</span>
          </button>
          <div className="flex items-center gap-4">
            {activeTab === 'feed' && (
              <span className="font-semibold text-lg">Фийд</span>
            )}
            {activeTab === 'notifications' && (
              <span className="font-semibold text-lg">Мэдэгдэл</span>
            )}
            {selectedChat && (
              <span className="font-semibold text-lg">Чат</span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center cursor-pointer" onClick={handleProfileSettings}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Sidebar - Only show on mobile if showSidebarMobile is true, always show on desktop */}
      {((isMobile && showSidebarMobile) || !isMobile) && (
        <div className={`fixed inset-0 z-50 bg-background w-full md:static md:w-80 border-r border-border bg-background ${isMobile ? '' : ''}`} style={isMobile ? {maxWidth: '100vw'} : {}}>
          <Sidebar 
            user={user}
            selectedChat={selectedChat} 
            onChatSelect={(chatId) => {
              setSelectedChat(chatId);
              setShowSidebarMobile(false);
            }}
            onLogout={handleLogout}
            isMobile={isMobile}
            onProfileSettings={handleProfileSettings}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setShowSidebarMobile(false);
            }}
            activeTab={activeTab}
            unreadNotificationCount={unreadNotificationCount}
          />
        </div>
      )}

      {/* Main Content - Full width on mobile with top padding for header, hidden if sidebar is open on mobile */}
      <div className={`${isMobile && (showSidebarMobile) ? 'hidden' : 'block'} flex-1 flex flex-col bg-background ${isMobile ? 'pt-16' : ''}`}>
        {activeTab === 'feed' ? (
          <PostFeed user={user} />
        ) : activeTab === 'notifications' ? (
          <NotificationFeed user={user} />
        ) : selectedChat ? (
          <ChatWindow 
            chatId={selectedChat} 
            user={user}
            onBack={() => setSelectedChat(null)}
            isMobile={isMobile}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">Чат сонгоно уу</h2>
              <p className="text-sm">Хэлэлцэх хүнээ сонгоно уу</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          user={user}
          onClose={handleProfileClose}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

export default App;
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
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    // Initialize theme
    initializeTheme();
    setActiveTab('feed'); // Always show feed on load

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
    setActiveTab('feed'); // Always show feed on login
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

  // Handle starting a chat from user profile
  const handleStartChat = async (chatId) => {
    setSelectedChat(chatId);
    setActiveTab('chats'); // Switch to chats tab
    setShowSidebarMobile(false);
    
    // Add the new chat to the sidebar list if it's not already there
    try {
      const chatExists = chats.find(chat => chat._id === chatId);
      if (!chatExists) {
        // Fetch the chat details to add to the sidebar
        const response = await api.getChat(chatId);
        if (response.success) {
          const newChat = {
            ...response.data.chat,
            unreadCount: 0 // New chat has no unread messages
          };
          setChats(prevChats => [newChat, ...prevChats]);
        }
      }
    } catch (error) {
      console.error('Error fetching new chat details:', error);
      // If we can't fetch the chat details, still allow the chat to be selected
      // The user can refresh to see it in the sidebar
    }
  };

  // Handle chat deletion
  const handleChatDeleted = (deletedChatId) => {
    // Remove the deleted chat from the chats list
    setChats(prevChats => prevChats.filter(chat => chat._id !== deletedChatId));
    // Clear the selected chat if it was the deleted one
    if (selectedChat === deletedChatId) {
      setSelectedChat(null);
    }
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

  // Remove auto-switch to chat on incoming messages
  useEffect(() => {
    if (!user) return;
    const handleIncomingMessage = (data) => {
      // Only update unread counts or show notification, do not auto-switch tab
      // Optionally, you can add a notification badge here
    };
    socketService.on('new_message', handleIncomingMessage);
    return () => {
      socketService.off('new_message', handleIncomingMessage);
    };
  }, [user]);

  const loadChats = async () => {
    setLoadingChats(true);
    setChatError('');
    try {
      const response = await api.getChats();
      if (response.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      setChatError('Чат жагсаалтыг уншихад алдаа гарлаа');
      console.error('Load chats error:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-dark mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark relative">
      {/* Mobile Header - Only shown on mobile when sidebar is hidden */}
      {isMobile && !showSidebarMobile && (activeTab === 'feed' || activeTab === 'notifications' || selectedChat) && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-background dark:bg-background-dark border-b border-border dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              setShowSidebarMobile(true);
            }}
            className="flex items-center gap-2 text-primary dark:text-primary-dark hover:text-primary/80 dark:hover:text-primary-dark/80"
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
          <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center cursor-pointer" onClick={handleProfileSettings}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <svg className="w-5 h-5 text-secondary dark:text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Sidebar - Fixed on desktop, overlay on mobile */}
      {((isMobile && showSidebarMobile) || !isMobile) && (
        <div className={`${isMobile ? 'fixed inset-0 z-50' : 'fixed left-0 top-0 h-full'} bg-background dark:bg-background-dark w-full md:w-80 border-r border-border dark:border-border-dark`} style={isMobile ? {maxWidth: '100vw'} : {}}>
          <Sidebar 
            user={user}
            selectedChat={selectedChat} 
            onChatSelect={async (chatId) => {
              try {
                // First verify the chat exists
                const chatResponse = await api.getChat(chatId);
                if (chatResponse.success) {
                  setSelectedChat(chatId);
                  setActiveTab('chats');
                  setShowSidebarMobile(false);
                  // Mark chat as read and update unread count in state
                  try {
                    await api.markChatAsRead(chatId);
                    setChats(prevChats => prevChats.map(chat =>
                      chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
                    ));
                  } catch (e) { /* ignore */ }
                }
              } catch (error) {
                console.error('Chat not found or invalid:', error);
                // Remove the invalid chat from the sidebar
                setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                // Clear selected chat if it was the invalid one
                if (selectedChat === chatId) {
                  setSelectedChat(null);
                }
                // Optionally show a message to the user
                alert('Энэ чат байхгүй байна. Чат жагсаалтаас хасагдлаа.');
              }
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
            onClose={() => setShowSidebarMobile(false)}
            chats={chats}
            setChats={setChats}
            loadChats={loadChats}
            loadingChats={loadingChats}
            chatError={chatError}
          />
        </div>
      )}

      {/* Main Content - Scrollable area with proper spacing */}
      <div className={`${isMobile && showSidebarMobile ? 'hidden' : 'block'} flex-1 flex flex-col bg-background dark:bg-background-dark ${isMobile ? 'pt-16' : 'md:ml-80'}`}>
        {activeTab === 'feed' ? (
          <PostFeed user={user} onStartChat={handleStartChat} />
        ) : activeTab === 'notifications' ? (
          <NotificationFeed user={user} />
        ) : selectedChat ? (
          <ChatWindow 
            chatId={selectedChat} 
            user={user}
            onBack={() => setSelectedChat(null)}
            isMobile={isMobile}
            onChatDeleted={handleChatDeleted}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary dark:text-secondary-dark">
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
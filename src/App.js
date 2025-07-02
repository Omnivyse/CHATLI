import React, { useEffect, useState, useCallback } from 'react';
import { initializeTheme } from './utils/themeUtils';
import api from './services/api';
import socketService from './services/socket';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ProfileSettings from './components/ProfileSettings';
import PostFeed from './components/PostFeed';
import NotificationFeed from './components/NotificationFeed';
import WelcomeModal from './components/WelcomeModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import CopyrightModal from './components/CopyrightModal';
import ReportModal from './components/ReportModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import AdminPanel from './components/AdminPanel';
import analyticsService from './services/analyticsService';
import pwaService from './services/pwaService';
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    // Initialize theme
    initializeTheme();
    setActiveTab('feed'); // Always show feed on load

    // Initialize analytics
    analyticsService.init();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Handle route changes
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);

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

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('popstate', handleRouteChange);
      analyticsService.stop();
    };
  }, []);

  const handleLogin = (userData, loginInfo = {}) => {
    setUser(userData);
    setActiveTab('feed'); // Always show feed on login
    
    // Track login event
    if (loginInfo.isNewUser) {
      analyticsService.trackUserRegister();
    } else {
      analyticsService.trackUserLogin();
    }
    
    // Always show welcome modal on login
    setIsNewUser(loginInfo.isNewUser || false);
    setShowWelcomeModal(true);
    
    // Connect to socket with token
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }
    // Clear any cached chat data and reload fresh
    setChats([]);
    setSelectedChat(null);
  };

  const handleLogout = async () => {
    try {
      // Track logout event
      analyticsService.trackUserLogout();
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSelectedChat(null);
      setChats([]); // Clear chat data on logout
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

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
  };

  const handleShowWelcome = () => {
    setIsNewUser(false); // Show as returning user when manually opened
    setShowWelcomeModal(true);
  };

  const handleShowPrivacy = () => {
    setShowPrivacyModal(true);
  };

  const handleShowCopyright = () => {
    setShowCopyrightModal(true);
  };

  const handleShowReport = () => {
    setShowReportModal(true);
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

  // Listen for new messages and update sidebar
  useEffect(() => {
    if (!user) return;
    const handleIncomingMessage = (data) => {
      const { chatId, message } = data;
      
      // Update the chat list to show the new message as the last message
      setChats(prevChats => {
        const chatExists = prevChats.find(chat => chat._id === chatId);
        if (!chatExists) {
          return prevChats; // Don't update if chat doesn't exist in local state
        }
        
        const updatedChats = prevChats.map(chat => {
          if (chat._id === chatId) {
            const updatedChat = {
              ...chat,
              lastMessage: {
                id: message._id,
                text: message.content?.text || '',
                sender: message.sender,
                timestamp: message.createdAt,
                isRead: false
              },
              // Increment unread count if user is not in this chat
              unreadCount: selectedChat === chatId ? chat.unreadCount : chat.unreadCount + 1
            };
            return updatedChat;
          }
          return chat;
        }).sort((a, b) => {
          // Sort chats by lastMessage timestamp (newest first)
          const aTime = new Date(a.lastMessage?.timestamp || a.createdAt);
          const bTime = new Date(b.lastMessage?.timestamp || b.createdAt);
          return bTime - aTime;
        });
        
        return updatedChats;
      });
    };
    
    socketService.on('new_message', handleIncomingMessage);
    return () => {
      socketService.off('new_message', handleIncomingMessage);
    };
  }, [user, selectedChat]);

  const loadChats = useCallback(async () => {
    if (!user) return; // Don't load chats if no user
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]); // Reload chats when user changes (login/logout)

  // Function to manually update sidebar chat list when a message is sent
  const updateChatListWithNewMessage = (chatId, message) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat._id === chatId) {
          return {
            ...chat,
            lastMessage: {
              id: message._id,
              text: message.content?.text || '',
              sender: message.sender,
              timestamp: message.createdAt || new Date().toISOString(),
              isRead: false
            }
          };
        }
        return chat;
      }).sort((a, b) => {
        // Sort chats by lastMessage timestamp (newest first)
        const aTime = new Date(a.lastMessage?.timestamp || a.createdAt);
        const bTime = new Date(b.lastMessage?.timestamp || b.createdAt);
        return bTime - aTime;
      });
      return updatedChats;
    });
  };

  // Check if accessing admin route
  if (currentRoute === '/secret/admin') {
    return <AdminPanel />;
  }

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
      {isMobile && (activeTab === 'feed' || activeTab === 'notifications' || selectedChat) && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-background dark:bg-background-dark border-b border-border dark:border-border-dark mobile-header-safe ios-safe-top ios-safe-left ios-safe-right flex items-center justify-between shadow-sm px-4 py-3">
          {selectedChat ? (
            // Special header for chat mode with prominent back button
            <>
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setActiveTab('feed');
                }}
                className="flex items-center gap-2 text-primary dark:text-primary-dark hover:text-primary/80 dark:hover:text-primary-dark/80 bg-muted/50 dark:bg-muted-dark/50 px-3 py-2 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Буцах</span>
              </button>
              <span className="font-semibold text-lg">Чат</span>
              <button
                onClick={handleProfileSettings}
                className="w-8 h-8 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-4 h-4 text-secondary dark:text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            // Regular header for feed and notifications
            <>
              <div className="flex items-center gap-2">
                <img src={require('./assets/logo.png')} alt="CHATLI" className="w-8 h-8 rounded-full" />
                <span className="font-bold text-lg">CHATLI</span>
              </div>
              <div className="flex items-center gap-4">
                {activeTab === 'feed' && (
                  <span className="font-semibold text-lg">Фийд</span>
                )}
                {activeTab === 'notifications' && (
                  <span className="font-semibold text-lg">Мэдэгдэл</span>
                )}
              </div>
              <button
                onClick={handleProfileSettings}
                className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center"
              >
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
              </button>
            </>
          )}
        </div>
      )}

      {/* Desktop Sidebar - Only on desktop */}
      {!isMobile && (
        <div className="fixed left-0 top-0 h-full bg-background dark:bg-background-dark w-80 border-r border-border dark:border-border-dark">
          <Sidebar 
            user={user}
            selectedChat={selectedChat} 
            onChatSelect={async (chatId) => {
              try {
                const chatResponse = await api.getChat(chatId);
                if (chatResponse.success) {
                  setSelectedChat(chatId);
                  setActiveTab('chats');
                  try {
                    await api.markChatAsRead(chatId);
                    setChats(prevChats => prevChats.map(chat =>
                      chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
                    ));
                  } catch (e) { /* ignore */ }
                }
              } catch (error) {
                console.error('Chat not found or invalid:', error);
                setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                if (selectedChat === chatId) {
                  setSelectedChat(null);
                }
                alert('Энэ чат байхгүй байна. Чат жагсаалтаас хасагдлаа.');
              }
            }}
            onLogout={handleLogout}
            isMobile={false}
            onProfileSettings={handleProfileSettings}
            onTabChange={(tab) => {
              setActiveTab(tab);
            }}
            activeTab={activeTab}
            unreadNotificationCount={unreadNotificationCount}
            onClose={() => {}}
            chats={chats}
            setChats={setChats}
            loadChats={loadChats}
            loadingChats={loadingChats}
            chatError={chatError}
          />
        </div>
      )}

      {/* Main Content - Scrollable area with proper spacing */}
      <div className={`flex-1 flex flex-col bg-background dark:bg-background-dark ios-safe-left ios-safe-right ${
        isMobile ? 'pt-20 pb-20' : 'md:ml-80'
      }`}>
        {activeTab === 'feed' ? (
          <PostFeed user={user} onStartChat={handleStartChat} />
        ) : activeTab === 'notifications' ? (
          <NotificationFeed user={user} />
        ) : activeTab === 'chats' ? (
          selectedChat ? (
            <ChatWindow 
              chatId={selectedChat} 
              user={user}
              onBack={() => setSelectedChat(null)}
              isMobile={isMobile}
              onChatDeleted={handleChatDeleted}
              updateChatList={updateChatListWithNewMessage}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Mobile Chat List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">Чатууд</h2>
                  <p className="text-sm text-secondary dark:text-secondary-dark">Харилцсан хүмүүс</p>
                </div>
                
                {loadingChats ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary-dark"></div>
                  </div>
                ) : chatError ? (
                  <div className="text-center py-8 text-red-500">{chatError}</div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-8 text-secondary dark:text-secondary-dark">
                    <p>Хараахан чат байхгүй байна</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <button
                        key={chat._id}
                        onClick={() => {
                          setSelectedChat(chat._id);
                          api.markChatAsRead(chat._id);
                          setChats(prevChats => prevChats.map(c =>
                            c._id === chat._id ? { ...c, unreadCount: 0 } : c
                          ));
                        }}
                        className="w-full p-4 rounded-lg bg-muted/30 dark:bg-muted-dark/30 hover:bg-muted/50 dark:hover:bg-muted-dark/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center">
                            {chat.participants?.[0]?.avatar ? (
                              <img 
                                src={chat.participants[0].avatar} 
                                alt={chat.participants[0].name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium text-primary dark:text-primary-dark">
                                {chat.participants?.[0]?.name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium truncate">
                                {chat.participants?.[0]?.name || 'Тодорхойгүй'}
                              </h3>
                              {chat.unreadCount > 0 && (
                                <span className="bg-primary dark:bg-primary-dark text-white dark:text-black text-xs px-2 py-1 rounded-full">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-secondary dark:text-secondary-dark truncate">
                              {chat.lastMessage?.text || 'Мессеж байхгүй'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary dark:text-secondary-dark p-8">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Чат сонгоно уу</h3>
              <p className="text-sm">Харилцахын тулд чат сонгоно уу</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - Like Threads/Instagram */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background dark:bg-background-dark border-t border-border dark:border-border-dark mobile-bottom-safe ios-safe-left ios-safe-right">
          <div className="flex items-center justify-around py-2 px-4">
            {/* Home/Feed */}
            <button
              onClick={() => {
                setActiveTab('feed');
                setSelectedChat(null);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors min-w-0 ${
                activeTab === 'feed' && !selectedChat
                  ? 'text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary-dark/10'
                  : 'text-secondary dark:text-secondary-dark'
              }`}
            >
              <svg className="w-6 h-6" fill={activeTab === 'feed' && !selectedChat ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 7 5 5 5-5" />
              </svg>
              <span className="text-xs font-medium">Фийд</span>
            </button>

            {/* Messages/Chats */}
            <button
              onClick={() => {
                setActiveTab('chats');
                setSelectedChat(null);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors relative min-w-0 ${
                activeTab === 'chats'
                  ? 'text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary-dark/10'
                  : 'text-secondary dark:text-secondary-dark'
              }`}
            >
              <svg className="w-6 h-6" fill={activeTab === 'chats' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">Чат</span>
              {chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0)}
                </span>
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                setActiveTab('notifications');
                setSelectedChat(null);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors relative min-w-0 ${
                activeTab === 'notifications'
                  ? 'text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary-dark/10'
                  : 'text-secondary dark:text-secondary-dark'
              }`}
            >
              <svg className="w-6 h-6" fill={activeTab === 'notifications' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5h-5m-6 10v-2a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2z" />
              </svg>
              <span className="text-xs font-medium">Мэдэгдэл</span>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={handleProfileSettings}
              className="flex flex-col items-center gap-1 p-3 rounded-lg transition-colors min-w-0 text-secondary dark:text-secondary-dark"
            >
              <div className="w-6 h-6 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium">Профайл</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          user={user}
          onClose={handleProfileClose}
          onUpdate={handleProfileUpdate}
          onShowWelcome={handleShowWelcome}
          onShowPrivacy={handleShowPrivacy}
          onShowCopyright={handleShowCopyright}
          onShowReport={handleShowReport}
        />
      )}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        isNewUser={isNewUser}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Copyright Modal */}
      <CopyrightModal
        isOpen={showCopyrightModal}
        onClose={() => setShowCopyrightModal(false)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

    </div>
  );
}

export default App;
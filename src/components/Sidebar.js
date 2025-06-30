import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus,
  Users,
  LogOut,
  Loader2,
  Home,
  User as UserIcon,
  Bell,
  Settings as SettingsIcon,
  Moon,
  Sun,
  ArrowLeft
} from 'lucide-react';
import { getDisplayDate } from '../utils/dateUtils';
import { cn, toggleTheme, getDomTheme } from '../utils/themeUtils';
import api from '../services/api';
import logo from '../assets/logo3.png';
import UserSearchModal from './UserSearchModal';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ user, selectedChat, onChatSelect, onLogout, isMobile, onProfileSettings, onTabChange, activeTab, unreadNotificationCount, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogoProfile, setShowLogoProfile] = useState(false);
  const [shineKey, setShineKey] = useState(0);
  const [showSettingsSection, setShowSettingsSection] = useState(false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(user.privateProfile || false);
  const [updatingPrivate, setUpdatingPrivate] = useState(false);
  const [privateError, setPrivateError] = useState('');
  const [isDark, setIsDark] = useState(getDomTheme() === 'dark');

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    // Show logo for 3 seconds every minute
    const interval = setInterval(() => {
      setShowLogoProfile(true);
      setShineKey(k => k + 1); // trigger shine
      const timeout = setTimeout(() => setShowLogoProfile(false), 5000);
      return () => clearTimeout(timeout);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsPrivateProfile(user.privateProfile || false);
  }, [user.privateProfile]);

  const loadChats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.getChats();
      if (response.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      setError('Чат жагсаалтыг уншихад алдаа гарлаа');
      console.error('Load chats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    if (chat.type === 'group') {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const tabs = [
    { id: 'feed', label: 'Фийд', icon: Home },
    { id: 'groups', label: 'Группүүд', icon: Users },
    { id: 'notifications', label: 'Мэдэгдэл', icon: Bell },
  ];

  const getChatTitle = (chat) => {
    if (chat.type === 'group') {
      return chat.name;
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop&crop=face';
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    }
  };

  const getLastMessageText = (chat) => {
    if (!chat.lastMessage?.text) return 'Мессеж байхгүй';
    
    const sender = chat.lastMessage.sender;
    const isOwnMessage = sender?._id === user._id;
    
    return isOwnMessage ? `Та: ${chat.lastMessage.text}` : chat.lastMessage.text;
  };

  const handlePrivateToggle = async () => {
    setUpdatingPrivate(true);
    setPrivateError('');
    try {
      const response = await api.updateProfile({ privateProfile: !isPrivateProfile });
      if (response.success) {
        setIsPrivateProfile(response.data.user.privateProfile);
      } else {
        setPrivateError('Шинэчлэхэд алдаа гарлаа');
      }
    } catch (e) {
      setPrivateError('Шинэчлэхэд алдаа гарлаа');
    } finally {
      setUpdatingPrivate(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setIsDark(newTheme === 'dark');
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark">
      <AnimatePresence mode="wait">
        {showSettingsSection ? (
          <motion.div
            key="settings-section"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{}}
            className="flex flex-col h-full p-6 absolute inset-0 bg-background dark:bg-background-dark z-50"
          >
            <div className="flex items-center mb-6">
              <button onClick={() => setShowSettingsSection(false)} className="mr-4 p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">Тохиргоо</h2>
            </div>
            <div className="space-y-8">
              {/* Profile Info */}
              <div className="space-y-4 pb-4 border-b border-border dark:border-border-dark">
                <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2 cursor-text">
                  Нууцлал
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-foreground dark:text-foreground-dark min-w-[110px]">Хувийн профайл</span>
                  <button
                    onClick={handlePrivateToggle}
                    disabled={updatingPrivate}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors border border-border dark:border-border-dark ${isPrivateProfile ? 'bg-primary dark:bg-primary-dark' : 'bg-muted dark:bg-muted-dark'} ${updatingPrivate ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    type="button"
                    title={isPrivateProfile ? 'Нийтийн болгох' : 'Хувийн болгох'}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isPrivateProfile ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
                {privateError && <div className="text-xs text-red-500 mt-1">{privateError}</div>}
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2 cursor-text">
                  Харагдах байдал
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-foreground dark:text-foreground-dark min-w-[110px]">{isDark ? 'Харанхуй горим' : 'Гэрэл горим'}</span>
                  <button
                    onClick={handleThemeToggle}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors border border-border dark:border-border-dark ${isDark ? 'bg-primary dark:bg-primary-dark' : 'bg-muted dark:bg-muted-dark'}`}
                    type="button"
                    title={isDark ? 'Гэрэл горимд шилжих' : 'Харанхуй горимд шилжих'}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border dark:border-border-dark bg-background dark:bg-background-dark">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${showLogoProfile ? 'opacity-80 scale-105' : 'opacity-100 scale-100'}`}
                  onClick={onProfileSettings}
                  style={{ position: 'relative' }}
                >
                  {showLogoProfile ? (
                    <img 
                      src={logo} 
                      alt="CHATLI Logo"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-secondary dark:text-secondary-dark" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-sm">{showLogoProfile ? 'CHATLI' : user.name}</h2>
                    <p className="text-xs text-secondary dark:text-secondary-dark">Онлайн</p>
                  </div>
                  {showLogoProfile && (
                    <div
                      key={shineKey}
                      className="absolute left-0 top-0 w-full h-full pointer-events-none overflow-hidden"
                      style={{ borderRadius: 9999 }}
                    >
                      <div className="shine-effect w-full h-full" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isMobile && onClose && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                      title="Хаах"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => window.location.reload(), 400);
                    }}
                    title="Нүүр хуудас руу очих"
                  >
                    <Home className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                    onClick={() => setShowSettingsSection(true)}
                    title="Тохиргоо"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={onLogout}
                    className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                    title="Гарах"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary dark:text-secondary-dark" />
                <input
                  type="text"
                  placeholder="Хэрэглэгч хайх..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted dark:bg-muted-dark rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border dark:border-border-dark bg-background dark:bg-background-dark">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (typeof onTabChange === 'function') onTabChange(tab.id);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "text-primary dark:text-primary-dark border-b-2 border-primary dark:border-primary-dark"
                      : "text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark"
                  )}
                >
                  <span className="relative flex items-center">
                    <tab.icon className="w-4 h-4" />
                    {tab.id === 'notifications' && unreadNotificationCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  <p className="text-sm">{error}</p>
                  <button 
                    onClick={loadChats}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Дахин оролдох
                  </button>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-secondary">
                  <p className="text-sm">
                    {searchQuery ? 'Чат олдсонгүй' : 'Чат байхгүй байна'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs mt-1">Шинэ чат үүсгэж эхлээрэй</p>
                  )}
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = selectedChat === chat._id;
                  
                  return (
                    <div
                      key={chat._id}
                      onClick={() => onChatSelect(chat._id)}
                      className={cn(
                        "sidebar-item",
                        isSelected && "sidebar-item-active"
                      )}
                    >
                      <div className="relative">
                        <img 
                          src={getChatAvatar(chat)}
                          alt={getChatTitle(chat)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {chat.type === 'direct' && (
                          chat.participants.find(p => p._id !== user._id)?.status === 'online' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                          )
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {getChatTitle(chat)}
                          </h3>
                          <span className="text-xs text-secondary">
                            {chat.lastMessage?.timestamp ? getDisplayDate(chat.lastMessage.timestamp) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-secondary truncate">
                            {getLastMessageText(chat)}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-primary text-primary-dark rounded-full min-w-[20px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* New Chat Button */}
            <div className="p-4 border-t border-border">
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-dark dark:bg-white dark:text-black rounded-full hover:bg-primary/90 dark:hover:bg-gray-100 transition-colors">
                <Plus className="w-4 h-4 dark:text-black" />
                <span className="text-sm font-medium">Шинэ чат</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar; 
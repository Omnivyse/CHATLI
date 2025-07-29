import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Flag, 
  Shield, 
  Trash2, 
  AlertTriangle,
  RefreshCw,
  Search,
  LogOut,
  BarChart3,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  TrendingUp,
  Eye,
  Clock,
  MousePointer
} from 'lucide-react';
import apiService from '../services/api';

const AdminDashboard = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    pendingReports: 0,
    newUsersToday: 0,
    totalPageViews: 0,
    pageViewsToday: 0,
    totalMessages: 0,
    messagesTotal: 0,
    totalPosts: 0,
    postsToday: 0,
    activeUsersToday: 0,
    avgSessionDuration: 0
  });
  const [analyticsData, setAnalyticsData] = useState({
    dailyStats: [],
    popularPages: [],
    deviceStats: [],
    browserStats: [],
    mobileStats: [],
    realtimeData: {}
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [updatingReport, setUpdatingReport] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  
  // Use ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadUsers = useCallback(async () => {
    try {
      const response = await apiService.getAllUsersAdmin();
      if (response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Load users error:', error);
      setUsers([]);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const response = await apiService.getAdminReports();
      if (response.reports) {
        setReports(response.reports);
      }
    } catch (error) {
      console.error('Load reports error:', error);
      setReports([]);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const [dailyStats, popularPages, deviceStats, realtimeData] = await Promise.allSettled([
        apiService.getAnalyticsDailyStats(7),
        apiService.getAnalyticsPopularPages(10),
        apiService.getAnalyticsDeviceStats(7),
        apiService.getAnalyticsRealtime()
      ]);

      setAnalyticsData({
        dailyStats: dailyStats.status === 'fulfilled' ? (dailyStats.value.dailyStats || []) : [],
        popularPages: popularPages.status === 'fulfilled' ? (popularPages.value.popularPages || []) : [],
        deviceStats: deviceStats.status === 'fulfilled' ? (deviceStats.value.deviceStats || []) : [],
        browserStats: deviceStats.status === 'fulfilled' ? (deviceStats.value.browserStats || []) : [],
        mobileStats: deviceStats.status === 'fulfilled' ? (deviceStats.value.mobileStats || []) : [],
        realtimeData: realtimeData.status === 'fulfilled' ? (realtimeData.value || {}) : {}
      });
    } catch (error) {
      console.error('Load analytics error:', error);
      setAnalyticsData({
        dailyStats: [],
        popularPages: [],
        deviceStats: [],
        browserStats: [],
        mobileStats: [],
        realtimeData: {}
      });
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.getAdminStats();
      if (response) {
        setStats(prevStats => ({
          ...prevStats,
          ...response
        }));
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current || hasLoadedRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('Loading dashboard data...');
      await Promise.allSettled([
        loadUsers(),
        loadReports(),
        loadStats(),
        loadAnalytics()
      ]);
      hasLoadedRef.current = true;
      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [loadUsers, loadReports, loadStats, loadAnalytics]);

  // Only load data once when modal opens
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      loadDashboardData();
    }
  }, [isOpen, loadDashboardData]);

  // Reset loaded state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
    }
  }, [isOpen]);

  const handleManualRefresh = async () => {
    if (isLoadingRef.current) return;
    
    hasLoadedRef.current = false;
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('Manual refresh - loading dashboard data...');
      await Promise.allSettled([
        loadUsers(),
        loadReports(),
        loadStats(),
        loadAnalytics()
      ]);
      hasLoadedRef.current = true;
      console.log('Manual refresh completed successfully');
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleDeleteUser = async (userId) => {
    if (deletingUser === userId) return; // Prevent multiple calls
    
    try {
      setDeletingUser(userId);
      const response = await apiService.deleteUserAdmin(userId);
      if (response.message) {
        setUsers(users.filter(u => u._id !== userId));
        setShowDeleteConfirm(null);
        alert('Хэрэглэгч амжилттай устгагдлаа');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Хэрэглэгч устгахад алдаа гарлаа');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleToggleVerification = async (userId, currentStatus) => {
    try {
      const response = await apiService.toggleUserVerification(userId, !currentStatus);
      if (response.message) {
        setUsers(users.map(u => 
          u._id === userId ? { ...u, isVerified: !currentStatus } : u
        ));
        alert(`Хэрэглэгчийн баталгаажуулалт ${!currentStatus ? 'идэвхжлээ' : 'идэвхгүй боллоо'}`);
      }
    } catch (error) {
      console.error('Toggle verification error:', error);
      alert('Баталгаажуулалт өөрчлөхөд алдаа гарлаа');
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    if (updatingReport === reportId) return; // Prevent multiple calls
    
    try {
      setUpdatingReport(reportId);
      const response = await apiService.updateAdminReportStatus(reportId, status);
      if (response.message) {
        setReports(reports.map(r => 
          r._id === reportId ? { ...r, status } : r
        ));
        // Don't show alert for status updates to reduce spam
      }
    } catch (error) {
      console.error('Update report status error:', error);
      alert('Төлөв шинэчлэхэд алдаа гарлаа');
    } finally {
      setUpdatingReport(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name || user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (isOnline) => {
    return isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}ᶳ`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}ᴹ`;
    return `${Math.round(seconds / 3600)}ᴴ`;
  };

  const tabs = [
    { id: 'overview', label: 'Тойм', icon: Shield },
    { id: 'analytics', label: 'Статистик', icon: BarChart3 },
    { id: 'users', label: 'Хэрэглэгчид', icon: Users },
    { id: 'reports', label: 'Мэдээлэл', icon: Flag }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-background dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-border dark:border-border-dark"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border dark:border-border-dark bg-red-600/10 dark:bg-red-900/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600/20 dark:bg-red-400/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground dark:text-foreground-dark">
                  Admin Dashboard
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400">🔒 Нууц удирдлагын самбар</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                title="Админ самбараас гарах"
              >
                <LogOut className="w-4 h-4" />
                Гарах
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border dark:border-border-dark">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50/50 dark:bg-red-900/10'
                    : 'text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-primary dark:text-primary-dark" />
                <span className="ml-2 text-secondary dark:text-secondary-dark">Ачаалж байна...</span>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && !loading && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                        <p className="text-xs text-blue-500 dark:text-blue-300">Нийт хэрэглэгч</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.onlineUsers}</p>
                        <p className="text-xs text-green-500 dark:text-green-300">Онлайн</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <Eye className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pageViewsToday}</p>
                        <p className="text-xs text-orange-500 dark:text-orange-300">Өнөөдрийн үзэлт</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center gap-3">
                      <Activity className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                      <div>
                        <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.activeUsersToday}</p>
                        <p className="text-xs text-cyan-500 dark:text-cyan-300">Өнөөдрийн идэвхтэй</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <Flag className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.pendingReports}</p>
                        <p className="text-xs text-red-500 dark:text-red-300">Хүлээгдэж буй мэдээлэл</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatDuration(stats.avgSessionDuration)}</p>
                        <p className="text-xs text-purple-500 dark:text-purple-300">Дундаж суултын хугацаа</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-3 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Вэбсайтын ашиглалт
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Нийт үзэлт:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{stats.totalPageViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Өнөөдрийн үзэлт:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{stats.pageViewsToday.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Шинэ хэрэглэгч өнөөдөр:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{stats.newUsersToday}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-3 flex items-center gap-2">
                      <MousePointer className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Контент үүсгэлт
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Нийт пост:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{stats.totalPosts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Өнөөдрийн пост:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{stats.postsToday}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Нийт мессеж:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{stats.totalMessages.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Бодит цагийн мэдээлэл
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Онлайн хэрэглэгч:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{analyticsData.realtimeData.currentOnlineUsers || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">Сүүлийн цагт:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{analyticsData.realtimeData.lastHourEvents || 0} үйлдэл</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary dark:text-secondary-dark">24 цагт:</span>
                        <span className="font-medium text-foreground dark:text-foreground-dark">{analyticsData.realtimeData.last24HourEvents || 0} үйлдэл</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Ачаалж байна...' : 'Шинэчлэх'}
                  </button>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && !loading && (
              <div className="space-y-6">
                {/* Device and Browser Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-4 flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Төхөөрөмжийн статистик
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.deviceStats.slice(0, 5).map((device, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-secondary dark:text-secondary-dark">
                            {device._id || 'Тодорхойгүй'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                                style={{ 
                                  width: `${Math.min(100, (device.count / Math.max(...analyticsData.deviceStats.map(d => d.count))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-foreground dark:text-foreground-dark min-w-[30px]">
                              {device.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Хөтчийн статистик
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.browserStats.slice(0, 5).map((browser, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-secondary dark:text-secondary-dark">
                            {browser._id || 'Тодорхойгүй'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                                style={{ 
                                  width: `${Math.min(100, (browser.count / Math.max(...analyticsData.browserStats.map(b => b.count))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-foreground dark:text-foreground-dark min-w-[30px]">
                              {browser.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile vs Desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-4 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Гар утас vs Компьютер
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.mobileStats.map((stat, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-secondary dark:text-secondary-dark">
                            {stat._id ? 'Гар утас' : 'Компьютер'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${stat._id ? 'bg-purple-600 dark:bg-purple-400' : 'bg-blue-600 dark:bg-blue-400'}`}
                                style={{ 
                                  width: `${Math.min(100, (stat.count / Math.max(...analyticsData.mobileStats.map(s => s.count))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-foreground dark:text-foreground-dark min-w-[40px]">
                              {stat.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                    <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Алдартай хуудас
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.popularPages.slice(0, 5).map((page, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-secondary dark:text-secondary-dark truncate max-w-[150px]">
                              {page.page || '/'}
                            </span>
                            <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                              {page.views} үзэлт
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div 
                              className="bg-orange-600 dark:bg-orange-400 h-1 rounded-full"
                              style={{ 
                                width: `${Math.min(100, (page.views / Math.max(...analyticsData.popularPages.map(p => p.views))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Daily Activity Chart Placeholder */}
                <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
                  <h4 className="font-semibold text-foreground dark:text-foreground-dark mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    7 хоногийн үйл ажиллагаа
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {analyticsData.dailyStats.map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-secondary dark:text-secondary-dark mb-2">
                          {new Date(day._id).toLocaleDateString('mn-MN', { weekday: 'short' })}
                        </div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-end justify-center p-1">
                          <div 
                            className="bg-cyan-600 dark:bg-cyan-400 rounded-t w-full min-h-[4px]"
                            style={{ 
                              height: `${Math.min(100, (day.totalEvents / Math.max(...analyticsData.dailyStats.map(d => d.totalEvents))) * 80)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-foreground dark:text-foreground-dark mt-1 font-medium">
                          {day.totalEvents}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && !loading && (
              <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary dark:text-secondary-dark" />
                    <input
                      type="text"
                      placeholder="Хэрэглэгч хайх..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-muted dark:bg-muted-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center">
                            <Users className="w-5 h-5 text-secondary dark:text-secondary-dark" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background dark:border-background-dark ${
                            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground dark:text-foreground-dark">{user.name || user.username}</h4>
                          <p className="text-sm text-secondary dark:text-secondary-dark">{user.email}</p>
                          <div className="flex items-center gap-4 text-xs text-secondary dark:text-secondary-dark mt-1">
                            <span className={getStatusColor(user.isOnline)}>
                              {user.isOnline ? 'Онлайн' : 'Офлайн'}
                            </span>
                            <span>Бүртгэл: {new Date(user.createdAt).toLocaleDateString('mn-MN')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVerification(user._id, user.isVerified)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isVerified 
                              ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400' 
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/40 text-gray-600 dark:text-gray-400'
                          }`}
                          title={user.isVerified ? 'Баталгаажуулалт хас' : 'Баталгаажуулах'}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user._id)}
                          disabled={deletingUser === user._id}
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Хэрэглэгч устгах"
                        >
                          {deletingUser === user._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && !loading && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="p-4 rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground dark:text-foreground-dark">
                            {report.category?.replace('_', ' ')} мэдээлэл
                          </h4>
                          <p className="text-sm text-secondary dark:text-secondary-dark">
                            {report.userName} • {new Date(report.createdAt).toLocaleString('mn-MN')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getReportStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground dark:text-foreground-dark mb-3">
                        {report.description}
                      </p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateReportStatus(report._id, 'reviewing')}
                          disabled={updatingReport === report._id}
                          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingReport === report._id ? 'Шинэчилж байна...' : 'Шалгаж байна'}
                        </button>
                        <button
                          onClick={() => handleUpdateReportStatus(report._id, 'resolved')}
                          disabled={updatingReport === report._id}
                          className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingReport === report._id ? 'Шинэчилж байна...' : 'Шийдсэн'}
                        </button>
                        <button
                          onClick={() => handleUpdateReportStatus(report._id, 'dismissed')}
                          disabled={updatingReport === report._id}
                          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/40 text-gray-600 dark:text-gray-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingReport === report._id ? 'Шинэчилж байна...' : 'Татгалзсан'}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {reports.length === 0 && (
                    <div className="text-center py-8">
                      <Flag className="w-12 h-12 text-secondary dark:text-secondary-dark mx-auto mb-3" />
                      <p className="text-secondary dark:text-secondary-dark">Мэдээлэл байхгүй</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
              <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full p-6 border border-border dark:border-border-dark">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                      Хэрэглэгч устгах
                    </h3>
                    <p className="text-sm text-secondary dark:text-secondary-dark">
                      Энэ үйлдлийг буцаах боломжгүй
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-foreground dark:text-foreground-dark mb-6">
                  Та энэ хэрэглэгчийг бүрмөсөн устгахыг хүсэж байна уу? 
                  Бүх мэдээлэл, пост, мессеж устах болно.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deletingUser}
                    className="flex-1 py-2 px-4 bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark rounded-lg hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-colors disabled:opacity-50"
                  >
                    Цуцлах
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    disabled={deletingUser}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Устгаж байна...
                      </>
                    ) : (
                      'Устгах'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminDashboard; 
import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import apiService from '../services/api';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if admin is already logged in
    const checkAdminSession = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const adminSession = localStorage.getItem('adminSession');
        
        // If no admin token, don't even try to verify
        if (!adminToken || !adminSession) {
          setLoading(false);
          return;
        }
        
        if (adminToken && adminSession === 'authenticated') {
          const response = await apiService.verifyAdminToken();
          if (response.valid) {
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminSession');
            localStorage.removeItem('adminLoginTime');
          }
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // Token invalid, clear storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminLoginTime');
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  const handleAdminLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Нэвтрэх амжилтгүй болсон');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await apiService.adminLogout();
    } catch (error) {
      console.error('Admin logout error:', error);
    }
    
    setIsAuthenticated(false);
    setError('');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminToken');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-gray-900 to-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-gray-900 to-black">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6 max-w-md">
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => setError('')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Дахин оролдох
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onAdminLogin={handleAdminLogin} />;
  }

  return <AdminDashboard isOpen={true} onClose={handleAdminLogout} />;
};

export default AdminPanel; 
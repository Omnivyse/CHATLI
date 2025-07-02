import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import apiService from '../services/api';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const checkAdminSession = async () => {
      const adminToken = localStorage.getItem('adminToken');
      const adminSession = localStorage.getItem('adminSession');
      
      if (adminToken && adminSession === 'authenticated') {
        try {
          const response = await apiService.verifyAdminToken();
          if (response.valid) {
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminSession');
            localStorage.removeItem('adminLoginTime');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token invalid, clear storage
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminSession');
          localStorage.removeItem('adminLoginTime');
        }
      }
      setLoading(false);
    };

    checkAdminSession();
  }, []);

  const handleAdminLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await apiService.adminLogout();
    } catch (error) {
      console.error('Admin logout error:', error);
    }
    
    setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return <AdminLogin onAdminLogin={handleAdminLogin} />;
  }

  return <AdminDashboard isOpen={true} onClose={handleAdminLogout} />;
};

export default AdminPanel; 
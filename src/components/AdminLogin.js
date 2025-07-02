import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import logo from '../assets/logo2.png';
import apiService from '../services/api';

const AdminLogin = ({ onAdminLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.adminLogin({
        username: credentials.username.trim(),
        password: credentials.password
      });

      if (response.token) {
        // Success - call the parent function to show admin dashboard
        onAdminLogin(true);
        // Store admin session in localStorage
        localStorage.setItem('adminSession', 'authenticated');
        localStorage.setItem('adminLoginTime', new Date().getTime().toString());
      } else {
        setError('Нэвтрэх амжилтгүй болов');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      
      if (error.message.includes('Account locked')) {
        setError('Бүртгэл түр хориглогдсон байна. Дахин оролдоно уу.');
      } else if (error.message.includes('attempts remaining')) {
        const match = error.message.match(/(\d+) attempts remaining/);
        const remaining = match ? match[1] : 'цөөн';
        setError(`Буруу нэвтрэх мэдээлэл. ${remaining} оролдлого үлдлээ.`);
      } else if (error.message.includes('Invalid credentials')) {
        setError('Буруу нэр эсвэл нууц үг');
      } else {
        setError('Нэвтрэх үед алдаа гарлаа');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-red-900 via-gray-900 to-black">
      {/* Animated background elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-800 opacity-20 rounded-full filter blur-3xl animate-pulse z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gray-300 opacity-10 rounded-full filter blur-3xl animate-pulse z-0" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, duration: 0.7 }}
        className="relative z-10 bg-white/90 dark:bg-black/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center border border-red-200 dark:border-red-800"
      >
        {/* Logo and Title */}
        <div className="mb-6 text-center">
          <img src={logo} alt="CHATLI Logo" className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm text-red-500 dark:text-red-400">🔒 Нууц удирдлагын систем</p>
        </div>

        {/* Warning Notice */}
        <div className="w-full mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300 text-center">
            ⚠️ <strong>Анхааруулга:</strong> Зөвхөн админ хэрэглэгчдэд зориулагдсан
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Админ нэр
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="admin"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Нууц үг
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !credentials.username || !credentials.password}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Шалгаж байна...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Нэвтрэх
              </>
            )}
          </button>
        </form>

        {/* Security Info */}
        <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 w-full">
          <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
            <strong>Аюулгүй байдал:</strong> 5 удаа буруу оролдвол 15 минут хориглогдоно
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            CHATLI Platform Admin Panel v1.0
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            © 2024 CHATLI. Админ эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin; 
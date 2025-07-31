import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        if (res.success) {
          onLogin(res.data.user, { isNewUser: false });
        } else {
          setError(res.message || 'Нэвтрэхэд алдаа гарлаа');
        }
      } else {
        const res = await api.register({ name, username, email, password });
        if (res.success) {
          // For new users, check if they need email verification
          const userData = res.data.user;
          onLogin(userData, { isNewUser: true });
        } else {
          setError(res.message || 'Бүртгүүлэхэд алдаа гарлаа');
        }
      }
    } catch (e) {
      setError(e.message || (mode === 'login' ? 'Нэвтрэхэд алдаа гарлаа' : 'Бүртгүүлэхэд алдаа гарлаа'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-white">
      {/* Animated grayscale blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gray-800 opacity-30 rounded-full filter blur-3xl animate-pulse z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gray-300 opacity-30 rounded-full filter blur-3xl animate-pulse z-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, duration: 0.7 }}
        className="relative z-10 bg-white/80 dark:bg-black/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center border border-gray-200 dark:border-gray-800"
      >
        <img src={logo} alt="CHATLI Logo" className="w-20 h-20 mb-4 drop-shadow-lg" />
        <h1 className="text-4xl font-extrabold mb-2 text-center text-black dark:text-white tracking-wide drop-shadow">
          {/* do not change this text */}
          "CHATLI"
        </h1>
        <p className="text-secondary mb-4 text-center">The First Mongolian Social Platform</p>
        <div className="mb-6 p-3 bg-orange-100/80 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/30">
          <p className="text-xs text-orange-800 dark:text-orange-200 text-center">
            🚧 <strong>BETA хувилбар</strong> - Туршилтын горим
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Профайл нэр"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-border bg-transparent focus:ring-0 focus:border-primary transition placeholder:text-secondary text-black dark:text-white text-base rounded-none"
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Нэр"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-border bg-transparent focus:ring-0 focus:border-primary transition placeholder:text-secondary text-black dark:text-white text-base rounded-none"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Имэйл"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-0 py-2 border-0 border-b border-border bg-transparent focus:ring-0 focus:border-primary transition placeholder:text-secondary text-black dark:text-white text-base rounded-none"
            required
            autoFocus={mode === 'login'}
          />
          <input
            type="password"
            placeholder="Нууц үг"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-0 py-2 border-0 border-b border-border bg-transparent focus:ring-0 focus:border-primary transition placeholder:text-secondary text-black dark:text-white text-base rounded-none"
            required
          />
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50 border-0 shadow-none"
            disabled={loading}
          >
            {loading ? (mode === 'login' ? 'Нэвтэрч байна...' : 'Бүртгүүлж байна...') : (mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх')}
          </button>
        </form>
        <button
          className="mt-6 text-sm text-secondary hover:text-black dark:hover:text-white transition border-0 bg-transparent p-0 underline"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Бүртгэл үүсгэх' : 'Буцах' }
        </button>
      </motion.div>
    </div>
  );
};

export default Login; 
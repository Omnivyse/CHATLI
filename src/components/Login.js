import React, { useState, useMemo } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import ForgotPasswordModal from './ForgotPasswordModal';

// Password rules must match server: min 10, max 128, lowercase, uppercase, digit, special
const PASSWORD_RULES = [
  { id: 'length', label: 'Хамгийн багадаа 10 тэмдэгт', test: (p) => p.length >= 10 },
  { id: 'uppercase', label: 'Нэг том үсэг (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Нэг жижиг үсэг (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Нэг тоо (0-9)', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Нэг тусгай тэмдэгт (!@#$%^&* гэх мэт)', test: (p) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(p) },
];

const Login = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const passwordChecks = useMemo(() => 
    PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) })),
    [password]
  );

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
          
          // Check if email was sent
          if (!res.data.emailSent) {
            console.warn('⚠️ Email was not sent during registration');
            // Show warning but still allow login
            if (process.env.NODE_ENV === 'development' && userData.verificationCode) {
              console.log('📧 Verification code (dev):', userData.verificationCode);
            }
          }
          
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

  const handleForgotPasswordSuccess = (user) => {
    onLogin(user, { isNewUser: false });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-white">
      {/* Back button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="absolute top-8 left-8 z-20 text-white hover:text-gray-300 transition-colors flex items-center space-x-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-lg font-medium">Буцах</span>
        </motion.button>
      )}
      
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
          {mode === 'register' && (
            <div className="rounded-lg border border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30 p-3">
              <p className="text-xs text-secondary dark:text-secondary-dark mb-2">
                Нууц үгэнд дараах шаардлагыг хангана уу:
              </p>
              <ul className="space-y-1.5">
                {passwordChecks.map(({ id, label, ok }) => (
                  <li key={id} className="flex items-center gap-2 text-sm">
                    {ok ? (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center" aria-hidden>
                        <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center" aria-hidden>
                        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                    <span className={ok ? 'text-green-700 dark:text-green-400' : 'text-secondary dark:text-secondary-dark'}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Нууц үг"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-0 py-2 pr-8 border-0 border-b border-border bg-transparent focus:ring-0 focus:border-primary transition placeholder:text-secondary text-black dark:text-white text-base rounded-none"
              required
              minLength={mode === 'register' ? 10 : undefined}
              maxLength={mode === 'register' ? 128 : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 text-secondary hover:text-black dark:hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50 border-0 shadow-none"
            disabled={loading}
          >
            {loading ? (mode === 'login' ? 'Нэвтэрч байна...' : 'Бүртгүүлж байна...') : (mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх')}
          </button>
        </form>
        
        {/* Forgot Password Link - Only show in login mode */}
        {mode === 'login' && (
          <button
            className="mt-4 text-sm text-secondary hover:text-black dark:hover:text-white transition border-0 bg-transparent p-0 underline"
            onClick={() => setShowForgotPassword(true)}
          >
            Нууц үг мартсан?
          </button>
        )}
        
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    </div>
  );
};

export default Login; 
import React, { useState } from 'react';
import api from '../services/api';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Имэйл хаяг оруулна уу');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.forgotPassword(email);
      
      if (response.success) {
        setSuccess('Нууц үг сэргээх код имэйл хаяг руу илгээгдлээ');
        setStep(2);
      } else {
        setError(response.message || 'Код илгээхэд алдаа гарлаа');
      }
    } catch (error) {
      setError(error.message || 'Код илгээхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 5) {
      setError('5 оронтой код оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.verifyResetCode(email, code);
      
      if (response.success) {
        setResetToken(response.data.resetToken);
        setStep(3);
      } else {
        setError(response.message || 'Код буруу байна');
      }
    } catch (error) {
      setError(error.message || 'Код шалгахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError('Шинэ нууц үг оруулна уу');
      return;
    }

    if (newPassword.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Нууц үгнүүд таарахгүй байна');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.resetPassword(resetToken, newPassword);
      
      if (response.success) {
        setSuccess('Нууц үг амжилттай сэргээгдлээ');
        
        // Auto-login with new token
        if (response.data.token) {
          api.setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          setTimeout(() => {
            onSuccess(response.data.user);
            onClose();
          }, 1500);
        }
      } else {
        setError(response.message || 'Нууц үг сэргээхэд алдаа гарлаа');
      }
    } catch (error) {
      setError(error.message || 'Нууц үг сэргээхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setResetToken('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Нууц үг сэргээх
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Имэйл хаяг
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Имэйл хаягаа оруулна уу"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Илгээж байна...' : 'Код илгээх'}
            </button>
          </form>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                5 оронтой код
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center text-lg tracking-widest"
                placeholder="00000"
                maxLength={5}
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Имэйл хаяг руу илгээсэн 5 оронтой кодыг оруулна уу
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Буцах
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 5}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Шалгаж байна...' : 'Шалгах'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Шинэ нууц үг
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Шинэ нууц үг"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Нууц үг давтах
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Нууц үг давтах"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Буцах
              </button>
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Сэргээж байна...' : 'Нууц үг сэргээх'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal; 
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/api';

const EmailVerificationModal = ({ 
  visible, 
  onClose, 
  user, 
  onVerificationSuccess 
}) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [textAreaCode, setTextAreaCode] = useState('');
  const [useTextArea, setUseTextArea] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (visible) {
      setVerificationCode(['', '', '', '', '']);
      setTextAreaCode('');
      setError('');
      setCountdown(0);
      // Focus first input after modal opens
      setTimeout(() => {
        if (useTextArea) {
          // Text area will auto-focus
        } else {
          inputRefs.current[0]?.focus();
        }
      }, 300);
    }
  }, [visible]);

  const handleCodeChange = (text, index) => {
    if (text.length > 1) {
      text = text[0];
    }

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);
    setError('');

    // Auto-focus next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 4 && text && newCode.every(digit => digit !== '')) {
      handleVerification();
    }
  };

  const handleTextAreaChange = (text) => {
    // Only allow numbers and limit to 5 digits
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 5) {
      setTextAreaCode(numericText);
      setError('');
      
      // Auto-submit when 5 digits are entered
      if (numericText.length === 5) {
        handleVerification(numericText);
      }
    }
  };

  const handleVerification = async (codeFromTextArea = null) => {
    const code = codeFromTextArea || verificationCode.join('');
    if (code.length !== 5) {
      setError('5 оронтой код оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyEmail(code, user.email);
      
      if (response.success) {
        alert('Имэйл хаяг амжилттай баталгаажлаа!');
        onVerificationSuccess(response.data.user);
        onClose();
      } else {
        setError(response.message || 'Баталгаажуулалт амжилтгүй болсон');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Баталгаажуулалт амжилтгүй болсон. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user.email || countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const response = await apiService.resendVerificationEmail(user.email);
      
      if (response.success) {
        alert('Баталгаажуулах имэйл дахин илгээгдлээ');
        setCountdown(60); // Start countdown
        setVerificationCode(['', '', '', '', '']);
        setTextAreaCode('');
        setError('');
        // Focus first input
        if (useTextArea) {
          // Text area will auto-focus
        } else {
          inputRefs.current[0]?.focus();
        }
      } else {
        setError(response.message || 'Имэйл илгээхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Имэйл баталгаажуулалт
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">
                  {user.email}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 text-center">
                Имэйл хаягаа шалгаж, 5 оронтой кодыг оруулна уу
              </p>

              {/* Input Toggle */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  Оролтын хэлбэр:
                </span>
                <button
                  onClick={() => setUseTextArea(!useTextArea)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {useTextArea ? 'Цэгүүд' : 'Текст'}
                </button>
              </div>

              {/* Code Input */}
              {useTextArea ? (
                <input
                  type="text"
                  value={textAreaCode}
                  onChange={(e) => handleTextAreaChange(e.target.value)}
                  placeholder="12345"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-mono tracking-widest bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  maxLength={5}
                  autoFocus
                />
              ) : (
                <div className="flex justify-center space-x-2 mb-4">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(e.target.value, index)}
                      className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-mono bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm text-center mb-4">
                  {error}
                </p>
              )}

              {/* Timer */}
              {countdown > 0 && (
                <div className="flex items-center justify-center mb-4 text-gray-500 dark:text-gray-400 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Код {formatTime(countdown)} минутын дараа дуусна
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleVerification}
                  disabled={loading || (verificationCode.join('').length !== 5 && textAreaCode.length !== 5)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    (verificationCode.join('').length === 5 || textAreaCode.length === 5) && !loading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Баталгаажуулж байна...
                    </div>
                  ) : (
                    'Баталгаажуулах'
                  )}
                </button>

                <button
                  onClick={handleResendVerification}
                  disabled={countdown > 0 || resendLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    countdown > 0 || resendLoading
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {resendLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Илгээж байна...
                    </div>
                  ) : (
                    'Дахин илгээх'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailVerificationModal; 
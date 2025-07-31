import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EmailVerificationBanner = ({ 
  user, 
  onGoToVerification, 
  onCancel,
  visible = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 border-b border-orange-600 shadow-lg"
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Имэйл хаягаа баталгаажуулна уу
                  </h3>
                  <p className="text-orange-100 text-xs">
                    Бүрэн функцүүдийг ашиглахын тулд имэйл хаягаа баталгаажуулна уу
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={onGoToVerification}
                  className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium text-sm hover:bg-orange-50 transition-colors"
                >
                  Баталгаажуулах
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-white hover:bg-orange-600 rounded-lg font-medium text-sm transition-colors"
                >
                  Цуцлах
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailVerificationBanner; 
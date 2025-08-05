import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, RefreshCw } from 'lucide-react';
import pwaService from '../services/pwaService';

const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [installInstructions, setInstallInstructions] = useState(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the install prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setDismissedInstall(true);
    }

    // Set up PWA service event handlers
    pwaService.onInstallAvailable = () => {
      if (!dismissedInstall && !pwaService.isInstalled) {
        setShowInstallPrompt(true);
        setInstallInstructions(pwaService.getInstallInstructions());
      }
    };

    pwaService.onInstallSuccess = () => {
      setShowInstallPrompt(false);
      setIsInstalling(false);
    };

    pwaService.onUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    // Check if install is available immediately
    if (pwaService.isInstallable() && !dismissedInstall) {
      setShowInstallPrompt(true);
      setInstallInstructions(pwaService.getInstallInstructions());
    }

    // Check if update is available
    if (pwaService.isUpdateAvailable()) {
      setShowUpdatePrompt(true);
    }
  }, [dismissedInstall]);

  const handleInstall = async () => {
    setIsInstalling(true);
    pwaService.trackPWAEvent('install_prompt_clicked');
    
    const success = await pwaService.showInstallPrompt();
    
    if (success) {
      pwaService.trackPWAEvent('install_accepted');
      // Request notification permission after install
      setTimeout(() => {
        pwaService.requestNotificationPermission();
      }, 1000);
    } else {
      pwaService.trackPWAEvent('install_declined');
    }
    
    setIsInstalling(false);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    pwaService.trackPWAEvent('update_accepted');
    
    await pwaService.updateServiceWorker();
    
    // Reload page to activate new version
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    setDismissedInstall(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    pwaService.trackPWAEvent('install_dismissed');
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
    pwaService.trackPWAEvent('update_dismissed');
  };

  // Don't show if already installed or in standalone mode
  if (pwaService.isInstalled || window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
          >
            <div className="bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-xl shadow-xl p-4 backdrop-blur-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground dark:text-foreground-dark text-sm">
                      CHATLI-г суулгах
                    </h3>
                    <p className="text-xs text-secondary dark:text-secondary-dark">
                      Хурдан хандалттай болгохын тулд апп суулгана уу
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissInstall}
                  className="p-1 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                >
                  <X className="w-4 h-4 text-secondary dark:text-secondary-dark" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDismissInstall}
                  className="flex-1 py-2 px-3 text-xs text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark transition-colors"
                >
                  Дараа
                </button>
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isInstalling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Суулгаж байна...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Суулгах
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
          >
            <div className="bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-xl shadow-xl p-4 backdrop-blur-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground dark:text-foreground-dark text-sm">
                      Шинэчлэлт бэлэн
                    </h3>
                    <p className="text-xs text-secondary dark:text-secondary-dark">
                      Шинэ хувилбар суулгана уу
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissUpdate}
                  className="p-1 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                >
                  <X className="w-4 h-4 text-secondary dark:text-secondary-dark" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDismissUpdate}
                  className="flex-1 py-2 px-3 text-xs text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark transition-colors"
                >
                  Дараа
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Шинэчилж байна...
                    </>
                  ) : (
                    'Шинэчлэх'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAInstallPrompt; 
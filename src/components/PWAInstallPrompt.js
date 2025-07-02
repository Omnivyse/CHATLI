import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, RefreshCw, HelpCircle } from 'lucide-react';
import pwaService from '../services/pwaService';
import MobileInstallGuide from './MobileInstallGuide';

const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
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

  const handleShowGuide = () => {
    setShowInstallGuide(true);
    pwaService.trackPWAEvent('install_guide_opened');
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
  if (pwaService.isInstalled || pwaService.isStandalone) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
          >
            <div className="bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-2xl shadow-2xl p-6 backdrop-blur-lg">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary dark:text-primary-dark" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-foreground-dark">
                      App суулгах
                    </h3>
                    <p className="text-xs text-secondary dark:text-secondary-dark">
                      CHATLI-г суулгаж хурдан хандаарай
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissInstall}
                  className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                  title="Хаах"
                >
                  <X className="w-4 h-4 text-secondary dark:text-secondary-dark" />
                </button>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>⚡ Хурдан ачаалалт</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>📱 Нүүр дэлгэцэн дэх icon</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>🔔 Push мэдэгдэл</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>🌐 Офлайн ашиглах</span>
                </div>
              </div>

              {/* Platform specific instructions */}
              {installInstructions && installInstructions.platform !== 'Desktop' && (
                <div className="mb-4 p-3 bg-muted/50 dark:bg-muted-dark/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-primary dark:text-primary-dark" />
                    <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                      {installInstructions.platform} дээр суулгах:
                    </span>
                  </div>
                  <div className="space-y-1">
                    {installInstructions.instructions.slice(0, 2).map((instruction, index) => (
                      <p key={index} className="text-xs text-secondary dark:text-secondary-dark">
                        {index + 1}. {instruction}
                      </p>
                    ))}
                    <button
                      onClick={handleShowGuide}
                      className="text-xs text-primary dark:text-primary-dark hover:underline flex items-center gap-1 mt-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Дэлгэрэнгүй заавар харах
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDismissInstall}
                  className="flex-1 py-2 px-4 text-sm text-secondary dark:text-secondary-dark hover:text-foreground dark:hover:text-foreground-dark transition-colors"
                >
                  Дараа
                </button>
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 py-2 px-4 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              {/* Guide Button for platforms that don't support direct install */}
              {!pwaService.isInstallable() && (
                <div className="mt-3 pt-3 border-t border-border dark:border-border-dark">
                  <button
                    onClick={handleShowGuide}
                    className="w-full py-2 px-4 bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark rounded-lg hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Суулгах заавар харах
                  </button>
                </div>
              )}
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

      {/* Mobile Install Guide Modal */}
      <MobileInstallGuide 
        isOpen={showInstallGuide} 
        onClose={() => setShowInstallGuide(false)} 
      />
    </>
  );
};

export default PWAInstallPrompt; 
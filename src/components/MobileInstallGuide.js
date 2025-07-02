import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Plus, MoreVertical, Check } from 'lucide-react';

const MobileInstallGuide = ({ isOpen, onClose }) => {
  const [currentPlatform, setCurrentPlatform] = useState('ios');

  useEffect(() => {
    // Auto-detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setCurrentPlatform('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setCurrentPlatform('ios');
    } else {
      setCurrentPlatform('desktop');
    }
  }, []);

  const platforms = {
    ios: {
      name: 'iPhone/iPad',
      icon: '📱',
      steps: [
        { step: 1, title: 'Safari хөтчийг нээнэ үү', description: 'CHATLI сайтыг Safari хөтчөөр нээнэ үү', icon: '🌐' },
        { step: 2, title: 'Хуваалцах товчийг дарна уу', description: 'Доод хэсгээс Share товчийг (⬆️) дарна уу', icon: <Share className="w-6 h-6" /> },
        { step: 3, title: '"Add to Home Screen" сонгоно уу', description: 'Жагсаалтаас "Нүүр дэлгэцэнд нэмэх" сонголтыг дарна уу', icon: <Plus className="w-6 h-6" /> },
        { step: 4, title: '"Add" товчийг дарна уу', description: 'Баталгаажуулах цонхноос "Add" товчийг дарна уу', icon: <Check className="w-6 h-6" /> }
      ]
    },
    android: {
      name: 'Android',
      icon: '🤖',
      steps: [
        { step: 1, title: 'Chrome хөтчийг нээнэ үү', description: 'CHATLI сайтыг Chrome хөтчөөр нээнэ үү', icon: '🌐' },
        { step: 2, title: 'Цэсний товчийг дарна уу', description: 'Баруун дээд булангаас цэсний товчийг (⋮) дарна уу', icon: <MoreVertical className="w-6 h-6" /> },
        { step: 3, title: '"Install app" сонгоно уу', description: 'Цэсээс "Install app" сонголтыг дарна уу', icon: <Download className="w-6 h-6" /> },
        { step: 4, title: '"Install" товчийг дарна уу', description: 'Баталгаажуулах цонхноос "Install" товчийг дарна уу', icon: <Check className="w-6 h-6" /> }
      ]
    },
    desktop: {
      name: 'Компьютер',
      icon: '💻',
      steps: [
        { step: 1, title: 'Chrome хөтчийг ашиглана уу', description: 'Chrome эсвэл Edge хөтчөөр нээнэ үү', icon: '🌐' },
        { step: 2, title: 'Суулгах товчийг хайна уу', description: 'Хаягийн мөрөн дэх Install товчийг дарна уу', icon: <Download className="w-6 h-6" /> },
        { step: 3, title: 'Цэсээс суулгана уу', description: 'Эсвэл цэсээс "Install CHATLI" сонголтыг хайна уу', icon: <MoreVertical className="w-6 h-6" /> },
        { step: 4, title: 'Суулгах товчийг дарна уу', description: 'Баталгаажуулах цонхноос суулгах товчийг дарна уу', icon: <Check className="w-6 h-6" /> }
      ]
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-background dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border dark:border-border-dark"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border dark:border-border-dark bg-primary/10 dark:bg-primary-dark/10">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-primary dark:text-primary-dark" />
              <div>
                <h3 className="text-xl font-bold">📱 CHATLI App суулгах заавар</h3>
                <p className="text-sm text-secondary dark:text-secondary-dark">
                  Таны төхөөрөмж дээр app болгон суулгаарай
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Tabs */}
          <div className="flex border-b border-border dark:border-border-dark">
            {Object.entries(platforms).map(([key, platform]) => (
              <button
                key={key}
                onClick={() => setCurrentPlatform(key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  currentPlatform === key
                    ? 'text-primary dark:text-primary-dark border-b-2 border-primary dark:border-primary-dark'
                    : 'text-secondary dark:text-secondary-dark hover:text-foreground'
                }`}
              >
                {platform.icon} {platform.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {platforms[currentPlatform].steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 dark:bg-muted-dark/30"
                >
                  <div className="w-8 h-8 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-black flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {typeof step.icon === 'string' ? (
                        <span className="text-lg">{step.icon}</span>
                      ) : (
                        <div className="text-primary dark:text-primary-dark">{step.icon}</div>
                      )}
                      <h5 className="font-medium">{step.title}</h5>
                    </div>
                    <p className="text-sm text-secondary dark:text-secondary-dark">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: '⚡', title: 'Хурдан ачаалалт' },
                { icon: '📱', title: 'Нүүр дэлгэцэн дэх icon' },
                { icon: '🔔', title: 'Push мэдэгдэл' },
                { icon: '🌐', title: 'Офлайн ашиглах' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <span className="text-lg">{benefit.icon}</span>
                  <span className="text-sm font-medium">{benefit.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border dark:border-border-dark">
            <button
              onClick={onClose}
              className="w-full py-2 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-lg font-medium"
            >
              Ойлголоо
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MobileInstallGuide; 

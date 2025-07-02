import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Users, Image, Video, Bell, Shield, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';

const WelcomeModal = ({ isOpen, onClose, isNewUser = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: MessageCircle,
      title: 'Мессеж солилцох',
      description: 'Бодит цагийн мессеж солилцох, хариу өгөх, реакц үүсгэх'
    },
    {
      icon: Users,
      title: 'Хэрэглэгчид',
      description: 'Бусад хэрэглэгчдийг дагах, хувийн профайл тохируулах'
    },
    {
      icon: Image,
      title: 'Зураг хуваалцах',
      description: 'Өндөр чанартай зураг upload хийх, харах'
    },
    {
      icon: Video,
      title: 'Видео контент',
      description: 'Видео үзэх, хуваалцах, босоо болон хэвтээ формат дэмжих'
    },
    {
      icon: Bell,
      title: 'Мэдэгдэл',
      description: 'Шинэ мессеж, дагагч, реакцийн мэдэгдэл авах'
    },
    {
      icon: Shield,
      title: 'Аюулгүй байдал',
      description: 'JWT баталгаажуулалт, хувийн мэдээлэл хамгаалах'
    }
  ];

  const updates = [
    'Beta хувилбар - туршилтын горим',
    'Cloudinary интеграци - хурдан зураг/видео upload',
    'Видео автомат размер тохируулга',
    'Хэрэглэгч татах/устгах функц',
    'Сайжруулсан UI/UX дизайн',
    'Хурдасгасан мессеж ачаалалт',
    'Монгол хэл дэмжлэг'
  ];

  const slides = [
    {
      title: isNewUser ? 'Тавтай морил!' : 'Сайн уу!',
      content: (
        <div className="text-center">
          <div className="mb-6">
            <img src={logo} alt="CHATLI" className="w-20 h-20 mx-auto rounded-full" />
          </div>
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-2">
            CHATLI Platform
          </h2>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 dark:from-orange-400/20 dark:to-red-400/20 rounded-full px-3 py-1 mb-4">
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              🚧 BETA ТЕСТ
            </span>
          </div>
          <p className="text-secondary dark:text-secondary-dark mb-4">
            {isNewUser 
              ? 'Манай платформд тавтай морил! Бид танд хамгийн сайн мессеж солилцох туршлага санал болгож байна.'
              : 'Дахин тавтай морил! Шинэ шинэчлэлтүүдийг харцгаая.'
            }
          </p>
          
          {/* Beta Warning */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 mb-4 border border-orange-200/50 dark:border-orange-700/30">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-sm">
                <p className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                  Beta тестийн анхааруулга
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  Энэ бол туршилтын хувилбар бөгөөд зарим функц алдаатай байж болно. Таны санал хүсэлт бидэнд чухал!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 dark:bg-primary-dark/10 rounded-lg p-4">
            <p className="text-sm font-medium text-primary dark:text-primary-dark">
              Хувилбар 2.1.0 BETA - 2024 оны 12 сар
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Онцлог шинж чанарууд',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted-dark/50"
            >
              <div className="p-2 rounded-full bg-primary/20 dark:bg-primary-dark/20">
                <feature.icon className="w-4 h-4 text-primary dark:text-primary-dark" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground dark:text-foreground-dark">
                  {feature.title}
                </h4>
                <p className="text-xs text-secondary dark:text-secondary-dark mt-1">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: 'Шинэ шинэчлэлтүүд',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 dark:from-primary-dark/20 dark:to-purple-400/20 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4 text-primary dark:text-primary-dark" />
              <span className="text-sm font-medium text-primary dark:text-primary-dark">
                Шинэ боломжууд
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            {updates.map((update, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 dark:bg-muted-dark/30 border border-border/50 dark:border-border-dark/50"
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-foreground dark:text-foreground-dark">
                  {update}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Зөвлөгөө:</strong> Профайл тохиргооноос хувийн профайл болон бусад тохиргоог өөрчлөх боломжтой.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                🧪 <strong>Beta тестэр:</strong> Алдаа олсон эсвэл санал байвал бидэнд мэдэгдээрэй. Таны санал хүсэлт бидэнд чухал!
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-background dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border dark:border-border-dark"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center">
                <span className="text-lg">👋</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                {slides[currentSlide].title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
            >
              <X className="w-5 h-5 text-secondary dark:text-secondary-dark" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {slides[currentSlide].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide
                      ? 'bg-primary dark:bg-primary-dark'
                      : 'bg-muted dark:bg-muted-dark'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {currentSlide > 0 && (
                <button
                  onClick={prevSlide}
                  className="px-4 py-2 text-sm rounded-lg border border-border dark:border-border-dark hover:bg-muted dark:hover:bg-muted-dark transition-colors"
                >
                  Өмнөх
                </button>
              )}
              
              {currentSlide < slides.length - 1 ? (
                <button
                  onClick={nextSlide}
                  className="px-4 py-2 text-sm bg-primary dark:bg-primary-dark text-primary-dark dark:text-foreground-dark rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors"
                >
                  Дараах
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-sm bg-primary dark:bg-primary-dark text-primary-dark dark:text-foreground-dark rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors font-medium"
                >
                  Эхлэх
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeModal; 
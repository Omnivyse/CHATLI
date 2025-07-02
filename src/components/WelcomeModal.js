import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Users, Image, Video, Bell, Shield, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '../assets/logo.png';

const WelcomeModal = ({ isOpen, onClose, isNewUser = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle touch events for swipe navigation
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isMobile || !touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      nextSlide();
    }
    if (isRightSwipe && currentSlide > 0) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

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
          <div className={`mb-3 ${isMobile ? 'mb-2' : 'md:mb-4'}`}>
            <img src={logo} alt="CHATLI" className={`mx-auto rounded-full ${isMobile ? 'w-12 h-12' : 'w-16 h-16 md:w-20 md:h-20'}`} />
          </div>
          <h2 className={`font-bold text-foreground dark:text-foreground-dark mb-2 ${isMobile ? 'text-lg' : 'text-xl md:text-2xl'}`}>
            CHATLI Platform
          </h2>
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 dark:from-orange-400/20 dark:to-red-400/20 rounded-full px-3 py-1 mb-2 ${isMobile ? 'mb-2' : 'md:mb-3'}`}>
            <span className={`font-bold text-orange-600 dark:text-orange-400 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
              🚧 BETA ТЕСТ
            </span>
          </div>
          <p className={`text-secondary dark:text-secondary-dark mb-2 px-2 ${isMobile ? 'text-xs mb-3' : 'text-sm md:text-base md:mb-4'}`}>
            {isNewUser 
              ? 'Манай платформд тавтай морил! Бид танд хамгийн сайн мессеж солилцох туршлага санал болгож байна.'
              : 'Дахин тавтай морил! Шинэ шинэчлэлтүүдийг харцгаая.'
            }
          </p>
          
          {/* Beta Warning */}
          <div className={`bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 mb-3 border border-orange-200/50 dark:border-orange-700/30 ${isMobile ? 'p-2 mb-2' : 'md:p-4 md:mb-4'}`}>
            <div className={`flex items-start gap-2 ${isMobile ? 'gap-2' : 'md:gap-3'}`}>
              <span className={`flex-shrink-0 ${isMobile ? 'text-sm' : 'text-lg md:text-xl'}`}>⚠️</span>
              <div className={`${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                <p className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                  Beta тестийн анхааруулга
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  {isMobile 
                    ? 'Туршилтын хувилбар. Алдаа гарч болно.'
                    : 'Энэ бол туршилтын хувилбар бөгөөд зарим функц алдаатай байж болно. Таны санал хүсэлт бидэнд чухал!'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-primary/10 dark:bg-primary-dark/10 rounded-lg p-3 ${isMobile ? 'p-2' : 'md:p-4'}`}>
            <p className={`font-medium text-primary dark:text-primary-dark ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
              Хувилбар 2.1.0 BETA - 2025 оны 7 сар
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Онцлог шинж чанарууд',
      content: (
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'md:grid-cols-2 gap-4'}`}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted-dark/50 ${isMobile ? 'p-2 gap-2' : ''}`}
            >
              <div className={`p-2 rounded-full bg-primary/20 dark:bg-primary-dark/20 flex-shrink-0 ${isMobile ? 'p-1.5' : ''}`}>
                <feature.icon className={`text-primary dark:text-primary-dark ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`font-medium text-foreground dark:text-foreground-dark ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {feature.title}
                </h4>
                <p className={`text-secondary dark:text-secondary-dark mt-1 ${isMobile ? 'text-xs leading-tight' : 'text-xs'}`}>
                  {isMobile ? feature.title : feature.description}
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
        <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'md:space-y-4'}`}>
          <div className={`text-center mb-4 ${isMobile ? 'mb-2' : 'md:mb-6'}`}>
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 dark:from-primary-dark/20 dark:to-purple-400/20 rounded-full px-3 py-2 ${isMobile ? 'px-2 py-1' : 'md:px-4'}`}>
              <Sparkles className={`text-primary dark:text-primary-dark ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`font-medium text-primary dark:text-primary-dark ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                Шинэ боломжууд
              </span>
            </div>
          </div>
          
          <div className={`space-y-2 max-h-48 overflow-y-auto ${isMobile ? 'space-y-1 max-h-32' : 'md:space-y-3 md:max-h-64'}`}>
            {updates.slice(0, isMobile ? 4 : updates.length).map((update, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-2 rounded-lg bg-muted/30 dark:bg-muted-dark/30 border border-border/50 dark:border-border-dark/50 ${isMobile ? 'p-1.5 gap-2' : 'md:p-3'}`}
              >
                <div className={`rounded-full bg-green-500 flex-shrink-0 ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}></div>
                <span className={`text-foreground dark:text-foreground-dark ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                  {update}
                </span>
              </motion.div>
            ))}
          </div>

          {!isMobile && (
            <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
              <div className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
                <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Зөвлөгөө:</strong> Профайл тохиргооноос хувийн профайл болон бусад тохиргоог өөрчлөх боломжтой.
                </p>
              </div>
              
              <div className="p-3 md:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
                <p className="text-xs md:text-sm text-purple-800 dark:text-purple-200">
                  🧪 <strong>Beta тестэр:</strong> Алдаа олсон эсвэл санал байвал бидэнд мэдэгдээрэй. Таны санал хүсэлт бидэнд чухал!
                </p>
              </div>
            </div>
          )}
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`bg-background dark:bg-background-dark rounded-xl shadow-2xl w-full overflow-hidden border border-border dark:border-border-dark ${
            isMobile 
              ? 'max-w-sm max-h-[80vh] mx-2' 
              : 'max-w-2xl max-h-[90vh] md:rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30 ${isMobile ? 'p-3' : 'md:p-6'}`}>
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className={`rounded-full bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-6 h-6' : 'w-6 h-6 md:w-8 md:h-8'}`}>
                <span className={`${isMobile ? 'text-sm' : 'text-sm md:text-lg'}`}>👋</span>
              </div>
              <h3 className={`font-semibold text-foreground dark:text-foreground-dark truncate ${isMobile ? 'text-sm' : 'text-base md:text-lg'}`}>
                {slides[currentSlide].title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors flex-shrink-0 touch-target ${isMobile ? 'p-1.5' : ''}`}
              title="Хаах"
            >
              <X className={`text-secondary dark:text-secondary-dark ${isMobile ? 'w-4 h-4' : 'w-4 h-4 md:w-5 md:h-5'}`} />
            </button>
          </div>

          {/* Content */}
          <div 
            className={`p-4 overflow-y-auto ${isMobile ? 'p-3 min-h-[250px]' : 'md:p-6 min-h-[400px]'}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
            
            {/* Mobile swipe hint */}
            {isMobile && (
              <div className="mt-3 text-center">
                <p className="text-xs text-secondary dark:text-secondary-dark opacity-70">
                  👆 Шилжихийн тулд хуруугаараа шударна уу
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={`flex items-center justify-between p-4 border-t border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30 ${isMobile ? 'flex-col gap-3 p-3' : 'md:p-6'}`}>
            {/* Progress Indicators - Much smaller or hidden on mobile */}
            <div className={`flex items-center gap-1 ${isMobile ? 'order-1' : ''}`}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`rounded-full transition-colors touch-target ${
                    isMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'
                  } ${
                    index === currentSlide
                      ? 'bg-primary dark:bg-primary-dark'
                      : 'bg-muted dark:bg-muted-dark'
                  }`}
                  title={`Slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className={`flex items-center gap-2 ${isMobile ? 'order-2 w-full justify-between' : 'md:gap-3'}`}>
              {currentSlide > 0 && (
                <button
                  onClick={prevSlide}
                  className={`${
                    isMobile 
                      ? 'flex items-center justify-center w-10 h-10 rounded-full bg-muted dark:bg-muted-dark' 
                      : 'px-4 py-2 rounded-lg border border-border dark:border-border-dark'
                  } hover:bg-muted dark:hover:bg-muted-dark transition-colors touch-target`}
                  title="Өмнөх"
                >
                  {isMobile ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <span className="text-sm">Өмнөх</span>
                  )}
                </button>
              )}
              
              {currentSlide < slides.length - 1 ? (
                <button
                  onClick={nextSlide}
                  className={`${
                    isMobile 
                      ? 'flex items-center justify-center w-10 h-10 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-black' 
                      : 'px-4 py-2 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-lg'
                  } hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors touch-target ${
                    currentSlide === 0 && isMobile ? 'ml-auto' : ''
                  }`}
                  title="Дараах"
                >
                  {isMobile ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <span className="text-sm">Дараах</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className={`${
                    isMobile 
                      ? 'flex items-center justify-center px-6 py-2.5 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-full font-medium' 
                      : 'px-6 py-2 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-lg font-medium'
                  } hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors touch-target ${
                    currentSlide === slides.length - 1 && isMobile ? 'ml-auto' : ''
                  }`}
                >
                  <span className="text-sm">Эхлэх</span>
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
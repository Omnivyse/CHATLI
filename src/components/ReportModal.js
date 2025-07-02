import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Bug, MessageSquare, User, Image, Video, Send, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const ReportModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    {
      id: 'inappropriate_content',
      icon: Flag,
      title: 'Зохисгүй контент',
      description: 'Хүүхдэд тохиромжгүй, хүчирхийлэл, бэлгийн контент'
    },
    {
      id: 'harassment',
      icon: User,
      title: 'Зүй зохисгүй харицаа',
      description: 'Гутран доромжлох, заналхийлэх'
    },
    {
      id: 'spam',
      icon: MessageSquare,
      title: 'Спам',
      description: 'Дахин дахин мессеж илгээх, реклам хийх'
    },
    {
      id: 'fake_profile',
      icon: User,
      title: 'Хуурамч профайл',
      description: 'Бусдын нэрээр профайл үүсгэх, хуурах'
    },
    {
      id: 'copyright',
      icon: Image,
      title: 'Зохиогчийн эрх зөрчих',
      description: 'Бусдын зураг, видео, контент зөвшөөрөлгүйгээр ашиглах'
    },
    {
      id: 'technical_issue',
      icon: Bug,
      title: 'Техникийн алдаа',
      description: 'Программын алдаа, буруу ажиллагаа'
    },
    {
      id: 'other',
      icon: AlertTriangle,
      title: 'Бусад',
      description: 'Дээрх ангиллаас өөр асуудал'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const reportData = {
        category: selectedCategory,
        description: description.trim(),
        userEmail: userEmail.trim()
      };

      const response = await api.submitReport(reportData);
      
      if (response.success) {
        setIsSubmitting(false);
        setSubmitted(true);
        
        // Reset form after success
        setTimeout(() => {
          setSelectedCategory('');
          setDescription('');
          setUserEmail('');
          setSubmitted(false);
          onClose();
        }, 3000);
      } else {
        throw new Error(response.message || 'Мэдээлэл илгээхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      setIsSubmitting(false);
      alert(error.message || 'Мэдээлэл илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const resetForm = () => {
    setSelectedCategory('');
    setDescription('');
    setUserEmail('');
    setSubmitted(false);
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
              <div className="w-8 h-8 rounded-full bg-red-600/20 dark:bg-red-400/20 flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-foreground-dark">
                Асуудал мэдээлэх
              </h3>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark transition-colors"
            >
              <X className="w-5 h-5 text-secondary dark:text-secondary-dark" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
                  Амжилттай илгээгдлээ!
                </h4>
                <p className="text-secondary dark:text-secondary-dark">
                  Таны мэдээллийг хүлээн авлаа. Бид удахгүй хариулах болно.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Introduction */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Та асуудал эсвэл зөрчил илрүүлсэн бол бидэнд мэдэгдээрэй. 
                    Бид таны мэдээллийг нийтийн аюулгүй байдлыг хангах зорилгоор ашиглах болно.
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-3">
                    Асуудлын төрөл сонгоно уу: *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <motion.button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedCategory === category.id
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-border dark:border-border-dark hover:border-red-300 dark:hover:border-red-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            selectedCategory === category.id
                              ? 'bg-red-500/20'
                              : 'bg-muted dark:bg-muted-dark'
                          }`}>
                            <category.icon className={`w-4 h-4 ${
                              selectedCategory === category.id
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-secondary dark:text-secondary-dark'
                            }`} />
                          </div>
                          <div>
                            <h4 className={`font-medium text-sm ${
                              selectedCategory === category.id
                                ? 'text-red-800 dark:text-red-200'
                                : 'text-foreground dark:text-foreground-dark'
                            }`}>
                              {category.title}
                            </h4>
                            <p className={`text-xs mt-1 ${
                              selectedCategory === category.id
                                ? 'text-red-600 dark:text-red-300'
                                : 'text-secondary dark:text-secondary-dark'
                            }`}>
                              {category.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                    Дэлгэрэнгүй тайлбар: *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Асуудлын талаар дэлгэрэнгүй бичнэ үү..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    required
                  />
                  <p className="text-xs text-secondary dark:text-secondary-dark mt-1">
                    Хамгийн багадаа 10 тэмдэгт оруулна уу
                  </p>
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                    Имэйл хаяг (заавал биш)
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-secondary dark:text-secondary-dark mt-1">
                    Хариу хүлээж байвал имэйл хаягаа оруулна уу
                  </p>
                </div>

                {/* Important Notice */}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Анхааруулга:</strong> Худал мэдээлэл өгөх нь таны бүртгэлд сөргөөр нөлөөлж болно. 
                    Зөвхөн бодит асуудлыг мэдээлнэ үү.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="flex-1 py-2 px-4 bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark rounded-lg hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-colors"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedCategory || description.trim().length < 10 || isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Илгээж байна...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Мэдээлэх
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportModal; 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copyright, Scale, FileText, AlertTriangle, Shield, Gavel } from 'lucide-react';

const CopyrightModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      icon: Copyright,
      title: '1. Зохиогчийн эрх',
      content: [
        'CHATLI Platform болон бүх контент нь зохиогчийн эрхийн хамгаалалтанд байна.',
        '© 2024 CHATLI Platform. Бүх эрх хуулиар хамгаалагдсан.',
        'Платформын код, дизайн, лого зэрэг бүх элемент нь манай өмч юм.'
      ]
    },
    {
      icon: FileText,
      title: '2. Хэрэглэгчийн гэрээ',
      content: [
        'Энэ платформыг ашигласнаар та дараах нөхцөлийг хүлээн зөвшөөрч байна.',
        'Хууль бус үйлдэл хийхийг хориглоно.',
        'Бусдын эрхийг хүндэтгэж, зөрчихгүй байх үүрэгтэй.'
      ]
    },
    {
      icon: Scale,
      title: '3. Хэрэглэгчийн контент',
      content: [
        'Таны бичсэн мессеж, пост, зураг зэрэг контентийн эрх танд хамаарна.',
        'Та контентоо платформд нийтлэх эрхийг бидэнд өгч байна.',
        'Хууль бус контент байршуулахыг хориглоно.'
      ]
    },
    {
      icon: Shield,
      title: '4. Үйлчилгээний нөхцөл',
      content: [
        'Үйлчилгээг "байгаа байдлаараа" үзүүлж байна.',
        'Техникийн алдаа, түр зогсолтод бид хариуцлага хүлээхгүй.',
        'Платформыг сайжруулах, өөрчлөх эрхтэй.'
      ]
    },
    {
      icon: AlertTriangle,
      title: '5. Хязгаарлалт',
      content: [
        'Доорх үйлдлийг хийхийг хориглоно:',
        '• Бусдын эрхийг зөрчих контент байршуулах',
        '• Спам, реклам, хууль бус материал түгээх',
        '• Системд халдлага хийх, автомат хэрэгсэл ашиглах'
      ]
    },
    {
      icon: Gavel,
      title: '6. Хууль эрх зүй',
      content: [
        'Энэ гэрээг Монгол улсын хуулиар зохицуулна.',
        'Маргаан гарвал Улаанбаатар хотын шүүхээр шийдвэрлэнэ.',
        'Гэрээний хэсэг хүчингүй болвол бусад хэсэг хүчинтэй хэвээр байна.'
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-background dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border dark:border-border-dark"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600/20 dark:bg-green-400/20 flex items-center justify-center">
                <Copyright className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-foreground-dark">
                Зохиогчийн эрх ба үйлчилгээний нөхцөл
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
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Introduction */}
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/30">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                CHATLI Platform зохиогчийн эрх ба үйлчилгээний нөхцөл
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Энэ баримт бичиг нь CHATLI Platform-ын зохиогчийн эрх, үйлчилгээний нөхцөл, 
                хэрэглэгчийн эрх үүргийг тодорхойлсон. Платформыг ашигласнаар та эдгээр нөхцөлийг хүлээн зөвшөөрч байна.
              </p>
              <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                <strong>Хүчинтэй огноо:</strong> 2024 оны 12 сар | <strong>Хувилбар:</strong> 1.0 BETA
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border border-border/50 dark:border-border-dark/50 bg-muted/20 dark:bg-muted-dark/20"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-full bg-green-600/20 dark:bg-green-400/20">
                      <section.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h5 className="font-semibold text-foreground dark:text-foreground-dark">
                      {section.title}
                    </h5>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-secondary dark:text-secondary-dark flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mt-2 flex-shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Important Notice */}
            <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200/50 dark:border-red-700/30">
              <h5 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Чухал анхааруулга
              </h5>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                Зөрчил илэрвэл таны бүртгэлийг түр болон бүрмөсөн хязгаарлах эрхтэй. 
                Хэрэв танд энэ нөхцөлтэй санал нийлэхгүй бол платформыг ашиглахгүй байхыг зөвлөж байна.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
              <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Хууль эрх зүйн асуулт
              </h5>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                Зохиогчийн эрх, үйлчилгээний нөхцөлтэй холбоотой асуулт байвал:
              </p>
              <div className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                <p><strong>Имэйл:</strong> bilguunz045@gmail.com</p>
                <p><strong>Хаяг:</strong> Улаанбаатар хот, Монгол улс</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
            <div className="text-xs text-secondary dark:text-secondary-dark">
              © 2024 CHATLI Platform. Бүх эрх хуулиар хамгаалагдсан.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-primary dark:bg-primary-dark text-primary-dark dark:text-foreground-dark rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors font-medium"
            >
              Хүлээн зөвшөөрөх
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CopyrightModal; 
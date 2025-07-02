import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Eye, Database, Cookie, Users, Lock } from 'lucide-react';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      icon: Shield,
      title: '1. Мэдээлэл цуглуулах',
      content: [
        'Бид таны нэр, имэйл хаяг, профайлын зураг зэрэг хувийн мэдээллийг цуглуулдаг.',
        'Таны үйлдэл, мессеж, пост зэрэг контентийг хадгалдаг.',
        'Техникийн мэдээлэл: IP хаяг, төхөөрөмжийн мэдээлэл, хөтчийн мэдээлэл.'
      ]
    },
    {
      icon: Eye,
      title: '2. Мэдээлэл ашиглах',
      content: [
        'Платформын үйлчилгээг үзүүлэх, сайжруулах зорилгоор ашигладаг.',
        'Хэрэглэгчдийн хоорондын холбоо тогтоох, мессеж солилцоход туслах.',
        'Аюулгүй байдлыг хангах, зөрчил илрүүлэх зорилгоор.'
      ]
    },
    {
      icon: Database,
      title: '3. Мэдээлэл хадгалах',
      content: [
        'Таны мэдээллийг аюулгүй серверт хадгалдаг.',
        'Зөвхөн шаардлагатай ажилтнууд хандах эрхтэй.',
        'Мэдээллийг шифрлэж, хамгаалалттай хадгалдаг.'
      ]
    },
    {
      icon: Users,
      title: '4. Мэдээлэл хуваалцах',
      content: [
        'Бид таны хувийн мэдээллийг гуравдагч талд зарахгүй.',
        'Хуулийн шаардлагаар зөвхөн шаардлагатай тохиолдолд өгч болно.',
        'Техникийн үйлчилгээ үзүүлэгчидтэй хязгаарлагдмал хэмжээгээр хуваалцдаг.'
      ]
    },
    {
      icon: Cookie,
      title: '5. Күүки болон технологи',
      content: [
        'Вэб хуудсанд күүки ашиглан таны тохиргоог хадгалдаг.',
        'Аналитик мэдээлэл цуглуулахад ашигладаг.',
        'Та күүкиг цэвэрлэх, идэвхгүй болгох боломжтой.'
      ]
    },
    {
      icon: Lock,
      title: '6. Таны эрх',
      content: [
        'Өөрийн мэдээллийг харах, засах, устгах эрхтэй.',
        'Мэдээлэл боловсруулахыг зогсоохыг хүсэх эрхтэй.',
        'Бүртгэлээ бүрмөсөн устгах боломжтой.'
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
              <div className="w-8 h-8 rounded-full bg-blue-600/20 dark:bg-blue-400/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-foreground-dark">
                Нууцлалын бодлого
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
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                CHATLI Platform-ын нууцлалын бодлого
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Энэхүү нууцлалын бодлого нь CHATLI Platform дээр таны хувийн мэдээллийг хэрхэн цуглуулж, 
                ашиглаж, хамгаалж байгааг тайлбарладаг. Бидний үйлчилгээг ашигласнаар та энэ бодлогыг хүлээн зөвшөөрсөнд тооцогдоно.
              </p>
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
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
                    <div className="p-2 rounded-full bg-primary/20 dark:bg-primary-dark/20">
                      <section.icon className="w-4 h-4 text-primary dark:text-primary-dark" />
                    </div>
                    <h5 className="font-semibold text-foreground dark:text-foreground-dark">
                      {section.title}
                    </h5>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-secondary dark:text-secondary-dark flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary-dark mt-2 flex-shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
              <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Холбоо барих
              </h5>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                Нууцлалын бодлоготой холбоотой асуулт байвал бидэнтэй холбогдоно уу:
              </p>
              <div className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                <p><strong>Имэйл:</strong> bilguunz045@gmail.com</p>
                <p><strong>Хаяг:</strong> Улаанбаатар хот, Монгол улс</p>
              </div>
            </div>

            {/* Update Notice */}
            <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Анхааруулга:</strong> Энэ бодлогыг цаг үеийн шаардлагад нийцүүлэн өөрчлөх боломжтой. 
                Томоохон өөрчлөлт гарвал таныг мэдэгдэх болно.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border dark:border-border-dark bg-muted/30 dark:bg-muted-dark/30">
            <div className="text-xs text-secondary dark:text-secondary-dark">
              Сүүлд шинэчлэгдсэн: 2024.12.15
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-primary dark:bg-primary-dark text-primary-dark dark:text-foreground-dark rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors font-medium"
            >
              Ойлгосон
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PrivacyPolicyModal; 
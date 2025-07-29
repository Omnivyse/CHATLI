import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const HelpCenterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [expandedItems, setExpandedItems] = useState({});

  const helpSections = [
    {
      title: 'Ерөнхий асуултууд',
      icon: 'help-circle-outline',
      items: [
        {
          question: 'CHATLI гэж юу вэ?',
          answer: 'CHATLI нь Монголын анхны чат апп бөгөөд танд найдвартай, хурдан мессеж илгээх боломжийг олгодог. Та найзуудтайгаа чат хийх, зураг, видео хуваалцах, дуу дуудах зэрэг олон боломжтой.'
        },
        {
          question: 'Хэрхэн бүртгэл үүсгэх вэ?',
          answer: '1. Апп-аа нээх\n2. "Бүртгүүлэх" товчийг дарх\n3. Нэр, имэйл, нууц үг оруулах\n4. "Бүртгүүлэх" товчийг дарх\n5. Имэйл хаягаа баталгаажуулах'
        },
        {
          question: 'Нууц үгээ мартсан бол яах вэ?',
          answer: 'Нууц үгээ мартсан бол нэвтрэх хуудас дээр "Нууц үг мартсан?" товчийг дарж, имэйл хаягаа оруулна уу. Таны имэйл хаяг руу нууц үг сэргээх холбоос илгээгдэнэ.'
        },
        {
          question: 'Хэрхэн найз нэмэх вэ?',
          answer: '1. Хайх хэсэгт очох\n2. Хайх хэрэглэгчийн нэр эсвэл имэйл оруулах\n3. Хайлтын үр дүнгээс хэрэглэгчийг олох\n4. "Дагах" товчийг дарх\n5. Хэрэглэгч таны дагах хүсэлтийг зөвшөөрөх'
        }
      ]
    },
    {
      title: 'Чат болон мессеж',
      icon: 'chatbubbles-outline',
      items: [
        {
          question: 'Хэрхэн чат эхлэх вэ?',
          answer: '1. Хэрэглэгчийн профайл руу очох\n2. "Мессеж илгээх" товчийг дарх\n3. Мессежээ бичих\n4. "Илгээх" товчийг дарх'
        },
        {
          question: 'Зураг, видео хэрхэн илгээх вэ?',
          answer: '1. Чат хуудас дээр "+" товчийг дарх\n2. "Зураг" эсвэл "Видео" сонгох\n3. Файлаа сонгох\n4. "Илгээх" товчийг дарх'
        },
        {
          question: 'Мессежийг хэрхэн устгах вэ?',
          answer: 'Мессеж дээр удаан дарж, "Устгах" сонголтыг сонгоно уу. Зөвхөн өөрийн илгээсэн мессежийг устгах боломжтой.'
        },
        {
          question: 'Чатийг хэрхэн устгах вэ?',
          answer: 'Чат жагсаалтаас чат дээр удаан дарж, "Устгах" сонголтыг сонгоно уу. Энэ нь зөвхөн таны харагдах байдлаас устгана.'
        }
      ]
    },
    {
      title: 'Профайл болон тохиргоо',
      icon: 'person-outline',
      items: [
        {
          question: 'Профайл зураг хэрхэн солих вэ?',
          answer: '1. Профайл хуудас руу очох\n2. Профайл зураг дээр дарх\n3. "Зураг сонгох" товчийг дарх\n4. Шинэ зураг сонгох\n5. "Хадгалах" товчийг дарх'
        },
        {
          question: 'Харанхуй горим хэрхэн идэвхжүүлэх вэ?',
          answer: '1. Тохиргоо хуудас руу очох\n2. "Харанхуй горим" хэсгийг олох\n3. Товчлуурыг идэвхжүүлэх'
        },
        {
          question: 'Мэдэгдлийг хэрхэн удирдах вэ?',
          answer: '1. Тохиргоо хуудас руу очох\n2. "Мэдэгдэл" хэсгийг олох\n3. Хүссэн тохиргоог сонгох\n4. "Хадгалах" товчийг дарх'
        },
        {
          question: 'Нууц үг хэрхэн солих вэ?',
          answer: '1. Тохиргоо хуудас руу очох\n2. "Нууцлал ба аюулгүй байдал" хэсгийг олох\n3. "Нууц үг солих" дээр дарх\n4. Одоогийн болон шинэ нууц үг оруулах'
        }
      ]
    },
    {
      title: 'Техникийн асуудлууд',
      icon: 'construct-outline',
      items: [
        {
          question: 'Апп удаан ажиллаж байна',
          answer: '1. Интернэт холболтоо шалгах\n2. Апп-аа дахин эхлүүлэх\n3. Утсыг дахин эхлүүлэх\n4. Апп-ын кэшийг цэвэрлэх\n5. Апп-аа шинэчлэх'
        },
        {
          question: 'Мессеж илгээхэд алдаа гарч байна',
          answer: '1. Интернэт холболтоо шалгах\n2. Хүлээн авагчийн нэр зөв эсэхийг шалгах\n3. Хүлээн авагч таныг блоклосон эсэхийг шалгах\n4. Апп-аа дахин эхлүүлэх'
        },
        {
          question: 'Зураг, видео татагдахгүй байна',
          answer: '1. Интернэт холболтоо шалгах\n2. Утасны санах ойн зай шалгах\n3. Апп-ын зөвшөөрөл шалгах\n4. Тохиргоо дээр "Автомат татах" идэвхтэй эсэхийг шалгах'
        },
        {
          question: 'Апп-аа шинэчлэх хэрэгтэй юу?',
          answer: 'Тийм, апп-аа тогтмол шинэчлэх нь чухал. Шинэ хувилбар нь аюулгүй байдлын засвар, шинэ онцлогууд, алдаа засваруудыг агуулдаг.'
        }
      ]
    },
    {
      title: 'Аюулгүй байдал',
      icon: 'shield-outline',
      items: [
        {
          question: 'Миний мэдээлэл аюулгүй юу?',
          answer: 'Тийм, CHATLI нь таны хувийн мэдээллийг хамгаалахыг эрхэмлэдэг. Бид end-to-end шифрлэлт ашиглаж, таны мессежийг хамгаалдаг.'
        },
        {
          question: 'Хэрэглэгчийг хэрхэн блоклох вэ?',
          answer: '1. Хэрэглэгчийн профайл руу очох\n2. "..." товчийг дарх\n3. "Блоклох" сонголтыг сонгох\n4. "Блоклох" товчийг дарх'
        },
        {
          question: 'Мессежийг хэрхэн нууцлах вэ?',
          answer: 'Одоогоор мессеж нууцлах боломж байхгүй байна. Гэхдээ бид энэ онцлогийг удахгүй нэмэхээр ажиллаж байна.'
        },
        {
          question: 'Акаунтаа хэрхэн устгах вэ?',
          answer: '1. Тохиргоо хуудас руу очох\n2. "Акаунт устгах" хэсгийг олох\n3. Нууц үгээ оруулах\n4. "Акаунт устгах" товчийг дарх'
        }
      ]
    }
  ];

  const toggleItem = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderHelpItem = (item, sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    const isExpanded = expandedItems[key];

    return (
      <View key={itemIndex} style={styles.helpItem}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleItem(sectionIndex, itemIndex)}
        >
          <Text style={[styles.question, { color: colors.text }]}>
            {item.question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>
              {item.answer}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHelpSection = (section, sectionIndex) => {
    return (
      <View key={sectionIndex} style={styles.helpSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name={section.icon} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {section.title}
          </Text>
        </View>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {section.items.map((item, itemIndex) => 
            renderHelpItem(item, sectionIndex, itemIndex)
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Тусламж төв</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
          <View style={[styles.welcomeIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="help-circle" size={32} color="#ffffff" />
          </View>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Тусламж төвд тавтай морил
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            CHATLI-тай холбоотой асуултуудаа эндээс олж болно
          </Text>
        </View>

        {/* Help Sections */}
        {helpSections.map((section, index) => renderHelpSection(section, index))}

        {/* Contact Section */}
        <View style={[styles.contactSection, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Нэмэлт тусламж хэрэгтэй юу?
            </Text>
          </View>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            Дээрх асуултуудаас хариулт олж чадаагүй бол бидэнтэй холбогдоно уу
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Alert.alert(
                'Холбогдох',
                'Санал хүсэлт, асуудлаа доорх хаягаар илгээнэ үү:\n\nsupport@chatli.mn',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="mail" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>Имэйл илгээх</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HelpCenterScreen; 
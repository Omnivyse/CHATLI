import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeColors } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

const SecretPostPasswordModal = ({ visible, onClose, onPasswordSubmit, postAuthor, showDescription }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPassword('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (password.length !== 4) {
      Alert.alert(getTranslation('error', language), getTranslation('passwordMustBe4Digits', language));
      return;
    }

    if (!/^\d{4}$/.test(password)) {
      Alert.alert(getTranslation('error', language), getTranslation('passwordMustBeDigits', language));
      return;
    }

    setIsSubmitting(true);
    try {
      await onPasswordSubmit(password);
      setPassword('');
    } catch (error) {
      Alert.alert(getTranslation('error', language), error.message || getTranslation('passwordVerificationFailed', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPassword('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{getTranslation('secretPost', language)}</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="lock-closed" size={48} color={colors.primary} />
              </View>
            </View>
            
            {showDescription && (
              <>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {getTranslation('secretPostDescription', language)}
                </Text>
                
                {postAuthor && (
                  <Text style={[styles.author, { color: colors.textSecondary }]}>
                    {getTranslation('postedBy', language)} {postAuthor}
                  </Text>
                )}
              </>
            )}

            <View style={styles.passwordContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {getTranslation('enterPassword', language)}:
              </Text>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="0000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={false}
                autoFocus={true}
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || password.length !== 4}
            >
              <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>
                {isSubmitting ? getTranslation('verifying', language) : getTranslation('viewPost', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  passwordContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  passwordInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  submitButton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SecretPostPasswordModal; 
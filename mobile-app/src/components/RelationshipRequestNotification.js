import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeColors } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

const RelationshipRequestNotification = ({
  requester,
  onAccept,
  onReject,
  onPress,
  loading = false,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = getThemeColors(theme);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.avatarContainer} onPress={onPress} activeOpacity={0.8}>
          {requester.avatar ? (
            <Image source={{ uri: requester.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="heart" size={24} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {requester.name || requester.username}
          </Text>
          <Text
            style={[styles.message, { color: colors.textSecondary }]}
            numberOfLines={3}
          >
            {getTranslation('relationshipRequestMessage', language)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={onAccept}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
            {getTranslation('accept', language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.error }]}
          onPress={onReject}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
            {getTranslation('decline', language)}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarContainer: { marginRight: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    marginLeft: 64,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {},
  rejectButton: {},
  actionButtonText: { fontSize: 14, fontWeight: '700' },
});

export default RelationshipRequestNotification;

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const FollowRequestNotification = ({ 
  requester, 
  onAccept, 
  onReject, 
  onPress,
  loading = false 
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {requester.avatar ? (
            <Image source={{ uri: requester.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {requester.name}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            sent you a follow request
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={onAccept}
            disabled={loading}
          >
            <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
              Зөвшөөрөх
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.error }]}
            onPress={onReject}
            disabled={loading}
          >
            <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
              Цуцлах
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  acceptButton: {
    // Primary color
  },
  rejectButton: {
    // Error color
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FollowRequestNotification; 
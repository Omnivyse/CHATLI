import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const SpotifyTrack = ({ track, onPress }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [isPlaying, setIsPlaying] = useState(false);

  // Validate track data - don't render if incomplete
  if (!track || 
      typeof track !== 'object' || 
      !track.name || 
      !track.artist || 
      !track.albumArt) {
    return null;
  }

  const handlePlayPreview = () => {
    if (track.previewUrl) {
      setIsPlaying(true);
      // Here you would implement audio playback
      // For now, we'll just show an alert
      Alert.alert(
        'Preview Available',
        `Playing preview of "${track.name}" by ${track.artist}`,
        [
          {
            text: 'Open in Spotify',
            onPress: () => openInSpotify(),
          },
          {
            text: 'OK',
            onPress: () => setIsPlaying(false),
          },
        ]
      );
    } else {
      openInSpotify();
    }
  };

  const openInSpotify = () => {
    if (track.externalUrl) {
      Linking.openURL(track.externalUrl).catch((err) => {
        console.error('Error opening Spotify:', err);
        Alert.alert('Error', 'Could not open Spotify');
      });
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(track);
    } else {
      handlePlayPreview();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Album Art */}
      <Image
        source={{ uri: track.albumArt }}
        style={styles.albumArt}
        resizeMode="cover"
      />
      
      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {track.artist}
        </Text>
        <Text style={[styles.trackAlbum, { color: colors.textTertiary }]} numberOfLines={1}>
          {track.album}
        </Text>
      </View>
      
      {/* Play Button */}
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={handlePlayPreview}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={16} 
          color={colors.textInverse} 
        />
      </TouchableOpacity>
      
      {/* Spotify Logo */}
      <View style={styles.spotifyLogo}>
        <Ionicons name="musical-notes" size={16} color="#1DB954" />
      </View>
      
      {/* Duration */}
      <Text style={[styles.duration, { color: colors.textSecondary }]}>
        {track.formattedDuration || '0:00'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  spotifyLogo: {
    marginRight: 8,
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SpotifyTrack;

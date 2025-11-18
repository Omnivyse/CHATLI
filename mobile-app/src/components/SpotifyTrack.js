import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const SpotifyTrack = ({ track, onPress, autoPlayPreview = false }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const previewSoundRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const autoPlayRef = useRef(false);

  // Validate track data - don't render if incomplete
  if (!track || 
      typeof track !== 'object' || 
      !track.name || 
      !track.artist || 
      !track.albumArt) {
    return null;
  }

  useEffect(() => {
    autoPlayRef.current = autoPlayPreview;
  }, [autoPlayPreview]);

  useEffect(() => {
    const autoPreview = async () => {
      if (autoPlayPreview && track?.previewUrl) {
        await startPreview();
      } else {
        await stopPreview();
      }
    };
    autoPreview();
    return () => {
      stopPreview();
    };
  }, [track?.id]);

  const startPreview = async () => {
    try {
      if (!track.previewUrl) {
        openInSpotify();
        return;
      }
      await stopPreview();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true, volume: 1 }
      );
      previewSoundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish || status.positionMillis >= 15000) {
          await stopPreview();
        }
      });

      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      previewTimeoutRef.current = setTimeout(async () => {
        await stopPreview();
      }, 15000);
    } catch (error) {
      console.error('Preview playback error:', error);
      openInSpotify();
    }
  };

  const stopPreview = async () => {
    try {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewSoundRef.current) {
        await previewSoundRef.current.stopAsync();
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping preview:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlayPreview = async () => {
    if (!track.previewUrl) {
      openInSpotify();
      return;
    }
    if (isPlaying) {
      await stopPreview();
    } else {
      await startPreview();
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
        <Text style={[styles.playButtonLabel, { color: colors.textInverse }]}>
          {isPlaying ? 'Stop' : 'Listen'}
        </Text>
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
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playButtonLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
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

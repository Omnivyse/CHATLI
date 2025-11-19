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

// Helper function to format duration from milliseconds
const formatDuration = (durationMs) => {
  if (!durationMs || durationMs === 0) return '0:00';
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const SpotifyTrack = ({ track, onPress, autoPlayPreview = false }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayDuration, setDisplayDuration] = useState('0:00');
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

  // Format and set duration on mount and when track changes
  useEffect(() => {
    const calculateDuration = async () => {
      // Debug: Log all track data first
      if (__DEV__) {
        console.log('🎵 SpotifyTrack FULL track data:', JSON.stringify(track, null, 2));
        console.log('🎵 SpotifyTrack keys:', Object.keys(track));
      }
      
      // First try formattedDuration (check multiple variations)
      // But ignore "0:00" as that means duration wasn't available
      const formattedDur = track.formattedDuration || track.formatted_duration || track.durationFormatted;
      if (formattedDur && formattedDur !== '0:00' && formattedDur !== '--:--' && formattedDur.trim() !== '') {
        setDisplayDuration(formattedDur);
        if (__DEV__) console.log('✅ Using formattedDuration:', formattedDur);
        return;
      }
      
      // Try duration in milliseconds (check all possible field names)
      let durationMs = track.duration || 
                      track.durationMs || 
                      track.duration_ms || 
                      track.durationMillis ||
                      track.trackTimeMillis || // iTunes format
                      0;
      
      // Convert string to number if needed
      if (typeof durationMs === 'string') {
        durationMs = parseInt(durationMs, 10) || 0;
      }
      
      // Also check if it's stored as a number string in nested objects
      if (!durationMs || durationMs === 0) {
        // Check nested objects
        if (track.spotifyTrack && track.spotifyTrack.duration) {
          durationMs = track.spotifyTrack.duration;
        }
      }
      
      // Only use duration if it's greater than 0
      if (durationMs && durationMs > 0) {
        const formatted = formatDuration(durationMs);
        setDisplayDuration(formatted);
        if (__DEV__) console.log('✅ Formatted duration from ms:', formatted, 'from', durationMs);
        return;
      }
      
      // If duration is 0 or formattedDuration is "0:00", treat as missing
      if (__DEV__) {
        console.log('⚠️ Duration is 0 or formattedDuration is "0:00", treating as missing');
      }
      
      // If we have a trackId but no duration (or duration is 0), try to fetch it
      const trackId = track.trackId || track.track_id || track.id;
      if (trackId && (!durationMs || durationMs === 0)) {
        // Try to get duration from Spotify API if trackId is a Spotify ID
        const isSpotifyId = trackId.startsWith('spotify:') || 
                           (!trackId.startsWith('itunes_') && !trackId.includes('itunes'));
        
        if (isSpotifyId) {
          try {
            const spotifyService = require('../services/spotifyService').default;
            if (spotifyService && trackId) {
              // Clean trackId (remove spotify: prefix if present)
              const cleanTrackId = trackId.replace('spotify:track:', '').replace('spotify:', '');
              if (__DEV__) console.log('🔄 Fetching duration for Spotify trackId:', cleanTrackId);
              const response = await spotifyService.getTrack(cleanTrackId);
              if (response.success && response.track && response.track.duration) {
                const formatted = formatDuration(response.track.duration);
                setDisplayDuration(formatted);
                if (__DEV__) console.log('✅ Fetched duration from Spotify API:', formatted);
                return;
              } else {
                if (__DEV__) console.log('⚠️ Spotify API response:', response);
              }
            }
          } catch (error) {
            if (__DEV__) console.log('❌ Could not fetch track duration from Spotify:', error);
          }
        } else if (trackId.startsWith('itunes_')) {
          // For iTunes tracks, we can't easily fetch duration, but we can try to extract from externalUrl
          // or show a reasonable estimate based on typical song length
          if (__DEV__) console.log('⚠️ iTunes track - cannot fetch duration from API');
          // For iTunes tracks without duration, show a placeholder or estimate
          // Most songs are 2-5 minutes, but we'll show "--:--" to indicate unknown
        } else {
          if (__DEV__) console.log('⚠️ Unknown track ID format, skipping API fetch. trackId:', trackId);
        }
      }
      
      // Final fallback - show something reasonable based on what we know
      // For preview tracks, they're usually 30 seconds
      if (track.previewUrl) {
        setDisplayDuration('0:30');
        if (__DEV__) console.log('⚠️ Using default preview duration: 0:30');
      } else {
        // For full tracks without duration, show "--:--" to indicate unknown
        // This is better than showing "0:00" which is misleading
        setDisplayDuration('--:--');
        if (__DEV__) {
          console.log('❌ No duration available for track:', {
            trackId: track.trackId,
            name: track.name,
            hasExternalUrl: !!track.externalUrl,
            isItunes: track.trackId?.startsWith('itunes_')
          });
        }
      }
    };
    
    calculateDuration();
  }, [track]);

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
        // No preview available - don't open external app automatically
        // Just show a message that preview is not available
        if (__DEV__) {
          console.log('⚠️ No preview URL available for track:', track.name);
        }
        Alert.alert(
          'No Preview Available',
          'This track does not have a preview available.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      await stopPreview();
      
      // Don't set audio mode - SpotifyMusicPicker doesn't use it and it works fine
      // This avoids the interruptionModeIOS error
      
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
      // Don't automatically open external app on error
      Alert.alert(
        'Playback Error',
        'Could not play the preview. Please try again.',
        [{ text: 'OK' }]
      );
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
    // Always try to play preview first - don't open external app automatically
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
          size={20} 
          color={colors.textInverse} 
        />
      </TouchableOpacity>
      
      {/* Spotify Logo */}
      <View style={styles.spotifyLogo}>
        <Ionicons name="musical-notes" size={16} color="#1DB954" />
      </View>
      
      {/* Duration - Always show duration */}
      <Text style={[styles.duration, { color: colors.textSecondary }]}>
        {displayDuration}
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
    width: 36,
    height: 36,
    borderRadius: 18,
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

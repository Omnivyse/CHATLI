import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import spotifyService from '../services/spotifyService';

const { width, height } = Dimensions.get('window');

const SpotifyMusicPicker = ({ visible, onClose, onTrackSelect }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { language } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'recent', 'top'
  const [selectedTrack, setSelectedTrack] = useState(null);
  
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      initializeSpotify();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const initializeSpotify = async () => {
    try {
      setIsLoading(true);
      await spotifyService.initialize();
      
      const authenticated = spotifyService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Load recent and top tracks
        loadRecentTracks();
        loadTopTracks();
      }
    } catch (error) {
      console.error('❌ Error initializing Spotify:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyAuth = async () => {
    try {
      setIsLoading(true);
      const result = await spotifyService.authenticate();
      
      if (result.success) {
        setIsAuthenticated(true);
        loadRecentTracks();
        loadTopTracks();
        Alert.alert('Success', 'Spotify connected successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to connect Spotify');
      }
    } catch (error) {
      console.error('❌ Spotify auth error:', error);
      Alert.alert('Error', 'Failed to connect to Spotify');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim() || !isAuthenticated) return;
    
    try {
      setIsSearching(true);
      const result = await spotifyService.searchTracks(searchQuery, 20);
      
      if (result.success) {
        setSearchResults(result.tracks);
      } else {
        setSearchResults([]);
        console.log('No search results:', result.error);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadRecentTracks = async () => {
    try {
      const result = await spotifyService.getRecentlyPlayed(10);
      if (result.success) {
        setRecentTracks(result.tracks);
      }
    } catch (error) {
      console.error('❌ Error loading recent tracks:', error);
    }
  };

  const loadTopTracks = async () => {
    try {
      const result = await spotifyService.getTopTracks(10, 'short_term');
      if (result.success) {
        setTopTracks(result.tracks);
      }
    } catch (error) {
      console.error('❌ Error loading top tracks:', error);
    }
  };

  const handleTrackSelect = (track) => {
    setSelectedTrack(track);
    const trackData = spotifyService.createTrackShareData(track);
    onTrackSelect(trackData);
    onClose();
  };

  const renderTrackItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.trackItem, { backgroundColor: colors.surface }]}
      onPress={() => handleTrackSelect(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.albumArt }}
        style={styles.trackAlbumArt}
        resizeMode="cover"
      />
      
      <View style={styles.trackInfo}>
        <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={[styles.trackAlbum, { color: colors.textTertiary }]} numberOfLines={1}>
          {item.album}
        </Text>
      </View>
      
      <View style={styles.trackMeta}>
        <Text style={[styles.trackDuration, { color: colors.textSecondary }]}>
          {spotifyService.formatDuration(item.duration)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        { backgroundColor: activeTab === tabKey ? colors.primary : colors.surfaceVariant }
      ]}
      onPress={() => setActiveTab(tabKey)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tabKey ? colors.textInverse : colors.text} 
      />
      <Text style={[
        styles.tabButtonText,
        { color: activeTab === tabKey ? colors.textInverse : colors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.authContainer}>
          <Ionicons name="musical-notes" size={64} color={colors.primary} />
          <Text style={[styles.authTitle, { color: colors.text }]}>
            Connect Spotify
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            Share your favorite music with friends
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={handleSpotifyAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="logo-spotify" size={20} color={colors.textInverse} />
                <Text style={[styles.authButtonText, { color: colors.textInverse }]}>
                  Connect Spotify
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Search Tab */}
        {activeTab === 'search' && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search for songs, artists, or albums..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {isSearching && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderTrackItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.trackList}
              />
            ) : searchQuery.trim() && !isSearching ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No tracks found
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Recent Tracks Tab */}
        {activeTab === 'recent' && (
          <View style={styles.recentContainer}>
            {recentTracks.length > 0 ? (
              <FlatList
                data={recentTracks}
                renderItem={renderTrackItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.trackList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No recently played tracks
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Top Tracks Tab */}
        {activeTab === 'top' && (
          <View style={styles.topContainer}>
            {topTracks.length > 0 ? (
              <FlatList
                data={topTracks}
                renderItem={renderTrackItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.trackList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No top tracks available
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Add Music
          </Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        {isAuthenticated && (
          <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {renderTabButton('search', 'Search', 'search')}
            {renderTabButton('recent', 'Recent', 'time')}
            {renderTabButton('top', 'Top', 'trending-up')}
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading...
            </Text>
          </View>
        ) : (
          renderContent()
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  trackList: {
    paddingBottom: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  trackAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
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
  trackMeta: {
    alignItems: 'flex-end',
  },
  trackDuration: {
    fontSize: 12,
    marginBottom: 4,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default SpotifyMusicPicker;

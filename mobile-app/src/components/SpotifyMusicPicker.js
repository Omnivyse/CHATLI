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
import { Audio } from 'expo-av';
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
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('trending'); // 'trending', 'search', 'recent', 'top'
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const previewSoundRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setActiveTab('trending');
      initializeSpotify();
      loadTrendingTracks();
    } else {
      if (previewSoundRef.current) {
        previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
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
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      let result;
      if (isAuthenticated) {
        result = await spotifyService.searchTracks(searchQuery, 20);
      } else {
        result = await spotifyService.searchPublicTracks(searchQuery, 20);
      }
      
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

  useEffect(() => {
    return () => {
      if (previewSoundRef.current) {
        previewSoundRef.current.unloadAsync();
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const playPreview = async (track) => {
    try {
      if (previewSoundRef.current) {
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
      if (!track?.previewUrl) return;
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true, volume: 1 }
      );
      previewSoundRef.current = sound;
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      previewTimeoutRef.current = setTimeout(async () => {
        if (previewSoundRef.current) {
          await previewSoundRef.current.stopAsync();
        }
      }, 15000);
    } catch (error) {
      console.error('Preview playback error:', error);
    }
  };

  const handleTrackSelect = async (track) => {
    if (previewSoundRef.current) {
      await previewSoundRef.current.unloadAsync();
      previewSoundRef.current = null;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setSelectedTrack(track);
    const trackData = spotifyService.createTrackShareData(track);
    onTrackSelect(trackData);
    onClose();
  };

  const renderTrackItem = ({ item, index }) => (
    <View style={[styles.trackItem, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.trackPressArea}
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
      </TouchableOpacity>

      <View style={styles.trackActions}>
        {item.previewUrl && (
          <TouchableOpacity
            onPress={() => playPreview(item)}
            style={styles.listenButton}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.listenButtonText}>Listen</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleTrackSelect(item)}
          style={styles.selectButton}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectButtonText, { color: colors.primary }]}>Use</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const loadTrendingTracks = async () => {
    try {
      setTrendingLoading(true);
      setTrendingError('');
      const result = await spotifyService.getTrendingTracks(25);
      if (result.success && result.tracks) {
        setTrendingTracks(result.tracks);
      } else {
        if (result.tracks) {
          setTrendingTracks(result.tracks);
        }
        setTrendingError(result.error || 'Unable to load trending music.');
      }
    } catch (error) {
      console.error('❌ Error loading trending tracks:', error);
      setTrendingError('Unable to load trending music.');
    } finally {
      setTrendingLoading(false);
    }
  };

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

  const renderTrendingTab = () => {
    if (trendingLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 12 }]}>
            Loading trending music...
          </Text>
        </View>
      );
    }

    if (trendingError && trendingTracks.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="refresh" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            {trendingError}
          </Text>
          <TouchableOpacity style={[styles.authButton, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={loadTrendingTracks}>
            <Text style={[styles.authButtonText, { color: colors.textInverse }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={trendingTracks}
        renderItem={renderTrackItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.trackList}
      />
    );
  };

  const renderSearchTab = () => (
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
  );

  const renderRecentTab = () => (
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
  );

  const renderTopTab = () => (
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
  );

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {!isAuthenticated && (
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Connect Spotify for personal mixes
            </Text>
            <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
              Searching and trending work without login. Connect to see your recent and top songs.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: colors.primary }]}
            onPress={handleSpotifyAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={[styles.infoButtonText, { color: colors.textInverse }]}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'trending' && renderTrendingTab()}
      {activeTab === 'search' && renderSearchTab()}
      {activeTab === 'recent' && isAuthenticated && renderRecentTab()}
      {activeTab === 'top' && isAuthenticated && renderTopTab()}
    </View>
  );

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
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {renderTabButton('trending', 'Trending', 'flame')}
          {renderTabButton('search', 'Search', 'search')}
          {isAuthenticated && renderTabButton('recent', 'Recent', 'time')}
          {isAuthenticated && renderTabButton('top', 'Top', 'trending-up')}
        </View>

        {/* Content */}
        {renderContent()}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textInverse }]}>
              Loading...
            </Text>
          </View>
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
  trackPressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    columnGap: 8,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  listenButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  infoButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
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

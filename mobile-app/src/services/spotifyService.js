import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import SPOTIFY_CONFIG from '../config/spotify';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = SPOTIFY_CONFIG.CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = SPOTIFY_CONFIG.CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = SPOTIFY_CONFIG.REDIRECT_URI;
const SPOTIFY_SCOPES = SPOTIFY_CONFIG.SCOPES.join(' ');

class SpotifyService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load stored tokens
      await this.loadStoredTokens();
      this.isInitialized = true;
      console.log('🎵 Spotify service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Spotify service:', error);
    }
  }

  // Load stored tokens from AsyncStorage
  async loadStoredTokens() {
    try {
      const accessToken = await AsyncStorage.getItem('spotify_access_token');
      const refreshToken = await AsyncStorage.getItem('spotify_refresh_token');
      const tokenExpiry = await AsyncStorage.getItem('spotify_token_expiry');

      if (accessToken && refreshToken && tokenExpiry) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = new Date(tokenExpiry);
        
        // Check if token is expired
        if (this.isTokenExpired()) {
          console.log('🔄 Spotify token expired, refreshing...');
          await this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('❌ Error loading stored Spotify tokens:', error);
    }
  }

  // Store tokens in AsyncStorage
  async storeTokens(accessToken, refreshToken, expiresIn) {
    try {
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      
      await AsyncStorage.setItem('spotify_access_token', accessToken);
      await AsyncStorage.setItem('spotify_refresh_token', refreshToken);
      await AsyncStorage.setItem('spotify_token_expiry', expiryDate.toISOString());
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = expiryDate;
      
      console.log('💾 Spotify tokens stored successfully');
    } catch (error) {
      console.error('❌ Error storing Spotify tokens:', error);
    }
  }

  // Check if token is expired
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  // Authenticate with Spotify
  async authenticate() {
    try {
      console.log('🔐 Starting Spotify authentication...');
      
      // Generate state for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Create auth URL
      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SPOTIFY_SCOPES)}` +
        `&state=${state}` +
        `&show_dialog=true`;

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, SPOTIFY_REDIRECT_URI);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        
        // Verify state
        if (returnedState !== state) {
          throw new Error('State mismatch - possible CSRF attack');
        }
        
        if (code) {
          console.log('✅ Spotify authentication successful');
          await this.exchangeCodeForTokens(code);
          return { success: true };
        }
      }
      
      return { success: false, error: 'Authentication cancelled or failed' };
    } catch (error) {
      console.error('❌ Spotify authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        await this.storeTokens(data.access_token, data.refresh_token, data.expires_in);
        return { success: true };
      } else {
        throw new Error(data.error_description || 'Failed to exchange code for tokens');
      }
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        await this.storeTokens(data.access_token, this.refreshToken, data.expires_in);
        return { success: true };
      } else {
        throw new Error(data.error_description || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('❌ Error refreshing Spotify token:', error);
      // Clear tokens on refresh failure
      await this.clearTokens();
      throw error;
    }
  }

  // Ensure valid token
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    
    return this.accessToken;
  }

  // Search for tracks
  async searchTracks(query, limit = 20) {
    try {
      const token = await this.ensureValidToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.tracks) {
        return {
          success: true,
          tracks: data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            externalUrl: track.external_urls.spotify,
            duration: track.duration_ms,
            popularity: track.popularity
          }))
        };
      } else {
        throw new Error('No tracks found');
      }
    } catch (error) {
      console.error('❌ Error searching tracks:', error);
      return { success: false, error: error.message };
    }
  }

  // Get track details
  async getTrack(trackId) {
    try {
      const token = await this.ensureValidToken();
      
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const track = await response.json();
      
      if (track.id) {
        return {
          success: true,
          track: {
            id: track.id,
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            externalUrl: track.external_urls.spotify,
            duration: track.duration_ms,
            popularity: track.popularity
          }
        };
      } else {
        throw new Error('Track not found');
      }
    } catch (error) {
      console.error('❌ Error getting track:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's recently played tracks
  async getRecentlyPlayed(limit = 20) {
    try {
      const token = await this.ensureValidToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.items) {
        return {
          success: true,
          tracks: data.items.map(item => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists.map(artist => artist.name).join(', '),
            album: item.track.album.name,
            albumArt: item.track.album.images[0]?.url,
            previewUrl: item.track.preview_url,
            externalUrl: item.track.external_urls.spotify,
            duration: item.track.duration_ms,
            popularity: item.track.popularity,
            playedAt: item.played_at
          }))
        };
      } else {
        throw new Error('No recently played tracks found');
      }
    } catch (error) {
      console.error('❌ Error getting recently played:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's top tracks
  async getTopTracks(limit = 20, timeRange = 'short_term') {
    try {
      const token = await this.ensureValidToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.items) {
        return {
          success: true,
          tracks: data.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            externalUrl: track.external_urls.spotify,
            duration: track.duration_ms,
            popularity: track.popularity
          }))
        };
      } else {
        throw new Error('No top tracks found');
      }
    } catch (error) {
      console.error('❌ Error getting top tracks:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.accessToken && !this.isTokenExpired());
  }

  // Logout
  async logout() {
    try {
      await this.clearTokens();
      console.log('✅ Spotify logout successful');
    } catch (error) {
      console.error('❌ Error during Spotify logout:', error);
    }
  }

  // Clear stored tokens
  async clearTokens() {
    try {
      await AsyncStorage.removeItem('spotify_access_token');
      await AsyncStorage.removeItem('spotify_refresh_token');
      await AsyncStorage.removeItem('spotify_token_expiry');
      
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      
      console.log('🧹 Spotify tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing Spotify tokens:', error);
    }
  }

  // Format duration from milliseconds to MM:SS
  formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Create shareable track data for posts
  createTrackShareData(track) {
    return {
      type: 'spotify_track',
      trackId: track.id,
      name: track.name,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArt,
      previewUrl: track.previewUrl,
      externalUrl: track.externalUrl,
      duration: track.duration,
      formattedDuration: this.formatDuration(track.duration),
      popularity: track.popularity
    };
  }
}

// Create singleton instance
const spotifyService = new SpotifyService();

export default spotifyService;

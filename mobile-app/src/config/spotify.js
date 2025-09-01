// Spotify Configuration
// You need to create a Spotify app at https://developer.spotify.com/dashboard
// and get your Client ID and Client Secret

export const SPOTIFY_CONFIG = {
  // Your Spotify App Client ID (get this from Spotify Developer Dashboard)
  CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID',
  
  // Your Spotify App Client Secret (get this from Spotify Developer Dashboard)
  CLIENT_SECRET: 'YOUR_SPOTIFY_CLIENT_SECRET',
  
  // Redirect URI for authentication
  REDIRECT_URI: 'exp://localhost:19000/--/spotify-auth-callback',
  
  // Scopes for API access
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-top-read',
    'user-read-recently-played'
  ],
  
  // API endpoints
  ENDPOINTS: {
    AUTH: 'https://accounts.spotify.com/authorize',
    TOKEN: 'https://accounts.spotify.com/api/token',
    SEARCH: 'https://api.spotify.com/v1/search',
    TRACK: 'https://api.spotify.com/v1/tracks',
    RECENTLY_PLAYED: 'https://api.spotify.com/v1/me/player/recently-played',
    TOP_TRACKS: 'https://api.spotify.com/v1/me/top/tracks',
  }
};

// Instructions for setting up Spotify integration:
// 1. Go to https://developer.spotify.com/dashboard
// 2. Create a new app
// 3. Get your Client ID and Client Secret
// 4. Add your redirect URI to the app settings
// 5. Update the CLIENT_ID and CLIENT_SECRET above
// 6. For production, update the REDIRECT_URI to your app's URL scheme

export default SPOTIFY_CONFIG;

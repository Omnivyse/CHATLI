# Spotify Integration for CHATLI Mobile App

This document explains how to set up and use the Spotify integration feature in the CHATLI mobile app.

## Features

- 🔍 **Search Spotify tracks** - Search for any song, artist, or album
- 📱 **Share music in posts** - Add Spotify tracks to your posts
- 🎵 **Preview playback** - Play 30-second previews of tracks
- 🔗 **Open in Spotify** - Direct links to open tracks in Spotify app
- 📊 **Recently played** - Access your recently played tracks
- ⭐ **Top tracks** - View your most played tracks
- 🔐 **Secure authentication** - OAuth 2.0 with refresh tokens

## Setup Instructions

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - **App name**: `CHATLI Mobile`
   - **App description**: `Music sharing for CHATLI social app`
   - **Website**: Your app's website (optional)
   - **Redirect URIs**: `exp://localhost:19000/--/spotify-auth-callback`
   - **Category**: Choose "Mobile app"

### 2. Get Your Credentials

After creating the app, you'll get:
- **Client ID** - A long string of letters and numbers
- **Client Secret** - Another long string (keep this secret!)

### 3. Update Configuration

1. Open `mobile-app/src/config/spotify.js`
2. Replace the placeholder values:
   ```javascript
   export const SPOTIFY_CONFIG = {
     CLIENT_ID: 'your_actual_client_id_here',
     CLIENT_SECRET: 'your_actual_client_secret_here',
     // ... rest of config
   };
   ```

### 4. For Production

When deploying to production, update the redirect URI in both:
1. **Spotify Dashboard**: Add your production redirect URI
2. **Config file**: Update `REDIRECT_URI` to match your production URL scheme

## How to Use

### Adding Music to Posts

1. **Create a new post** - Tap the "+" button in the feed
2. **Add music** - Tap the "Music" button in the bottom toolbar
3. **Connect Spotify** - If not connected, tap "Connect Spotify"
4. **Search or browse**:
   - **Search tab**: Search for any track
   - **Recent tab**: Your recently played tracks
   - **Top tab**: Your most played tracks
5. **Select a track** - Tap on any track to add it to your post
6. **Post** - The track will appear in your post with album art and play button

### Viewing Music in Posts

- **Album art** - Shows the track's album cover
- **Track info** - Displays song name, artist, and album
- **Play button** - Tap to play 30-second preview
- **Spotify logo** - Tap to open the full track in Spotify app
- **Duration** - Shows track length

## Technical Details

### Authentication Flow

1. **OAuth 2.0 Authorization Code Flow**
   - User taps "Connect Spotify"
   - App opens Spotify login in browser
   - User authorizes the app
   - Spotify redirects back with authorization code
   - App exchanges code for access and refresh tokens
   - Tokens are stored securely in AsyncStorage

2. **Token Management**
   - Access tokens expire after 1 hour
   - Refresh tokens are used to get new access tokens
   - Tokens are automatically refreshed when needed
   - Failed refresh clears all tokens and requires re-authentication

### API Endpoints Used

- `GET /search` - Search for tracks
- `GET /tracks/{id}` - Get track details
- `GET /me/player/recently-played` - Recently played tracks
- `GET /me/top/tracks` - User's top tracks

### Data Structure

```javascript
// Spotify track data structure
{
  type: 'spotify_track',
  trackId: 'spotify_track_id',
  name: 'Song Name',
  artist: 'Artist Name',
  album: 'Album Name',
  albumArt: 'https://image.url',
  previewUrl: 'https://preview.url',
  externalUrl: 'https://open.spotify.com/track/...',
  duration: 180000, // milliseconds
  formattedDuration: '3:00',
  popularity: 85
}
```

## Security Considerations

- **Client Secret**: Never expose in client-side code in production
- **Token Storage**: Tokens are stored in AsyncStorage (device storage)
- **HTTPS**: All API calls use HTTPS
- **State Parameter**: OAuth flow includes state parameter for CSRF protection
- **Scope Limitation**: Only requests necessary permissions

## Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Check that CLIENT_ID and CLIENT_SECRET are correct
   - Verify the app is properly configured in Spotify Dashboard

2. **"Invalid redirect URI" error**
   - Ensure redirect URI matches exactly in Spotify Dashboard
   - Check for typos in the URI

3. **"No tracks found"**
   - Verify user has granted necessary permissions
   - Check internet connection
   - Try refreshing the search

4. **Preview not playing**
   - Not all tracks have preview URLs
   - Preview URLs may expire
   - Use "Open in Spotify" as fallback

### Debug Mode

Enable debug logging by checking the console for:
- `🎵 Spotify service initialized`
- `🔐 Starting Spotify authentication...`
- `✅ Spotify authentication successful`
- `🔍 Searching tracks...`

## Future Enhancements

- [ ] **Playlist support** - Share entire playlists
- [ ] **Audio playback** - Full track playback within app
- [ ] **Collaborative playlists** - Create shared playlists
- [ ] **Music recommendations** - AI-powered music suggestions
- [ ] **Lyrics display** - Show song lyrics in posts
- [ ] **Music analytics** - Track listening habits

## Support

For technical support:
1. Check the console logs for error messages
2. Verify your Spotify app configuration
3. Ensure all dependencies are installed
4. Test with a different Spotify account

## Dependencies

- `expo-auth-session` - OAuth authentication
- `expo-crypto` - Cryptographic functions
- `expo-web-browser` - Browser authentication
- `@react-native-async-storage/async-storage` - Token storage

## License

This Spotify integration follows Spotify's API terms of service and the app's overall license.

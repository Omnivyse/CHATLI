const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config({ path: '../config.env' });

async function cleanupEmptySpotifyTracks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔗 Connected to MongoDB');
    
    // Find posts with empty spotifyTrack objects
    const postsWithEmptySpotify = await Post.find({
      spotifyTrack: { $exists: true, $ne: null },
      $or: [
        { 'spotifyTrack.name': { $exists: false } },
        { 'spotifyTrack.name': null },
        { 'spotifyTrack.name': '' },
        { 'spotifyTrack.artist': { $exists: false } },
        { 'spotifyTrack.artist': null },
        { 'spotifyTrack.artist': '' }
      ]
    });
    
    console.log(`📊 Found ${postsWithEmptySpotify.length} posts with empty spotifyTrack data`);
    
    if (postsWithEmptySpotify.length > 0) {
      // Update these posts to remove the spotifyTrack field
      const result = await Post.updateMany(
        {
          spotifyTrack: { $exists: true, $ne: null },
          $or: [
            { 'spotifyTrack.name': { $exists: false } },
            { 'spotifyTrack.name': null },
            { 'spotifyTrack.name': '' },
            { 'spotifyTrack.artist': { $exists: false } },
            { 'spotifyTrack.artist': null },
            { 'spotifyTrack.artist': '' }
          ]
        },
        {
          $unset: { spotifyTrack: 1 }
        }
      );
      
      console.log(`✅ Cleaned up ${result.modifiedCount} posts`);
    } else {
      console.log('✅ No posts with empty spotifyTrack data found');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up empty spotifyTrack data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupEmptySpotifyTracks();

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

const Post = require('../models/Post');
const User = require('../models/User');

async function cleanupOrphanedPosts() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find all posts
    const posts = await Post.find().populate('author');
    
    console.log(`Found ${posts.length} total posts`);
    
    // Find posts with deleted authors
    const orphanedPosts = posts.filter(post => !post.author);
    
    console.log(`Found ${orphanedPosts.length} orphaned posts (posts with deleted authors)`);
    
    if (orphanedPosts.length > 0) {
      console.log('Cleaning up orphaned posts...');
      
      // Delete orphaned posts
      const orphanedPostIds = orphanedPosts.map(post => post._id);
      await Post.deleteMany({ _id: { $in: orphanedPostIds } });
      
      console.log(`Deleted ${orphanedPosts.length} orphaned posts`);
    }
    
    // Also clean up posts where author field is null or undefined
    const nullAuthorPosts = await Post.find({ author: { $exists: false } });
    console.log(`Found ${nullAuthorPosts.length} posts with null/undefined author field`);
    
    if (nullAuthorPosts.length > 0) {
      await Post.deleteMany({ author: { $exists: false } });
      console.log(`Deleted ${nullAuthorPosts.length} posts with null author field`);
    }
    
    // Clean up comments from deleted users
    const postsWithComments = await Post.find({ 'comments.author': { $exists: true } });
    let cleanedComments = 0;
    
    for (const post of postsWithComments) {
      const originalCommentCount = post.comments.length;
      
      // Filter out comments from deleted users
      post.comments = post.comments.filter(comment => {
        // If comment.author is an ObjectId, check if user exists
        if (comment.author && typeof comment.author === 'object' && comment.author._id) {
          return true; // User exists
        }
        return false; // User doesn't exist, remove comment
      });
      
      if (post.comments.length !== originalCommentCount) {
        await post.save();
        cleanedComments += (originalCommentCount - post.comments.length);
      }
    }
    
    console.log(`Cleaned up ${cleanedComments} comments from deleted users`);
    
    console.log('\n=================================');
    console.log('CLEANUP COMPLETE!');
    console.log('=================================');
    console.log(`- Deleted ${orphanedPosts.length} orphaned posts`);
    console.log(`- Deleted ${nullAuthorPosts.length} posts with null author`);
    console.log(`- Cleaned up ${cleanedComments} orphaned comments`);
    console.log('=================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error cleaning up orphaned posts:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

cleanupOrphanedPosts(); 
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

const Post = require('../models/Post');
const User = require('../models/User');

async function createDefaultPost() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find the first user (or create one if needed)
    let user = await User.findOne();
    
    if (!user) {
      console.log('No users found. Creating a default user...');
      user = new User({
        name: 'Default User',
        username: 'defaultuser',
        email: 'default@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      });
      await user.save();
      console.log('Default user created:', user._id);
    }

    // Check if default post already exists
    const existingPost = await Post.findOne({ 
      content: 'CHATLI-д тавтай морил! 👋 Энэ бол анхны пост юм.' 
    });

    if (existingPost) {
      console.log('Default post already exists!');
      console.log('Post ID:', existingPost._id);
      console.log('Content:', existingPost.content);
      console.log('Media count:', existingPost.media?.length || 0);
    } else {
      // Create default post with image
      const defaultPost = new Post({
        author: user._id,
        content: 'CHATLI-д тавтай морил! 👋 Энэ бол анхны пост юм.',
        media: [
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
            publicId: 'default-post-image',
            width: 800,
            height: 600,
            format: 'jpg',
            size: 102400
          }
        ],
        likes: []
      });

      await defaultPost.save();
      console.log('Default post created successfully!');
      console.log('Post ID:', defaultPost._id);
      console.log('Content:', defaultPost.content);
      console.log('Image URL:', defaultPost.media[0].url);
    }

    // Show all posts count
    const totalPosts = await Post.countDocuments();
    console.log(`Total posts in database: ${totalPosts}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error creating default post:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

createDefaultPost(); 
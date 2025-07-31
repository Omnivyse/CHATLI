require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');

async function testPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if there are any posts
    const postCount = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${postCount}`);

    if (postCount === 0) {
      console.log('⚠️ No posts found. Creating a test post...');
      
      // Find a verified user to create the post
      const user = await User.findOne({ emailVerified: true }).limit(1);
      
      if (!user) {
        console.log('❌ No verified users found. Cannot create test post.');
        return;
      }

      // Create a test post
      const testPost = new Post({
        author: user._id,
        content: 'Энэ бол тест пост юм! 👋',
        media: []
      });

      await testPost.save();
      console.log('✅ Test post created successfully');
      console.log('📝 Post content:', testPost.content);
      console.log('👤 Author:', user.name);
    } else {
      // Show some sample posts
      const posts = await Post.find()
        .populate('author', 'name email emailVerified')
        .sort({ createdAt: -1 })
        .limit(5);

      console.log('\n📋 Recent posts:');
      posts.forEach((post, index) => {
        console.log(`${index + 1}. "${post.content}" by ${post.author?.name || 'Unknown'} (${post.author?.emailVerified ? 'Verified' : 'Unverified'})`);
      });
    }

    // Check user verification status
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    const totalUsers = await User.countDocuments();
    
    console.log(`\n👥 Users: ${verifiedUsers}/${totalUsers} verified`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testPosts(); 
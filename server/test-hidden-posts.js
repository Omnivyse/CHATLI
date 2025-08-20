require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');
const PrivacySettings = require('./models/PrivacySettings');

async function testHiddenPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check all posts and their hidden status
    const allPosts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    console.log(`📊 Total posts in database: ${allPosts.length}`);

    if (allPosts.length === 0) {
      console.log('⚠️ No posts found in database');
      return;
    }

    // Check posts with isHidden = true
    const hiddenPosts = allPosts.filter(post => post.isHidden);
    console.log(`\n🚫 Hidden posts: ${hiddenPosts.length}`);

    hiddenPosts.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post._id}`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log(`   Author: ${post.author?.name || 'Unknown'} (${post.author?.email || 'No email'})`);
      console.log(`   isHidden: ${post.isHidden}`);
      console.log(`   hiddenReason: ${post.hiddenReason || 'null'}`);
      console.log(`   isSecret: ${post.isSecret}`);
      console.log(`   Created: ${post.createdAt}`);
      console.log('   ---');
    });

    // Check posts with hiddenReason = 'privacy_change'
    const privacyHiddenPosts = allPosts.filter(post => post.hiddenReason === 'privacy_change');
    console.log(`\n🔒 Posts hidden due to privacy change: ${privacyHiddenPosts.length}`);

    privacyHiddenPosts.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post._id}`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log(`   Author: ${post.author?.name || 'Unknown'}`);
      console.log(`   isHidden: ${post.isHidden}`);
      console.log(`   hiddenReason: ${post.hiddenReason}`);
      console.log(`   isSecret: ${post.isSecret}`);
      console.log('   ---');
    });

    // Check posts with isSecret = true
    const secretPosts = allPosts.filter(post => post.isSecret);
    console.log(`\n🔐 Secret posts: ${secretPosts.length}`);

    secretPosts.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post._id}`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log(`   Author: ${post.author?.name || 'Unknown'}`);
      console.log(`   isHidden: ${post.isHidden}`);
      console.log(`   hiddenReason: ${post.hiddenReason || 'null'}`);
      console.log(`   isSecret: ${post.isSecret}`);
      console.log('   ---');
    });

    // Check users with private accounts
    const privateUsers = await PrivacySettings.find({ isPrivateAccount: true });
    console.log(`\n👤 Users with private accounts: ${privateUsers.length}`);

    privateUsers.forEach((privacy, index) => {
      console.log(`${index + 1}. User ID: ${privacy.userId}`);
      console.log(`   isPrivateAccount: ${privacy.isPrivateAccount}`);
      console.log('   ---');
    });

    // Check if there are any posts from private users that are NOT hidden
    const privateUserIds = privateUsers.map(ps => ps.userId);
    const nonHiddenPostsFromPrivateUsers = allPosts.filter(post => 
      privateUserIds.includes(post.author._id) && 
      !post.isHidden &&
      post.isSecret
    );

    console.log(`\n⚠️ Secret posts from private users that are NOT hidden: ${nonHiddenPostsFromPrivateUsers.length}`);

    nonHiddenPostsFromPrivateUsers.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post._id}`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log(`   Author: ${post.author?.name || 'Unknown'}`);
      console.log(`   isHidden: ${post.isHidden}`);
      console.log(`   hiddenReason: ${post.hiddenReason || 'null'}`);
      console.log(`   isSecret: ${post.isSecret}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testHiddenPosts();

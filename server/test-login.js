const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if your user exists
    console.log('\n🔍 Testing user existence...');
    const testEmail = 'your-email@example.com'; // Replace with your actual email
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found with email:', testEmail);
      console.log('📝 Please provide your actual email address');
      return;
    }

    console.log('✅ User found:', {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    });

    // Test 2: Check password
    console.log('\n🔍 Testing password...');
    const testPassword = 'your-password'; // Replace with your actual password
    const isPasswordValid = await user.comparePassword(testPassword);
    
    if (!isPasswordValid) {
      console.log('❌ Password is incorrect');
      return;
    }

    console.log('✅ Password is correct');

    // Test 3: Check email verification status
    console.log('\n🔍 Testing email verification...');
    console.log('Current emailVerified status:', user.emailVerified);
    
    if (user.emailVerified === undefined) {
      console.log('🔄 Auto-verifying existing user...');
      user.emailVerified = true;
      await user.save();
      console.log('✅ User auto-verified');
    } else if (user.emailVerified === false) {
      console.log('❌ User needs email verification');
    } else {
      console.log('✅ User is already verified');
    }

    // Test 4: Simulate login process
    console.log('\n🔍 Simulating login process...');
    
    // Check if email is verified (after potential auto-verification)
    if (user.emailVerified === false) {
      console.log('❌ Login would fail - email not verified');
      console.log('💡 Solution: User needs to verify email');
    } else {
      console.log('✅ Login would succeed');
      console.log('🎉 User can access the app');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Instructions for the user
console.log('📋 Instructions:');
console.log('1. Replace "your-email@example.com" with your actual email');
console.log('2. Replace "your-password" with your actual password');
console.log('3. Run: node test-login.js');
console.log('\n');

// Uncomment the line below and update with your actual email and password
// testLogin(); 
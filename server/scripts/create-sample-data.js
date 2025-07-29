const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

const Analytics = require('../models/Analytics');
const User = require('../models/User');

async function createSampleData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if we already have analytics data
    const existingAnalytics = await Analytics.countDocuments();
    
    if (existingAnalytics > 0) {
      console.log(`Analytics data already exists (${existingAnalytics} records)`);
    } else {
      console.log('Creating sample analytics data...');
      
      // Create sample analytics data for the last 7 days
      const sampleData = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Create multiple events for each day
        for (let j = 0; j < 10; j++) {
          const eventTime = new Date(date);
          eventTime.setHours(Math.floor(Math.random() * 24));
          eventTime.setMinutes(Math.floor(Math.random() * 60));
          
          sampleData.push({
            eventType: ['page_view', 'user_login', 'message_sent', 'post_created'][Math.floor(Math.random() * 4)],
            page: ['/', '/feed', '/chats', '/profile'][Math.floor(Math.random() * 4)],
            deviceInfo: {
              platform: ['Windows', 'macOS', 'iOS', 'Android'][Math.floor(Math.random() * 4)],
              browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
              isMobile: Math.random() > 0.5
            },
            sessionDuration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
            createdAt: eventTime
          });
        }
      }
      
      await Analytics.insertMany(sampleData);
      console.log(`Created ${sampleData.length} sample analytics records`);
    }

    // Check if we have users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Creating sample user...');
      
      const sampleUser = new User({
        name: 'Sample User',
        username: 'sampleuser',
        email: 'sample@example.com',
        password: 'password123',
        status: 'online'
      });
      
      await sampleUser.save();
      console.log('Created sample user');
    } else {
      console.log(`Users already exist (${userCount} users)`);
    }

    console.log('\n=================================');
    console.log('SAMPLE DATA CREATION COMPLETE!');
    console.log('=================================');
    console.log('Admin dashboard should now work properly');
    console.log('=================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error creating sample data:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

createSampleData(); 
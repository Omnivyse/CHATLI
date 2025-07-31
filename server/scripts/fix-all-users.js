const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} total users`);

    // Find users who need fixing
    const usersToFix = await User.find({
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: null },
        { emailVerified: false }
      ]
    });

    console.log(`🔧 Found ${usersToFix.length} users that need fixing`);

    if (usersToFix.length === 0) {
      console.log('✅ All users are already verified');
      return;
    }

    // Update all users to have emailVerified: true
    const updateResult = await User.updateMany(
      {
        $or: [
          { emailVerified: { $exists: false } },
          { emailVerified: null },
          { emailVerified: false }
        ]
      },
      {
        $set: {
          emailVerified: true,
          verificationCode: null,
          verificationExpires: null
        }
      }
    );

    console.log(`✅ Successfully fixed ${updateResult.modifiedCount} users`);
    console.log('📋 Fix details:');
    console.log(`   - Total users: ${allUsers.length}`);
    console.log(`   - Users that needed fixing: ${usersToFix.length}`);
    console.log(`   - Users fixed: ${updateResult.modifiedCount}`);

    // Show some examples of fixed users
    const sampleUsers = usersToFix.slice(0, 5);
    console.log('\n📝 Sample fixed users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    if (usersToFix.length > 5) {
      console.log(`   ... and ${usersToFix.length - 5} more users`);
    }

    // Verify the fix
    const remainingUnverified = await User.find({
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: null },
        { emailVerified: false }
      ]
    });

    console.log(`\n🔍 Verification: ${remainingUnverified.length} users still unverified`);
    if (remainingUnverified.length === 0) {
      console.log('🎉 All users are now verified!');
    } else {
      console.log('⚠️ Some users still need manual verification');
      remainingUnverified.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixAllUsers()
  .then(() => {
    console.log('🎉 User fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 User fix failed:', error);
    process.exit(1);
  }); 
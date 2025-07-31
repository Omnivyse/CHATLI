const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrateExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all users who don't have emailVerified field or have it set to undefined
    const usersToUpdate = await User.find({
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: null }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users to migrate`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need migration');
      return;
    }

    // Update all these users to have emailVerified: true
    const updateResult = await User.updateMany(
      {
        $or: [
          { emailVerified: { $exists: false } },
          { emailVerified: null }
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

    console.log(`✅ Successfully migrated ${updateResult.modifiedCount} users`);
    console.log('📋 Migration details:');
    console.log(`   - Users found: ${usersToUpdate.length}`);
    console.log(`   - Users updated: ${updateResult.modifiedCount}`);

    // Show some examples of migrated users
    const sampleUsers = usersToUpdate.slice(0, 5);
    console.log('\n📝 Sample migrated users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
    });

    if (usersToUpdate.length > 5) {
      console.log(`   ... and ${usersToUpdate.length - 5} more users`);
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateExistingUsers()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 
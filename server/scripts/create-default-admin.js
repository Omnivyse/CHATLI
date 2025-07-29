const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

const Admin = require('../models/Admin');

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('\n=================================');
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('=================================\n');
    } else {
      // Create default admin with known password for testing
      const admin = new Admin({
        username: 'admin',
        email: 'admin@chatli.mn',
        password: 'admin123456', // This will be hashed automatically
        role: 'super_admin',
        permissions: {
          users: true,
          reports: true,
          analytics: true,
          system: true
        }
      });

      await admin.save();
      
      console.log('\n=================================');
      console.log('DEFAULT ADMIN USER CREATED!');
      console.log('=================================');
      console.log('Username: admin');
      console.log('Password: admin123456');
      console.log('Email: admin@chatli.mn');
      console.log('Role: super_admin');
      console.log('=================================');
      console.log('⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
      console.log('=================================\n');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error creating admin:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

createDefaultAdmin(); 
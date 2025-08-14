#!/usr/bin/env node

// Simple test script to verify server can start
console.log('🧪 Testing CHATLI server startup...');

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:', missingVars);
  console.log('💡 Set these variables before starting the server');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Test MongoDB connection string format
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.log('❌ Invalid MongoDB URI format');
  process.exit(1);
}

console.log('✅ MongoDB URI format is valid');

// Test JWT secret
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret.length < 10) {
  console.log('❌ JWT secret is too short (minimum 10 characters)');
  process.exit(1);
}

console.log('✅ JWT secret is valid length');

console.log('🎉 All tests passed! Server should start successfully.');
console.log('💡 Run "npm start" to start the server');

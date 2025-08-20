// Test script to verify API URL construction
console.log('🧪 Testing API URL construction...');

// Simulate the mobile app's API URL logic
const FALLBACK_API_URL = 'https://chatli-production.up.railway.app/api';
const FALLBACK_DEV_API_URL = 'http://localhost:5000/api';

// Try to import environment variables, fallback to hardcoded values
let API_BASE_URL, DEV_API_URL;

try {
  const env = require('@env');
  API_BASE_URL = env.API_BASE_URL;
  DEV_API_URL = env.DEV_API_URL;
  console.log('✅ Environment variables loaded:', { API_BASE_URL, DEV_API_URL });
} catch (error) {
  console.log('⚠️ Environment variables not loaded, using fallback URLs');
  API_BASE_URL = FALLBACK_API_URL;
  DEV_API_URL = FALLBACK_DEV_API_URL;
}

// Use environment variable or fallback to production URL
const getApiUrl = () => {
  if (false && DEV_API_URL) { // Simulate __DEV__ = false
    return DEV_API_URL;
  }
  return API_BASE_URL || FALLBACK_API_URL;
};

const apiUrl = getApiUrl();
console.log('🔗 Final API URL:', apiUrl);

// Test the registration endpoint URL
const registrationUrl = `${apiUrl}/auth/register`;
console.log('📝 Registration endpoint:', registrationUrl);

// Test with a sample request
const testData = {
  name: 'Test User',
  username: 'testuser456',
  email: 'test456@example.com',
  password: 'TestPassword456!'
};

console.log('📋 Test data:', testData);
console.log('📡 Would send POST request to:', registrationUrl);
console.log('📡 With body:', JSON.stringify(testData, null, 2));

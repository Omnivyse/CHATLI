// Test script to verify backend registration endpoint
const API_URL = 'https://chatli-production.up.railway.app/api';

async function testRegistration() {
  console.log('🧪 Testing registration endpoint...');
  
  const testUser = {
    name: 'Test User',
    username: 'testuser123',
    email: 'test@example.com',
    password: 'TestPassword123!'
  };
  
  try {
    console.log('📤 Sending registration request...');
    console.log('📋 Test data:', testUser);
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers);
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('🔑 Token received:', !!data.data?.token);
      console.log('📧 Email sent:', data.data?.emailSent);
    } else {
      console.log('❌ Registration failed:', data.message);
      if (data.errors) {
        console.log('🔍 Validation errors:', data.errors);
      }
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

// Test health check first
async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('🏥 Health check response:', data);
    return response.ok;
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting CHATLI registration tests...\n');
  
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('❌ Backend is not healthy, skipping registration test');
    return;
  }
  
  console.log('✅ Backend is healthy, testing registration...\n');
  await testRegistration();
  
  console.log('\n🏁 Tests completed!');
}

runTests();

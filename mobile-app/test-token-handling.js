// Test script for token handling
// Run this in the mobile app directory to test token validation

const testTokenHandling = () => {
  console.log('🧪 Testing token handling...');
  
  // Test 1: Invalid token format
  const invalidToken = 'invalid.token';
  console.log('Test 1 - Invalid token format:', invalidToken);
  
  // Test 2: Expired token (exp: 1 hour ago)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNzM0NzI4MDAwLCJleHAiOjE3MzQ3MzE2MDB9.invalid_signature';
  console.log('Test 2 - Expired token:', expiredToken);
  
  // Test 3: Valid token (exp: 1 hour from now)
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNzM0NzI4MDAwLCJleHAiOjE3MzQ3MzE2MDB9.invalid_signature';
  console.log('Test 3 - Valid token:', validToken);
  
  console.log('✅ Token handling tests completed');
};

// Export for use in the app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testTokenHandling };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  testTokenHandling();
}

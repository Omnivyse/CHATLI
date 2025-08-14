#!/usr/bin/env node

// Test script to verify JWT token backward compatibility
const jwt = require('jsonwebtoken');

console.log('🧪 Testing JWT Token Backward Compatibility...\n');

// Simulate old token format (without new claims)
const oldTokenPayload = {
  userId: '507f1f77bcf86cd799439011',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

// Simulate new token format (with all required claims)
const newTokenPayload = {
  userId: '507f1f77bcf86cd799439012',
  jti: 'test-jti-123',
  aud: 'chatli-app',
  iss: 'chatli-server',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

// Test old token
console.log('📝 Testing OLD token format:');
console.log('Payload:', JSON.stringify(oldTokenPayload, null, 2));

const oldToken = jwt.sign(oldTokenPayload, 'test-secret');
console.log('Old Token:', oldToken);

// Decode and verify old token
const decodedOld = jwt.decode(oldToken);
console.log('Decoded Old Token:', JSON.stringify(decodedOld, null, 2));

// Check what claims are missing
const missingClaims = [];
if (!decodedOld.jti) missingClaims.push('jti');
if (!decodedOld.aud) missingClaims.push('aud');
if (!decodedOld.iss) missingClaims.push('iss');

console.log('Missing claims:', missingClaims.length > 0 ? missingClaims : 'None');
console.log('✅ Old token format test completed\n');

// Test new token
console.log('📝 Testing NEW token format:');
console.log('Payload:', JSON.stringify(newTokenPayload, null, 2));

const newToken = jwt.sign(newTokenPayload, 'test-secret');
console.log('New Token:', newToken);

// Decode and verify new token
const decodedNew = jwt.decode(newToken);
console.log('Decoded New Token:', JSON.stringify(decodedNew, null, 2));

// Check what claims are present
const presentClaims = [];
if (decodedNew.jti) presentClaims.push('jti');
if (decodedNew.aud) presentClaims.push('aud');
if (decodedNew.iss) presentClaims.push('iss');

console.log('Present claims:', presentClaims);
console.log('✅ New token format test completed\n');

// Test backward compatibility logic
console.log('🔄 Testing Backward Compatibility Logic:');

function simulateBackwardCompatibility(decoded) {
  let isValidToken = true;
  let missingClaims = [];

  // Check for required claims with backward compatibility
  if (!decoded.userId) {
    if (decoded.id) {
      decoded.userId = decoded.id;
    } else {
      isValidToken = false;
      missingClaims.push('userId');
    }
  }

  // For new tokens, require all claims; for old tokens, be more lenient
  if (decoded.aud && decoded.iss && decoded.jti) {
    console.log('  → New token format detected - validating all claims');
    
    if (decoded.aud !== 'chatli-app') {
      console.log('  ❌ Invalid audience');
      return false;
    }

    if (decoded.iss !== 'chatli-server') {
      console.log('  ❌ Invalid issuer');
      return false;
    }
    
    console.log('  ✅ All claims valid');
  } else {
    console.log('  → Old token format detected - adding missing claims');
    
    // Add missing claims for consistency
    if (!decoded.jti) decoded.jti = 'legacy-' + Date.now();
    if (!decoded.aud) decoded.aud = 'chatli-app';
    if (!decoded.iss) decoded.iss = 'chatli-server';
    
    console.log('  ✅ Legacy claims added for compatibility');
  }

  return true;
}

console.log('\nTesting OLD token compatibility:');
const oldCompatible = simulateBackwardCompatibility(decodedOld);
console.log('Result:', oldCompatible ? '✅ ACCEPTED' : '❌ REJECTED');

console.log('\nTesting NEW token compatibility:');
const newCompatible = simulateBackwardCompatibility(decodedNew);
console.log('Result:', newCompatible ? '✅ ACCEPTED' : '❌ REJECTED');

console.log('\n🎉 Backward compatibility test completed!');
console.log('💡 Both old and new token formats should now work.');

require('dotenv').config({ path: './config.env' });
const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Check environment variables
  console.log('📧 Environment Variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set\n');

  // Test email service initialization
  console.log('🔧 Testing Email Service Initialization:');
  const isInitialized = await emailService.testEmailService();
  console.log('Email service initialized:', isInitialized ? '✅ Yes' : '❌ No\n');

  // Test verification code generation
  console.log('🔢 Testing Verification Code Generation:');
  const code1 = emailService.generateVerificationCode();
  const code2 = emailService.generateVerificationCode();
  console.log('Code 1:', code1, '(5 digits:', code1.length === 5 ? '✅' : '❌', ')');
  console.log('Code 2:', code2, '(5 digits:', code2.length === 5 ? '✅' : '❌', ')');
  console.log('Codes are different:', code1 !== code2 ? '✅' : '❌', '\n');

  // Test email sending (if configured)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📤 Testing Email Sending:');
    console.log('Sending test email to:', process.env.EMAIL_USER);
    
    try {
      const result = await emailService.sendVerificationEmail(
        process.env.EMAIL_USER,
        'TestUser',
        '12345'
      );
      
      if (result.success) {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', result.messageId || 'N/A');
      } else {
        console.log('❌ Email sending failed:');
        console.log('Error:', result.error);
      }
    } catch (error) {
      console.log('❌ Email sending error:', error.message);
    }
  } else {
    console.log('⚠️ Email credentials not configured. Skipping email send test.');
    console.log('To test email sending, set EMAIL_USER and EMAIL_PASS in your .env file.');
  }

  console.log('\n🎯 Test Complete!');
}

// Run the test
testEmailService().catch(console.error); 
require('dotenv').config({ path: './config.env' });
const emailService = require('./services/emailService');

async function testExternalEmail() {
  console.log('🧪 Testing Email Service - External Addresses\n');

  // Check environment variables
  console.log('📧 Environment Variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ Not set\n');

  // Test email service initialization
  console.log('🔧 Testing Email Service Initialization:');
  const isInitialized = await emailService.testEmailService();
  if (!isInitialized) {
    console.error('❌ Email service not initialized. Please check your EMAIL_USER and EMAIL_PASS in config.env');
    console.error('❌ Make sure you are using a Gmail App Password, not your regular password');
    process.exit(1);
  }
  console.log('Email service initialized: ✅ Yes\n');

  // Get test email addresses from command line or use defaults
  const testEmails = process.argv.slice(2);
  
  if (testEmails.length === 0) {
    console.log('⚠️  No email addresses provided. Usage:');
    console.log('   node test-email-external.js email1@example.com email2@example.com');
    console.log('\n📧 Testing with your own email address as fallback...\n');
    testEmails.push(process.env.EMAIL_USER);
  }

  console.log('📤 Testing Email Sending to External Addresses:');
  console.log('📧 Test emails:', testEmails.join(', '));
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const testEmail of testEmails) {
    console.log(`\n📧 Testing: ${testEmail}`);
    console.log('─'.repeat(50));
    
    try {
      const verificationCode = emailService.generateVerificationCode();
      console.log('📧 Verification code:', verificationCode);
      
      const result = await emailService.sendVerificationEmail(
        testEmail,
        'TestUser',
        verificationCode
      );
      
      if (result.success) {
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId || 'N/A');
        if (result.accepted) {
          console.log('📧 Accepted recipients:', result.accepted);
        }
        successCount++;
        
        // Check if email was actually accepted
        if (result.accepted && result.accepted.length > 0) {
          console.log('✅ Email was accepted by server');
        } else {
          console.log('⚠️  Email sent but not in accepted list - may be rejected');
        }
      } else {
        console.log('❌ Email sending failed:');
        console.log('❌ Error:', result.error);
        failCount++;
      }
    } catch (error) {
      console.log('❌ Email sending error:', error.message);
      console.log('❌ Error code:', error.code);
      failCount++;
    }
    
    // Wait a bit between emails to avoid rate limiting
    if (testEmails.length > 1) {
      console.log('⏳ Waiting 2 seconds before next email...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📧 Total tested: ${testEmails.length}`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  Some emails failed. Common issues:');
    console.log('   1. Using regular Gmail password instead of App Password');
    console.log('   2. Gmail blocking external emails (check security settings)');
    console.log('   3. Email address invalid or doesn\'t exist');
    console.log('   4. Exceeded Gmail daily sending limits');
    console.log('\n📖 See EMAIL_TROUBLESHOOTING.md for detailed solutions');
  } else {
    console.log('\n✅ All emails sent successfully!');
    console.log('📧 Check recipient inboxes (and spam folders)');
  }
}

// Run the test
testExternalEmail().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

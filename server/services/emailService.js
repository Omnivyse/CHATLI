const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      // Use Gmail SMTP with explicit configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail address
          pass: process.env.EMAIL_PASS  // Your Gmail app password
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      // Fallback to console logging for development
      this.transporter = null;
    }
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate 5-digit verification code
  generateVerificationCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  // Create verification email HTML
  createVerificationEmailHTML(username, verificationCode) {
    return `
      <!DOCTYPE html>
      <html lang="mn">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CHATLI - Имэйл баталгаажуулалт</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #1c1e21;
            background-color: #ffffff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 0;
            overflow: hidden;
          }
          
          .header {
            background-color: #ffffff;
            padding: 40px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #e4e6ea;
          }
          
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #1c1e21;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
          }
          
          .subtitle {
            font-size: 16px;
            color: #65676b;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .content {
            padding: 32px;
            background-color: #ffffff;
          }
          
          .greeting {
            font-size: 18px;
            color: #1c1e21;
            margin-bottom: 24px;
            font-weight: 500;
          }
          
          .message {
            font-size: 16px;
            color: #65676b;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          
          .code-container {
            background-color: #f0f2f5;
            border: 2px solid #e4e6ea;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
          }
          
          .code-label {
            font-size: 14px;
            color: #65676b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
            font-weight: 500;
          }
          
          .verification-code {
            font-size: 48px;
            font-weight: 700;
            color: #1c1e21;
            letter-spacing: 8px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            line-height: 1;
          }
          
          .warning {
            background-color: #f0f2f5;
            border-left: 4px solid #1877f2;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
          }
          
          .warning-title {
            font-size: 14px;
            font-weight: 600;
            color: #1c1e21;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .warning-text {
            font-size: 14px;
            color: #65676b;
            line-height: 1.5;
          }
          
          .footer {
            background-color: #f0f2f5;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e4e6ea;
          }
          
          .footer-text {
            font-size: 12px;
            color: #65676b;
            margin-bottom: 8px;
          }
          
          .footer-copyright {
            font-size: 12px;
            color: #8e8e93;
          }
          
          @media only screen and (max-width: 600px) {
            .email-container {
              margin: 0;
              border-radius: 0;
            }
            
            .header {
              padding: 24px 20px 20px;
            }
            
            .content {
              padding: 20px;
            }
            
            .verification-code {
              font-size: 36px;
              letter-spacing: 6px;
            }
            
            .footer {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">CHATLI</div>
            <div class="subtitle">Имэйл баталгаажуулалт</div>
          </div>
          
          <div class="content">
            <div class="greeting">Сайн байна уу, ${username}!</div>
            
            <div class="message">
              CHATLI дээр бүртгэл үүсгэсэнд баярлалаа. Таны акаунтыг идэвхжүүлэхийн тулд доорх кодыг оруулна уу:
            </div>
            
            <div class="code-container">
              <div class="code-label">Баталгаажуулах код</div>
              <div class="verification-code">${verificationCode}</div>
            </div>
            
            <div class="warning">
              <div class="warning-title">Анхааруулга</div>
              <div class="warning-text">
                Хэрэв та энэ имэйлийг хүлээн аваагүй бол, таны имэйл хаяг буруу байж болох юм. Энэ кодыг 10 минутын дотор оруулна уу.
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">Энэ имэйл автоматаар илгээгдсэн. Хариулж болохгүй.</div>
            <div class="footer-copyright">&copy; 2024 CHATLI. Бүх эрх хуулиар хамгаалагдсан.</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Create verification email text version
  createVerificationEmailText(username, verificationCode) {
    return `
CHATLI - Имэйл баталгаажуулалт

Сайн байна уу, ${username}!

CHATLI дээр бүртгэл үүсгэсэнд баярлалаа. Таны акаунтыг идэвхжүүлэхийн тулд доорх кодыг оруулна уу:

Код: ${verificationCode}

Энэ кодыг 1 минутын дотор оруулна уу. Хугацаа дууссаны дараа шинэ код хүсэх боломжтой.

Анхааруулга: Хэрэв та энэ имэйлийг хүлээн аваагүй бол, таны имэйл хаяг буруу байж болох юм.

Энэ имэйл автоматаар илгээгдсэн. Хариулж болохгүй.

© 2024 CHATLI. Бүх эрх хуулиар хамгаалагдсан.
    `;
  }

  // Send verification email
  async sendVerificationEmail(email, username, verificationCode) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available, logging instead');
        console.log('📧 Verification email would be sent to:', email);
        console.log('📧 Verification code:', verificationCode);
        console.log('📧 User can use this code for testing:', verificationCode);
        return { success: true, message: 'Email logged (service not configured)' };
      }
      
      const mailOptions = {
        from: `"CHATLI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'CHATLI - Имэйл баталгаажуулалт',
        html: this.createVerificationEmailHTML(username, verificationCode),
        text: this.createVerificationEmailText(username, verificationCode)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Verification email sent successfully to:', email);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      
      // Temporary workaround: Log the code for testing
      console.log('📧 TEMPORARY: Verification code for testing:', verificationCode);
      console.log('📧 User can use this code to verify their account');
      
      return { success: false, error: error.message };
    }
  }

  // Send password reset email (for future use)
  async sendPasswordResetEmail(email, username, resetToken) {
    try {
      if (!this.transporter) {
        console.log('📧 Password reset email would be sent to:', email);
        return { success: true, message: 'Email logged (service not configured)' };
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"CHATLI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'CHATLI - Нууц үг сэргээх',
        html: `
          <h2>Нууц үг сэргээх</h2>
          <p>Сайн байна уу, ${username}!</p>
          <p>Таны нууц үгийг сэргээх хүсэлт хүлээн авлаа. Доорх холбоосыг дарж шинэ нууц үгээ оруулна уу:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Нууц үг сэргээх</a>
          <p>Хэрэв та энэ хүсэлтийг өгөөгүй бол энэ имэйлийг үл хэрэгсээрэй.</p>
        `,
        text: `
Нууц үг сэргээх

Сайн байна уу, ${username}!

Таны нууц үгийг сэргээх хүсэлт хүлээн авлаа. Доорх холбоосыг дарж шинэ нууц үгээ оруулна уу:

${resetUrl}

Хэрэв та энэ хүсэлтийг өгөөгүй бол энэ имэйлийг үл хэрэгсээрэй.
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Password reset email sent successfully to:', email);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email service
  async testEmailService() {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not configured');
        return false;
      }

      await this.transporter.verify();
      console.log('✅ Email service is working correctly');
      return true;
    } catch (error) {
      console.error('❌ Email service test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService; 
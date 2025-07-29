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
      // Use Gmail SMTP (you can change this to other providers)
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
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

  // Create verification email HTML
  createVerificationEmailHTML(username, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html lang="mn">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CHATLI - Имэйл баталгаажуулалт</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CHATLI</div>
            <h1 class="title">Имэйл баталгаажуулалт</h1>
          </div>
          
          <div class="content">
            <p>Сайн байна уу, <strong>${username}</strong>!</p>
            
            <p>CHATLI дээр бүртгэл үүсгэсэнд баярлалаа. Таны акаунтыг идэвхжүүлэхийн тулд доорх товчийг дарна уу:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Имэйл баталгаажуулах</a>
            </div>
            
            <div class="warning">
              <strong>Анхааруулга:</strong> Хэрэв та энэ имэйлийг хүлээн аваагүй бол, таны имэйл хаяг буруу байж болох юм. Энэ тохиолдолд дахин бүртгүүлнэ үү.
            </div>
            
            <p>Хэрэв товч ажиллахгүй бол, доорх холбоосыг хуулж тайзны хаяг мөрөнд оруулна уу:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          </div>
          
          <div class="footer">
            <p>Энэ имэйл автоматаар илгээгдсэн. Хариулж болохгүй.</p>
            <p>&copy; 2024 CHATLI. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Create verification email text version
  createVerificationEmailText(username, verificationUrl) {
    return `
CHATLI - Имэйл баталгаажуулалт

Сайн байна уу, ${username}!

CHATLI дээр бүртгэл үүсгэсэнд баярлалаа. Таны акаунтыг идэвхжүүлэхийн тулд доорх холбоосыг дарна уу:

${verificationUrl}

Хэрэв холбоос ажиллахгүй бол, дээрх URL-ийг хуулж тайзны хаяг мөрөнд оруулна уу.

Анхааруулга: Хэрэв та энэ имэйлийг хүлээн аваагүй бол, таны имэйл хаяг буруу байж болох юм.

Энэ имэйл автоматаар илгээгдсэн. Хариулж болохгүй.

© 2024 CHATLI. Бүх эрх хуулиар хамгаалагдсан.
    `;
  }

  // Send verification email
  async sendVerificationEmail(email, username, verificationToken) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available, logging instead');
        console.log('📧 Verification email would be sent to:', email);
        console.log('📧 Verification token:', verificationToken);
        return { success: true, message: 'Email logged (service not configured)' };
      }

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: `"CHATLI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'CHATLI - Имэйл баталгаажуулалт',
        html: this.createVerificationEmailHTML(username, verificationUrl),
        text: this.createVerificationEmailText(username, verificationUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Verification email sent successfully to:', email);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
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
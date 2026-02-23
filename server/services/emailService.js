const crypto = require('crypto');
const { Resend } = require('resend');
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.resend = null;
    this.transporter = null;
    this.fromEmail = null;
    this.provider = null;

    const resendKey = process.env.RESEND_API_KEY;
    const fromResend = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (resendKey && fromResend) {
      this.resend = new Resend(resendKey);
      this.fromEmail = fromResend;
      this.provider = 'resend';
      console.log('📧 Email service initialized (Resend)');
    } else if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false, ciphers: 'SSLv3' },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
      });
      this.fromEmail = emailUser;
      this.provider = 'nodemailer';
      this.transporter.verify().then(() => {
        console.log('📧 Email service initialized (Nodemailer / Gmail)');
      }).catch((err) => {
        console.warn('⚠️ Email transporter verify failed:', err.message);
      });
    } else {
      console.warn('⚠️ Email service is not configured!');
      console.warn('⚠️ Email verification and password reset will not work.');
      console.warn('⚠️ For Railway: Set either (A) RESEND_API_KEY + RESEND_FROM_EMAIL, or (B) EMAIL_USER + EMAIL_PASS in Variables');
      console.warn('⚠️ For local: Set the same in server/config.env');
    }
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateVerificationCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  buildVerificationHtml(username, code) {
    return `
      <html>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="margin-bottom: 8px;">CHATLI</h1>
            <h2 style="margin-bottom: 16px;">Имэйл баталгаажуулалт</h2>
            <p style="margin-bottom: 16px;">Сайн байна уу, ${username || ''}!</p>
            <p style="margin-bottom: 16px;">
              CHATLI дээр бүртгэл үүсгэсэнд баярлалаа. Таны акаунтыг идэвхжүүлэхийн тулд доорх 5 оронтой кодыг оруулна уу:
            </p>
            <div style="
              font-size: 32px;
              letter-spacing: 8px;
              font-weight: 700;
              padding: 16px 24px;
              display: inline-block;
              background: #f0f2f5;
              border-radius: 8px;
              margin-bottom: 16px;
            ">
              ${code}
            </div>
            <p style="font-size: 13px; color: #666;">
              Хэрэв та энэ имэйлийг хүлээн аваагүй бол, таны имэйл хаяг буруу байж болох юм.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  buildVerificationText(username, code) {
    return `CHATLI - Имэйл баталгаажуулалт

Сайн байна уу, ${username || ''}!

Таны баталгаажуулах код: ${code}

Хэрэв та энэ имэйлийг хүлээн аваагүй бол, таны имэйл хаяг буруу байж болох юм.`;
  }

  async sendVerificationEmail(email, username, code) {
    if (!this.fromEmail) {
      console.error('❌ Email service not configured.');
      console.log('📧 Verification code (for manual entry):', code);
      return {
        success: false,
        error: 'Email service not configured. Set RESEND_API_KEY + RESEND_FROM_EMAIL, or EMAIL_USER + EMAIL_PASS (e.g. in Railway Variables).',
        code,
      };
    }

    const html = this.buildVerificationHtml(username, code);
    const text = this.buildVerificationText(username, code);

    if (this.provider === 'resend') {
      try {
        console.log('📧 Sending verification email via Resend...');
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject: 'CHATLI - Имэйл баталгаажуулалт',
          html,
          text,
        });
        if (error) throw error;
        console.log('✅ Verification email sent via Resend. Message ID:', data?.id);
        return { success: true, messageId: data?.id, accepted: [email] };
      } catch (err) {
        console.error('❌ Error sending verification email via Resend:', err.message || err);
        console.log('📧 Verification code (for manual entry):', code);
        return {
          success: false,
          error: err.message || 'Failed to send email',
          code: process.env.NODE_ENV === 'development' ? code : undefined,
        };
      }
    }

    if (this.provider === 'nodemailer' && this.transporter) {
      try {
        console.log('📧 Sending verification email via Nodemailer...');
        const result = await this.transporter.sendMail({
          from: `"CHATLI" <${this.fromEmail}>`,
          to: email,
          subject: 'CHATLI - Имэйл баталгаажуулалт',
          html,
          text,
        });
        console.log('✅ Verification email sent. Message ID:', result.messageId);
        return { success: true, messageId: result.messageId, accepted: result.accepted || [email] };
      } catch (err) {
        console.error('❌ Error sending verification email:', err.message || err);
        console.log('📧 Verification code (for manual entry):', code);
        return {
          success: false,
          error: err.message || 'Failed to send email',
          code: process.env.NODE_ENV === 'development' ? code : undefined,
        };
      }
    }

    console.log('📧 Verification code (for manual entry):', code);
    return { success: false, error: 'Email service not configured.', code };
  }

  async sendPasswordResetEmail(email, username, resetToken) {
    if (!this.fromEmail) {
      console.log('📧 Password reset email would be sent to:', email);
      return { success: true, message: 'Email logged (service not configured)' };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Нууц үг сэргээх</h2>
      <p>Сайн байна уу, ${username || ''}!</p>
      <p>Таны нууц үгийг сэргээх хүсэлт хүлээн авлаа. Доорх холбоосыг дарж шинэ нууц үгээ оруулна уу:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `;
    const text = `Нууц үг сэргээх\n\nСайн байна уу, ${username || ''}!\n\nТаны нууц үгийг сэргээх хүсэлт хүлээн авлаа. Дараах холбоосоор орж шинэ нууц үгээ оруулна уу:\n\n${resetUrl}`;

    if (this.provider === 'resend') {
      try {
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject: 'CHATLI - Нууц үг сэргээх',
          html,
          text,
        });
        if (error) throw error;
        console.log('✅ Password reset email sent via Resend to:', email);
        return { success: true, messageId: data?.id };
      } catch (err) {
        console.error('❌ Error sending password reset email via Resend:', err);
        return { success: false, error: err.message };
      }
    }

    if (this.provider === 'nodemailer' && this.transporter) {
      try {
        const result = await this.transporter.sendMail({
          from: `"CHATLI" <${this.fromEmail}>`,
          to: email,
          subject: 'CHATLI - Нууц үг сэргээх',
          html,
          text,
        });
        console.log('✅ Password reset email sent to:', email);
        return { success: true, messageId: result.messageId };
      } catch (err) {
        console.error('❌ Error sending password reset email:', err);
        return { success: false, error: err.message };
      }
    }

    return { success: true, message: 'Email not sent (service not configured)' };
  }

  async testEmailService() {
    if (this.provider === 'resend' && this.resend) {
      console.log('✅ Resend email service is configured');
      return true;
    }
    if (this.provider === 'nodemailer' && this.transporter) {
      try {
        await this.transporter.verify();
        console.log('✅ Nodemailer email service is configured');
        return true;
      } catch (e) {
        console.log('❌ Nodemailer verify failed:', e.message);
        return false;
      }
    }
    console.log('📧 Email service not configured (RESEND_API_KEY + RESEND_FROM_EMAIL, or EMAIL_USER + EMAIL_PASS)');
    return false;
  }
}

const emailService = new EmailService();
module.exports = emailService;

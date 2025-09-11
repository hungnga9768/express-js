const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // ✅ OPTIMIZED: Cấu hình Gmail SMTP với connection pooling
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true, // Enable connection pooling
      maxConnections: 5, // Maximum number of connections
      maxMessages: 100, // Maximum number of messages per connection
      auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
      }
    });

    // ✅ OPTIMIZED: Email template cache
    this.templateCache = new Map();
    
    // ✅ OPTIMIZED: Rate limiting for email sending
    this.emailQueue = [];
    this.isProcessing = false;
    this.maxEmailsPerMinute = 10; // Gmail limit
  }

  // ✅ OPTIMIZED: Gửi email reset password với queue
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
      
      // ✅ OPTIMIZED: Cache template để tăng performance
      const templateKey = 'password-reset';
      let htmlTemplate = this.templateCache.get(templateKey);
      
      if (!htmlTemplate) {
        htmlTemplate = this.getPasswordResetEmailTemplate(resetUrl);
        this.templateCache.set(templateKey, htmlTemplate);
      } else {
        // Replace URL in cached template
        htmlTemplate = htmlTemplate.replace(/href="[^"]*"/, `href="${resetUrl}"`);
      }

      const mailOptions = {
        from: `"Học Tiếng Trung" <${process.env.GMAIL_USER || 'your-email@gmail.com'}>`,
        to: email,
        subject: 'Đặt lại mật khẩu - Học Tiếng Trung',
        html: htmlTemplate,
        // ✅ OPTIMIZED: Add tracking headers
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'X-Mailer': 'HocTiengTrung-ResetPassword/1.0'
        }
      };

      // ✅ OPTIMIZED: Add to queue để tránh spam
      return await this.addToEmailQueue(mailOptions);
    } catch (error) {
      console.error('❌ Error in sendPasswordResetEmail:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ OPTIMIZED: Email queue system
  async addToEmailQueue(mailOptions) {
    return new Promise((resolve, reject) => {
      this.emailQueue.push({
        mailOptions,
        resolve,
        reject,
        timestamp: Date.now()
      });

      if (!this.isProcessing) {
        this.processEmailQueue();
      }
    });
  }

  async processEmailQueue() {
    if (this.isProcessing || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    let emailsSent = 0;
    const startTime = Date.now();

    while (this.emailQueue.length > 0 && emailsSent < this.maxEmailsPerMinute) {
      const emailItem = this.emailQueue.shift();
      
      try {
        const result = await this.transporter.sendMail(emailItem.mailOptions);
        console.log(`✅ [${new Date().toISOString()}] Email sent: ${emailItem.mailOptions.to} (${result.messageId})`);
        emailItem.resolve({ success: true, messageId: result.messageId });
        emailsSent++;
      } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] Email failed: ${emailItem.mailOptions.to}`, error);
        emailItem.reject({ success: false, error: error.message });
      }

      // ✅ OPTIMIZED: Rate limiting - wait 6 seconds between emails
      if (this.emailQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }

    this.isProcessing = false;
    const duration = Date.now() - startTime;
    console.log(`📧 [${new Date().toISOString()}] Email queue processed: ${emailsSent} emails in ${duration}ms`);

    // Process remaining emails after 1 minute
    if (this.emailQueue.length > 0) {
      setTimeout(() => this.processEmailQueue(), 60000);
    }
  }

  // Template email reset password
  getPasswordResetEmailTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Đặt lại mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #4CAF50; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Học Tiếng Trung</h1>
          </div>
          <div class="content">
            <h2>Đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản học tiếng Trung của mình.</p>
            <p>Click vào nút bên dưới để đặt mật khẩu mới:</p>
            <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>Link này sẽ hết hạn sau <strong>1 giờ</strong></li>
              <li>Link chỉ có thể sử dụng <strong>1 lần</strong></li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này</li>
            </ul>
            <p>Nếu nút không hoạt động, bạn có thể copy và paste link này vào trình duyệt:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Học Tiếng Trung</p>
            <p>Vui lòng không trả lời email này</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Test kết nối Gmail SMTP
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Kết nối Gmail SMTP thành công!');
      return true;
    } catch (error) {
      console.error('❌ Lỗi kết nối Gmail SMTP:', error);
      return false;
    }
  }
}

module.exports = new EmailService();

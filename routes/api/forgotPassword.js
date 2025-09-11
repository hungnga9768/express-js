const express = require('express');
const router = express.Router();
const User = require('../../app/models/user');
const emailService = require('../../app/services/emailService');
const { loginLimiter } = require('../../middlewares/rateLimit');

// ==================== OPTIMIZED FORGOT PASSWORD API ====================

// POST /api/auth/forgot-password - Gửi email reset password
router.post('/forgot-password', loginLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`📧 [${new Date().toISOString()}] Forgot password request from IP: ${req.ip}`);
    
    const { email } = req.body;

    // ✅ OPTIMIZED VALIDATION
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    // ✅ OPTIMIZED EMAIL VALIDATION
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ✅ OPTIMIZED: Tạo reset token với error handling
    const result = await User.createPasswordResetToken(normalizedEmail);
    
    if (!result.success) {
      // ✅ SECURITY: Không tiết lộ email có tồn tại hay không
      console.log(`⚠️  [${new Date().toISOString()}] Email not found: ${normalizedEmail}`);
      return res.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
      });
    }

    // ✅ OPTIMIZED: Gửi email với timeout
    console.log(`📤 [${new Date().toISOString()}] Sending reset email to: ${normalizedEmail}`);
    
    const emailPromise = emailService.sendPasswordResetEmail(normalizedEmail, result.token);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), 10000)
    );
    
    const emailResult = await Promise.race([emailPromise, timeoutPromise]);
    
    if (!emailResult.success) {
      console.error(`❌ [${new Date().toISOString()}] Failed to send reset email:`, emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Reset email sent successfully to: ${normalizedEmail} (${duration}ms)`);
    
    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Error in forgot-password (${duration}ms):`, error);
    
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau'
    });
  }
});

// GET /api/auth/reset-password/:token - Kiểm tra token hợp lệ
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // ✅ OPTIMIZED VALIDATION
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // ✅ OPTIMIZED: Xác thực token
    const validation = await User.validatePasswordResetToken(token);
    
    if (!validation.success) {
      console.log(`⚠️  [${new Date().toISOString()}] Invalid token: ${token.substring(0, 10)}...`);
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    console.log(`✅ [${new Date().toISOString()}] Token validated for: ${validation.email}`);
    
    res.json({
      success: true,
      message: 'Token hợp lệ',
      email: validation.email,
      username: validation.user.username
    });

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error validating reset token:`, error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xác thực token'
    });
  }
});

// POST /api/auth/reset-password - Đặt mật khẩu mới
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // ✅ OPTIMIZED VALIDATION
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả các trường đều bắt buộc'
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }

    // ✅ SECURITY: Kiểm tra mật khẩu mạnh
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
      });
    }

    // ✅ OPTIMIZED: Cập nhật mật khẩu
    const result = await User.updatePasswordByToken(token, newPassword);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    console.log(`✅ [${new Date().toISOString()}] Password reset successful for token: ${token.substring(0, 10)}...`);

    res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.'
    });

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error resetting password:`, error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đặt lại mật khẩu'
    });
  }
});

module.exports = router;
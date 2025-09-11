// Cấu hình lệnh thao tác database khi thực hiện xóa token reset password hết hạn
const pool = require("../../connect-mysql"); // Sử dụng connection pool

/**
 * Xóa các token reset password hết hạn
 * @returns {Promise<number>} Số lượng token bị xóa
 */
async function deleteExpiredPasswordResetTokens() {
  try {
    console.log("🧹 [PasswordResetCleanupService] Bắt đầu dọn dẹp token hết hạn...");
    
    const deleteQuery = `
      DELETE FROM password_resets 
      WHERE expires_at < NOW()
      LIMIT 1000
    `;

    const [result] = await pool.query(deleteQuery);
    
    console.log(`✅ [PasswordResetCleanupService] Đã xóa ${result.affectedRows} token hết hạn`);
    return result.affectedRows;
  } catch (error) {
    console.error("❌ [PasswordResetCleanupService] Lỗi khi xóa token hết hạn:", error);
    throw error;
  }
}

/**
 * Lấy thống kê token reset password
 * @returns {Promise<Object>} Thống kê token
 */
async function getPasswordResetTokenStats() {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_tokens,
        COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_tokens,
        COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as tokens_last_hour,
        COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as tokens_last_day
      FROM password_resets
    `;

    const [rows] = await pool.query(statsQuery);
    
    const stats = rows[0];
    console.log(`📊 [PasswordResetCleanupService] Thống kê token:`, {
      total: stats.total_tokens,
      active: stats.active_tokens,
      expired: stats.expired_tokens,
      lastHour: stats.tokens_last_hour,
      lastDay: stats.tokens_last_day
    });
    
    return stats;
  } catch (error) {
    console.error("❌ [PasswordResetCleanupService] Lỗi khi lấy thống kê:", error);
    throw error;
  }
}

/**
 * Dọn dẹp toàn bộ token reset password (chỉ dùng khi cần thiết)
 * @returns {Promise<number>} Số lượng token bị xóa
 */
async function cleanupAllPasswordResetTokens() {
  try {
    console.log("🧹 [PasswordResetCleanupService] Bắt đầu dọn dẹp TẤT CẢ token...");
    
    const deleteQuery = `DELETE FROM password_resets`;
    const [result] = await pool.query(deleteQuery);
    
    console.log(`✅ [PasswordResetCleanupService] Đã xóa TẤT CẢ ${result.affectedRows} token`);
    return result.affectedRows;
  } catch (error) {
    console.error("❌ [PasswordResetCleanupService] Lỗi khi xóa tất cả token:", error);
    throw error;
  }
}

/**
 * Kiểm tra và dọn dẹp token nếu cần thiết
 * @param {number} threshold - Ngưỡng số lượng token hết hạn để trigger cleanup
 * @returns {Promise<Object>} Kết quả cleanup
 */
async function checkAndCleanupTokens(threshold = 50) {
  try {
    const stats = await getPasswordResetTokenStats();
    
    if (stats.expired_tokens >= threshold) {
      console.log(`⚠️  [PasswordResetCleanupService] Phát hiện ${stats.expired_tokens} token hết hạn (>= ${threshold}), bắt đầu cleanup...`);
      const deletedCount = await deleteExpiredPasswordResetTokens();
      
      return {
        triggered: true,
        deletedCount: deletedCount,
        remainingExpired: stats.expired_tokens - deletedCount,
        stats: stats
      };
    } else {
      console.log(`✅ [PasswordResetCleanupService] Chỉ có ${stats.expired_tokens} token hết hạn (< ${threshold}), không cần cleanup`);
      
      return {
        triggered: false,
        deletedCount: 0,
        remainingExpired: stats.expired_tokens,
        stats: stats
      };
    }
  } catch (error) {
    console.error("❌ [PasswordResetCleanupService] Lỗi trong checkAndCleanupTokens:", error);
    throw error;
  }
}

module.exports = {
  deleteExpiredPasswordResetTokens,
  getPasswordResetTokenStats,
  cleanupAllPasswordResetTokens,
  checkAndCleanupTokens
};

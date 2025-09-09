// Cấu hình lệnh thao tác database khi thực hiện xóa dữ liệu tin nhắn quá hạn
const pool = require("../../connect-mysql"); // Sử dụng connection pool

/**
 * Xóa các phiên chat cũ (quá 15 ngày không hoạt động)
 * @returns {Promise<number>} Số lượng record bị xóa
 */
async function deleteOldChatSessions() {
  try {
    console.log("🧹 [ChatCleanupService] Bắt đầu dọn dẹp phiên chat cũ...");
    
    const deleteQuery = `
      DELETE FROM web_hoctiengtrung.chat_history
      WHERE session_id IN (
        SELECT session_id
        FROM (
          SELECT ch.session_id
          FROM web_hoctiengtrung.chat_history ch
          GROUP BY ch.session_id
          HAVING MAX(ch.\`timestamp\`) < (NOW() - INTERVAL 15 DAY)
        ) AS inactive_sessions_list
      );
    `;

    const [result] = await pool.query(deleteQuery);
    
    console.log(`✅ [ChatCleanupService] Đã xóa ${result.affectedRows} phiên chat cũ`);
    return result.affectedRows;
  } catch (error) {
    console.error("❌ [ChatCleanupService] Lỗi khi xóa phiên chat cũ:", error);
    throw error; // Re-throw để caller có thể xử lý
  }
}

/**
 * Kiểm tra số lượng phiên chat cũ (quá 15 ngày)
 * @returns {Promise<number>} Số lượng phiên chat cũ
 */
async function getOldChatSessionsCount() {
  try {
    const countQuery = `
      SELECT COUNT(DISTINCT ch.session_id) as old_sessions_count
      FROM web_hoctiengtrung.chat_history ch
      GROUP BY ch.session_id
      HAVING MAX(ch.\`timestamp\`) < (NOW() - INTERVAL 15 DAY)
    `;
    
    const [rows] = await pool.query(countQuery);
    return rows.length; // Số lượng session cũ
  } catch (error) {
    console.error("❌ [ChatCleanupService] Lỗi khi đếm phiên chat cũ:", error);
    throw error;
  }
}

/**
 * Lấy thống kê về phiên chat
 * @returns {Promise<Object>} Thống kê chi tiết
 */
async function getChatStatistics() {
  try {
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages,
        MIN(\`timestamp\`) as oldest_message,
        MAX(\`timestamp\`) as newest_message
      FROM web_hoctiengtrung.chat_history
    `;
    
    const [rows] = await pool.query(statsQuery);
    return rows[0];
  } catch (error) {
    console.error("❌ [ChatCleanupService] Lỗi khi lấy thống kê chat:", error);
    throw error;
  }
}

/**
 * Thực hiện dọn dẹp manual (cho testing)
 * @returns {Promise<Object>} Kết quả dọn dẹp
 */
async function performManualCleanup() {
  try {
    console.log("🧹 [ChatCleanupService] Bắt đầu dọn dẹp manual...");
    
    // Lấy thống kê trước khi dọn dẹp
    const statsBefore = await getChatStatistics();
    console.log("📊 [ChatCleanupService] Thống kê trước dọn dẹp:", statsBefore);
    
    // Thực hiện xóa
    const deletedCount = await deleteOldChatSessions();
    
    // Lấy thống kê sau khi dọn dẹp
    const statsAfter = await getChatStatistics();
    console.log("📊 [ChatCleanupService] Thống kê sau dọn dẹp:", statsAfter);
    
    return {
      deletedCount,
      statsBefore,
      statsAfter,
      success: true
    };
  } catch (error) {
    console.error("❌ [ChatCleanupService] Lỗi trong dọn dẹp manual:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  deleteOldChatSessions,
  getOldChatSessionsCount,
  getChatStatistics,
  performManualCleanup,
};

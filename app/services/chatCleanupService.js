//cấu hình lệnh thao tác database khi thực hiện xóa dữ liệu tin nhắn quá hạn
const db = require("../../connect-mysql"); // Đảm bảo đường dẫn đúng
const util = require("util");
const query = util.promisify(db.query).bind(db);
async function deleteOldChatSessions() {
  try {
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

    const result = await query(deleteQuery);
    console.log(
      `[ChatCleanupService] Đã xóa ${result.affectedRows} bản ghi cũ.`
    );
  } catch (error) {
    console.error("[ChatCleanupService] Lỗi khi xóa phiên chat cũ:", error);
  }
}

module.exports = {
  deleteOldChatSessions,
};

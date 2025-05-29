// backend/models/chatHistoryModel.js
const db = require("../../connect-mysql"); // Đường dẫn đến file kết nối DB của bạn
const util = require("util");
const query = util.promisify(db.query).bind(db);
class ChatHistoryModel {
  /**
   * Lưu một tin nhắn vào lịch sử chat.
   * @param {Object} data - Đối tượng chứa thông tin tin nhắn.
   * @param {number} data.userId - ID của người dùng.
   * @param {string} data.sessionId - ID của phiên chat.
   * @param {string} data.role - Vai trò ('user', 'model' hoặc 'system').
   * @param {string} data.content - Nội dung tin nhắn.
   * @returns {Promise<Object>} - Thông tin về bản ghi đã chèn.
   */
  static async saveMessage(data) {
    try {
      const { userId, sessionId, role, content, topicInternalName } = data;
      const result = await query(
        "INSERT INTO chat_history (user_id, session_id, role, content, topic_internal_name) VALUES (?, ?, ?, ?, ?)",
        [userId, sessionId, role, content, topicInternalName]
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      /* ... */
    }
  }

  /**
   * Lấy lịch sử chat cho một phiên cụ thể, định dạng theo yêu cầu của Gemini API.
   * @param {string} sessionId - ID của phiên chat.
   * @returns {Promise<Array>} - Mảng các đối tượng { role, parts: [{ text: content }] }.
   */
  static async getHistoryBySessionId(sessionId) {
    try {
      const rows = await query(
        "SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC",
        [sessionId]
      );
      // Chuyển đổi định dạng cho phù hợp với Gemini API history
      return rows.map((row) => ({
        role: row.role,
        parts: [{ text: row.content }],
      }));
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử chat theo Session ID:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả các phiên chat của một người dùng.
   * @param {number} userId - ID của người dùng.
   * @returns {Promise<Array>} - Mảng các phiên chat (distinct sessionId).
   */
  static async getSessionsByUserId(userId) {
    try {
      const rows = await query(
        `SELECT
                    ch.session_id,
                    ch.content AS last_message,
                    ch.timestamp AS last_message_timestamp,
                    ch.topic_internal_name,
                    -- Subquery để lấy tên chủ đề từ bảng chat_topics dựa trên topic_internal_name
                    (SELECT name FROM chat_topics WHERE internal_name = ch.topic_internal_name LIMIT 1) AS topic_name
                FROM chat_history ch
                JOIN (
                    SELECT session_id, MAX(timestamp) AS max_timestamp
                    FROM chat_history
                    WHERE user_id = ?
                    GROUP BY session_id
                ) AS latest_messages
                ON ch.session_id = latest_messages.session_id
                AND ch.timestamp = latest_messages.max_timestamp
                WHERE ch.user_id = ?
                ORDER BY ch.timestamp DESC`,
        [userId, userId]
      );

      // Đảm bảo rows luôn là một mảng, ngay cả khi truy vấn không trả về gì
      if (!rows || rows.length === 0) {
        return []; // Trả về mảng rỗng nếu không có kết quả
      }

      const sessions = rows.map((row) => ({
        sessionId: row.session_id,
        topicName: row.topic_name || "Gia sư AI",
        internal_name: row.topic_internal_name || "default_topic",
        lastMessage: row.last_message || "Bắt đầu cuộc trò chuyện",
        timestamp: row.last_message_timestamp,
      }));

      return sessions;
    } catch (error) {
      console.error("Lỗi khi lấy các phiên chat của người dùng:", error);
      // Quan trọng: Ném lỗi để controller có thể bắt và xử lý.
      // Nếu bạn không ném lỗi ở đây, hàm sẽ kết thúc và trả về undefined.
      throw error;
    }
  }
  // Các hàm khác như deleteHistoryBySessionId, deleteHistoryByUserId...
}

module.exports = ChatHistoryModel;

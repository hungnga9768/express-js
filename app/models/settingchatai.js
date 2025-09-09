const pool = require("../../connect-mysql");

module.exports = {
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM chat_topics";
    if (search && search.trim()) sql += " WHERE name LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  
  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM chat_topics";
    if (search && search.trim()) {
      sql += " WHERE name LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  //  Lấy chi tiết theo ID
  async getById(id) {
    const [result] = await pool.query("SELECT * FROM chat_topics WHERE id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },

  async findByInternalName(internalName) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM chat_topics WHERE internal_name = ?",
        [internalName]
      );
      return rows[0] || null; // Trả về chủ đề đầu tiên tìm thấy hoặc null
    } catch (error) {
      console.error("Lỗi khi tìm chủ đề theo internal_name:", error);
      throw error;
    }
  },

  //  Thêm chủ đề chat mới
  async create(chat) {
    const sql = `
      INSERT INTO chat_topics (name, internal_name, initial_prompt, description, avatar_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      chat.name,
      chat.internal_name,
      chat.initial_prompt,
      chat.description,
      chat.avatar_url,
      chat.is_active,
    ];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },

  //  Cập nhật chủ đề chat
  async update(id, data) {
    const sql = "UPDATE chat_topics SET ? WHERE id = ?";
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa chủ đề chat
  async delete(id) {
    const [result] = await pool.query("DELETE FROM chat_topics WHERE id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      "SELECT * FROM chat_topics WHERE name = ? AND id != ?",
      [title, id]
    );
    return result.length > 0;
  },
};

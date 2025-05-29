const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);
module.exports = {
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM chat_topics";
    if (search) sql += ` WHERE name LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },
  //  Lấy tổng số dòng (dùng để phân trang)

  async getById(id) {
    const result = await query("SELECT * FROM chat_topics WHERE id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },
  async findByInternalName(internalName) {
    try {
      const rows = await query(
        "SELECT * FROM chat_topics WHERE internal_name = ?",
        [internalName]
      );
      return rows[0] || null; // Trả về chủ đề đầu tiên tìm thấy hoặc null
    } catch (error) {
      console.error("Lỗi khi tìm chủ đề theo internal_name:", error);
      throw error;
    }
  },
  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM chat_topics";
    if (search) sql += ` WHERE name LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  //  Thêm khóa học mới
  async create(chat) {
    const sql = `
      INSERT INTO banners (title, description, image_url, link_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      chat.name,
      chat.internal_name,
      chat.initial_prompt,
      chat.description,
      chat.is_active,
    ];
    return await query(sql, values);
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE chat_topics SET ? WHERE id = ?`;
    return await query(sql, [data, id]);
  },

  // Xóa khóa học
  async delete(id) {
    return await query("DELETE FROM banners WHERE id = ?", [id]);
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const result = await query(
      `SELECT * FROM chat_topics WHERE name = ? AND id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};

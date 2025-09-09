const pool = require("../../connect-mysql");

module.exports = {
  async getDs() {
    let sql = "SELECT * FROM banners";
    const [rows] = await pool.query(sql);
    return rows;
  },

  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM banners";
    if (search && search.trim()) sql += " WHERE title LIKE ?"; // nếu có từ khóa
    
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
    let sql = "SELECT COUNT(*) AS totalRow FROM banners";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  //  Lấy chi tiết 1 khóa học theo ID
  async getById(id) {
    const [result] = await pool.query("SELECT * FROM banners WHERE id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
  async create(banner) {
    const sql = `
      INSERT INTO banners (title, description, image_url, link_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      banner.title,
      banner.description,
      banner.image_url,
      banner.link_url,
      banner.display_order,
      banner.is_active,
    ];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE banners SET ? WHERE id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa khóa học
  async delete(id) {
    const [result] = await pool.query("DELETE FROM banners WHERE id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      `SELECT * FROM banners WHERE title = ? AND id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};

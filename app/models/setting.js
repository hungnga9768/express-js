const pool = require("../../connect-mysql");

module.exports = {
  /// bảng setting
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM settings";
    if (search && search.trim()) sql += " WHERE note LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM settings";
    if (search && search.trim()) {
      sql += " WHERE note LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },
  async getById(id) {
    const [result] = await pool.query("SELECT * FROM settings  WHERE id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },
  async getcontent(key) {
    const [result] = await pool.query("SELECT * FROM settings  WHERE `key` = ?", [key]);
    return result[0]; // trả về 1 object duy nhất
  },
  async update(id, data) {
    const sql = `UPDATE settings SET ? WHERE id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows;
  },
};

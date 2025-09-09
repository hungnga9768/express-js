// Kết nối MySQL
const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến Courses
module.exports = {
  async getDs() {
    let sql = "SELECT * FROM chinese_documents";
    const [rows] = await pool.query(sql);
    return rows;
  },
  //  Lấy danh sách khóa học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM chinese_documents";
    if (search && search.trim()) sql += " WHERE title LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY document_id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM chinese_documents";
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
    const [result] = await pool.query(
      "SELECT * FROM chinese_documents WHERE document_id = ?",
      [id]
    );
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
  async create(doc) {
    const sql = `
      INSERT INTO chinese_documents (title, description, content_type, content_url, difficulty_level, hsk_level, category, word_count,duration,thumbnail_url,is_free,price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      doc.title,
      doc.description,
      doc.content_type,
      doc.content_url,
      doc.difficulty_level,
      doc.hsk_level,
      doc.category,
      doc.word_count,
      doc.duration,
      doc.thumbnail_url,
      doc.is_free,
      doc.price,
    ];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE chinese_documents SET ? WHERE document_id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa khóa học
  async delete(id) {
    const [result] = await pool.query("DELETE FROM chinese_documents WHERE document_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      `SELECT * FROM chinese_documents WHERE title = ? AND document_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};

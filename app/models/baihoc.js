// Kết nối MySQL
const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến bài học
module.exports = {
  // Lấy danh sách bài học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM lessons";
    if (search && search.trim()) sql += " WHERE title LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY lesson_id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  
  // Lấy danh sách bài học (có thể có tìm kiếm)
  async getDs(search) {
    let sql = "SELECT * FROM lessons";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?";
      const [rows] = await pool.query(sql, [`%${search.trim()}%`]);
      return rows;
    }
    const [rows] = await pool.query(sql);
    return rows;
  },

  // Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM lessons";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  // Lấy chi tiết 1 bài học theo ID
  async getById(id) {
    const [result] = await pool.query("SELECT * FROM lessons WHERE lesson_id = ?", [
      id,
    ]);
    return result[0]; // trả về 1 object duy nhất
  },

  // Lấy danh sách bài học theo course_id
  async getcourseId(id) {
    const [rows] = await pool.query("SELECT * FROM lessons WHERE course_id = ?", [
      id,
    ]);
    return rows; // trả về 1 mảng
  },

  // Thêm bài học mới
  async create(lesson) {
    const sql = `
      INSERT INTO lessons (course_id, title, description, content_type,content_url, duration, display_order, is_preview,module_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      lesson.course_id,
      lesson.title,
      lesson.description,
      lesson.content_type,
      lesson.content_url,
      lesson.duration,
      lesson.display_order,
      lesson.is_preview,
      lesson.module_order,
    ];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },

  // Cập nhật bài học
  async update(id, data) {
    const sql = `UPDATE lessons SET ? WHERE lesson_id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa bài học
  async delete(id) {
    const [result] = await pool.query("DELETE FROM lessons WHERE lesson_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      `SELECT * FROM lessons WHERE title = ? AND lesson_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};

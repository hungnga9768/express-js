// Kết nối MySQL
const db = require("../../connect-mysql");

// Dùng util để hỗ trợ async/await cho truy vấn
const util = require("util");
const query = util.promisify(db.query).bind(db);

// Export object chứa các hàm xử lý database liên quan đến Courses
module.exports = {
  //  Lấy danh sách khóa học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM lessons";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY lesson_id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },
  async getDs(search) {
    let sql = "SELECT * FROM lessons";
    if (search) sql += ` WHERE title LIKE '%${search}%'`;
    return await query(sql);
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM lessons";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  //  Lấy chi tiết 1 khóa học theo ID
  async getById(id) {
    const result = await query("SELECT * FROM lessons WHERE lesson_id = ?", [
      id,
    ]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
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
    return await query(sql, values);
  },

  //  Cập nhật bài học
  async update(id, data) {
    const sql = `UPDATE lessons SET ? WHERE lesson_id = ?`;
    return await query(sql, [data, id]);
  },

  // Xóa khóa học
  async delete(id) {
    return await query("DELETE FROM lessons WHERE lesson_id = ?", [id]);
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const result = await query(
      `SELECT * FROM lessons WHERE title = ? AND lesson_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};

// Kết nối MySQL
const db = require("../../connect-mysql");

// Dùng util để hỗ trợ async/await cho truy vấn
const util = require("util");
const query = util.promisify(db.query).bind(db);

// Export object chứa các hàm xử lý database liên quan đến courses
module.exports = {
  async getDs() {
    let sql = "SELECT * FROM courses";
    return await query(sql);
  },
  //  Lấy danh sách khóa học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM courses";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY course_id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM courses";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  //  Lấy chi tiết 1 khóa học theo ID
  async getById(id) {
    const result = await query("SELECT * FROM courses WHERE course_id = ?", [
      id,
    ]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
  async create(course) {
    const sql = `
      INSERT INTO courses (title, description, thumbnail_url, difficulty_level, estimated_duration, is_free, price, instructor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      course.title,
      course.description,
      course.thumbnail_url,
      course.difficulty_level,
      course.estimated_duration,
      course.is_free,
      course.price,
      course.instructor_id,
    ];
    return await query(sql, values);
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE courses SET ? WHERE course_id = ?`;
    return await query(sql, [data, id]);
  },

  // Xóa khóa học
  async delete(id) {
    return await query("DELETE FROM courses WHERE course_id = ?", [id]);
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const result = await query(
      `SELECT * FROM courses WHERE title = ? AND course_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};

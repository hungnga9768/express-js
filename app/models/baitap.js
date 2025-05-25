// Kết nối MySQL
const db = require("../../connect-mysql");

// Dùng util để hỗ trợ async/await cho truy vấn
const util = require("util");
const query = util.promisify(db.query).bind(db);

// Export object chứa các hàm xử lý database liên quan đến Courses
module.exports = {
  //  Lấy danh sách khóa học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM exercisesets";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY exercise_set_id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },
  async getDs(search) {
    let sql = "SELECT * FROM exercisesets";
    if (search) sql += ` WHERE title LIKE '%${search}%'`;
    return await query(sql);
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM exercisesets";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  //  Lấy chi tiết bai tap ID
  async getById(id) {
    const result = await query(
      "SELECT * FROM exercisesets WHERE exercise_set_id = ?",
      [id]
    );
    return result[0]; // trả về 1 object duy nhất
  },
  //  Thêm bai tap
  async create(baitap) {
    const sql = `
      INSERT INTO exercisesets (lesson_id, title, description) VALUES (?, ?, ?)
    `;
    const values = [baitap.lesson_id, baitap.title, baitap.description];
    return await query(sql, values);
  },
  //them bai tap
  async createcauhoi(cauhoi) {
    const sql = `
      INSERT INTO exercises (exercise_set_id, exercise_type, question,options,correct_answer,explanation) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      cauhoi.exercise_set_id,
      cauhoi.exercise_type,
      cauhoi.question,
      cauhoi.options,
      cauhoi.correct_answer,
      cauhoi.explanation,
    ];
    return await query(sql, values);
  },
  //  Cập nhật bài tap
  async update(id, data) {
    const sql = `UPDATE exercisesets SET ? WHERE exercise_set_id = ?`;
    return await query(sql, [data, id]);
  },

  // Xóa bai tap
  async delete(id) {
    return await query("DELETE FROM exercisesets WHERE exercise_set_id = ?", [
      id,
    ]);
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const result = await query(
      `SELECT * FROM exercisesets WHERE title = ? AND exercise_set_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
  async getDscauhoi(search) {
    const result = await query(
      "SELECT * FROM exercises WHERE exercise_set_id = ?",
      [search]
    );
    return result;
  },
  async getIdcauhoi(search) {
    const result = await query(
      "SELECT * FROM exercises WHERE exercise_id = ?",
      [search]
    );
    return result[0];
  },
  async deletecauhoi(id) {
    return await query("DELETE FROM exercises WHERE exercise_id = ?", [id]);
  },
  async getexercisesetsWithQuestions() {
    const sql = `
      SELECT 
        es.exercise_set_id,
        es.lesson_id,
        es.title,
        es.description,
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation
      FROM exercisesets es
      LEFT JOIN exercises e ON es.exercise_set_id = e.exercise_set_id
      ORDER BY es.exercise_set_id, e.exercise_id
    `;
    return await query(sql);
  },
};

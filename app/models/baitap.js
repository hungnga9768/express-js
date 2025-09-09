// Kết nối MySQL
const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến bài tập
module.exports = {
  // Lấy danh sách bài tập (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM exercisesets";
    if (search && search.trim()) sql += " WHERE title LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY exercise_set_id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  
  // Lấy danh sách bài tập (có thể có tìm kiếm)
  async getDs(search) {
    let sql = "SELECT * FROM exercisesets";
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
    let sql = "SELECT COUNT(*) AS totalRow FROM exercisesets";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  // Lấy chi tiết bài tập theo ID
  async getById(id) {
    const [result] = await pool.query(
      "SELECT * FROM exercisesets WHERE exercise_set_id = ?",
      [id]
    );
    return result[0]; // trả về 1 object duy nhất
  },
  // Thêm bài tập mới
  async create(baitap) {
    const sql = `
      INSERT INTO exercisesets (lesson_id, title, description) VALUES (?, ?, ?)
    `;
    const values = [baitap.lesson_id, baitap.title, baitap.description];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },
  // Thêm câu hỏi cho bài tập
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
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },
  // Cập nhật bài tập
  async update(id, data) {
    const sql = `UPDATE exercisesets SET ? WHERE exercise_set_id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa bài tập
  async delete(id) {
    const [result] = await pool.query("DELETE FROM exercisesets WHERE exercise_set_id = ?", [
      id,
    ]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      `SELECT * FROM exercisesets WHERE title = ? AND exercise_set_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
  async getDscauhoi(search) {
    const [rows] = await pool.query(
      "SELECT * FROM exercises WHERE exercise_set_id = ?",
      [search]
    );
    return rows;
  },
  async getIdcauhoi(search) {
    const [rows] = await pool.query(
      "SELECT * FROM exercises WHERE exercise_id = ?",
      [search]
    );
    return rows[0];
  },
  async deletecauhoi(id) {
    const [result] = await pool.query("DELETE FROM exercises WHERE exercise_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },
  // Lấy bài tập kèm câu hỏi theo ID
  async getWithQuestions(exerciseSetId) {
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
      WHERE es.exercise_set_id = ?
      ORDER BY e.exercise_id
    `;
    const [rows] = await pool.query(sql, [exerciseSetId]);
    return rows;
  },

  // Lấy bài tập kèm câu hỏi theo bài học
  async getByLesson(lessonId) {
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
      WHERE es.lesson_id = ?
      ORDER BY es.exercise_set_id, e.exercise_id
    `;
    const [rows] = await pool.query(sql, [lessonId]);
    return rows;
  },

  // Lấy bài tập ngẫu nhiên
  async getRandomExercises(limit = 10, hskLevel = null) {
    let sql = `
      SELECT 
        es.exercise_set_id,
        es.lesson_id,
        es.title,
        es.description
      FROM exercisesets es
    `;
    
    if (hskLevel) {
      sql += ` WHERE es.hsk_level = ?`;
      sql += ` ORDER BY RAND() LIMIT ?`;
      const [rows] = await pool.query(sql, [hskLevel, limit]);
      return rows;
    } else {
      sql += ` ORDER BY RAND() LIMIT ?`;
      const [rows] = await pool.query(sql, [limit]);
      return rows;
    }
  },

  // Kiểm tra đáp án của câu hỏi
  async checkAnswer(exerciseId, userAnswer) {
    const sql = `
      SELECT 
        exercise_id,
        exercise_type,
        question,
        options,
        correct_answer,
        explanation
      FROM exercises 
      WHERE exercise_id = ?
    `;
    
    const [rows] = await pool.query(sql, [exerciseId]);
    
    if (rows.length === 0) {
      return {
        isCorrect: false,
        message: "Không tìm thấy câu hỏi",
        correctAnswer: null,
        explanation: null
      };
    }

    const question = rows[0];
    const isCorrect = userAnswer.trim().toUpperCase() === question.correct_answer.trim().toUpperCase();
    
    return {
      isCorrect,
      message: isCorrect ? "Đáp án chính xác!" : "Đáp án không chính xác",
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      question: question.question,
      options: question.options
    };
  },

  // Lấy thống kê bài tập
  async getStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT es.exercise_set_id) as totalExerciseSets,
        COUNT(e.exercise_id) as totalQuestions,
        COUNT(DISTINCT es.lesson_id) as totalLessons
      FROM exercisesets es
      LEFT JOIN exercises e ON es.exercise_set_id = e.exercise_set_id
    `;
    
    const [rows] = await pool.query(sql);
    return rows[0];
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
    const [rows] = await pool.query(sql);
    return rows;
  },
};

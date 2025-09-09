const pool = require("../../connect-mysql");

module.exports = {
  // Raw query helper for flexible reads (read-only)
  async _raw(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getTests({ search, level, status, offset = 0, limit = 20 }) {
    let sql = "SELECT * FROM hsktests WHERE 1=1";
    const vals = [];
    if (level) {
      sql += " AND hsk_level = ?";
      vals.push(level);
    }
    if (typeof status !== 'undefined' && status !== null && status !== '') {
      sql += " AND status = ?";
      vals.push(status);
    }
    if (search) {
      sql += " AND (title LIKE ? OR description LIKE ?)";
      vals.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY test_id DESC LIMIT ?, ?";
    vals.push(offset, limit);
    const [rows] = await pool.query(sql, vals);
    return rows;
  },

  async getTestsTotal({ search, level, status }) {
    let sql = "SELECT COUNT(*) as total FROM hsktests WHERE 1=1";
    const vals = [];
    if (level) {
      sql += " AND hsk_level = ?";
      vals.push(level);
    }
    if (typeof status !== 'undefined' && status !== null && status !== '') {
      sql += " AND status = ?";
      vals.push(status);
    }
    if (search) {
      sql += " AND (title LIKE ? OR description LIKE ?)";
      vals.push(`%${search}%`, `%${search}%`);
    }
    const [r] = await pool.query(sql, vals);
    return r[0]?.total || 0;
  },

  async getTestById(id) {
    const [r] = await pool.query("SELECT * FROM hsktests WHERE test_id = ?", [id]);
    return r[0];
  },

  async createTest(data) {
    const sql = `
      INSERT INTO hsktests (hsk_level, title, description, total_questions, time_limit, passing_score, randomize_questions, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      data.hsk_level,
      data.title,
      data.description || null,
      data.total_questions || 0,
      data.time_limit || null,
      data.passing_score || 0,
      data.randomize_questions ? 1 : 0,
      data.status || 'draft',
      data.is_active ? 1 : 0,
    ];
    const [result] = await pool.query(sql, vals);
    return result.insertId; // Trả về ID của test vừa tạo
  },

  async updateTest(id, data) {
    const sql = "UPDATE hsktests SET ? WHERE test_id = ?";
    const [result] = await pool.query(sql, [data, id]);
    return result.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  async deleteTest(id) {
    const [result] = await pool.query("DELETE FROM hsktests WHERE test_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  async getQuestionsByTest(testId) {
    const sql = `
      SELECT question_id, test_id, skill_type, question_type, question_text, audio_url, image_url,
             options, correct_answer, explanation, difficulty_level, points, order_in_test,
             matching_pairs, ordering_items, rewrite_instruction
      FROM HSKQuestions
      WHERE test_id = ?
      ORDER BY order_in_test, question_id
    `;
    const [rows] = await pool.query(sql, [testId]);
    return rows.map((r) => {
      // Parse JSON fields robustly
      try {
        if (typeof r.options === 'string') {
          r.options = r.options ? JSON.parse(r.options) : [];
        } else if (r.options === null) {
          r.options = [];
        }
      } catch {
        r.options = [];
      }
      
      try {
        if (typeof r.matching_pairs === 'string') {
          r.matching_pairs = r.matching_pairs ? JSON.parse(r.matching_pairs) : [];
        } else if (r.matching_pairs === null) {
          r.matching_pairs = [];
        }
      } catch {
        r.matching_pairs = [];
      }
      
      try {
        if (typeof r.ordering_items === 'string') {
          r.ordering_items = r.ordering_items ? JSON.parse(r.ordering_items) : [];
        } else if (r.ordering_items === null) {
          r.ordering_items = [];
        }
      } catch {
        r.ordering_items = [];
      }
      
      return r;
    });
  },

  async getQuestionById(qid) {
    const [r] = await pool.query("SELECT * FROM HSKQuestions WHERE question_id = ?", [
      qid,
    ]);
    if (!r[0]) return null;
    
    // Parse JSON fields robustly
    try {
      if (typeof r[0].options === 'string') {
        r[0].options = r[0].options ? JSON.parse(r[0].options) : [];
      } else if (r[0].options === null) {
        r[0].options = [];
      }
    } catch {
      r[0].options = [];
    }
    
    try {
      if (typeof r[0].matching_pairs === 'string') {
        r[0].matching_pairs = r[0].matching_pairs ? JSON.parse(r[0].matching_pairs) : [];
      } else if (r[0].matching_pairs === null) {
        r[0].matching_pairs = [];
      }
    } catch {
      r[0].matching_pairs = [];
    }
    
    try {
      if (typeof r[0].ordering_items === 'string') {
        r[0].ordering_items = r[0].ordering_items ? JSON.parse(r[0].ordering_items) : [];
      } else if (r[0].ordering_items === null) {
        r[0].ordering_items = [];
      }
    } catch {
      r[0].ordering_items = [];
    }
    
    return r[0];
  },

     async createQuestion(testId, q) {
     const sql = `
       INSERT INTO HSKQuestions (
         test_id, skill_type, question_type, question_text, audio_url, image_url,
         options, correct_answer, explanation, difficulty_level, points, order_in_test,
         matching_pairs, ordering_items, rewrite_instruction
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     `;
     const vals = [
       testId, q.skill_type, q.question_type, q.question_text || null, q.audio_url || null, q.image_url || null,
       JSON.stringify(q.options), q.correct_answer || "", q.explanation || null, q.difficulty_level || "easy",
       q.points || 1, q.order_in_test || 0,
       q.matching_pairs ? JSON.stringify(q.matching_pairs) : null,
       q.ordering_items ? JSON.stringify(q.ordering_items) : null,
       q.rewrite_instruction || null
     ];
     const [result] = await pool.query(sql, vals);
     return result.insertId; // Trả về ID của question vừa tạo
   },

     async updateQuestion(qid, q) {
     const data = { ...q };
     if (Array.isArray(q.options)) data.options = JSON.stringify(q.options);
     if (Array.isArray(q.matching_pairs))
       data.matching_pairs = JSON.stringify(q.matching_pairs);
     if (Array.isArray(q.ordering_items))
       data.ordering_items = JSON.stringify(q.ordering_items);
     const [result] = await pool.query("UPDATE HSKQuestions SET ? WHERE question_id = ?", [
       data,
       qid,
     ]);
     return result.affectedRows; // Trả về số dòng bị ảnh hưởng
   },

  async deleteQuestion(qid) {
    const [result] = await pool.query("DELETE FROM HSKQuestions WHERE question_id = ?", [qid]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  async getQuestionCount(testId) {
    const [result] = await pool.query(
      "SELECT COUNT(*) as count FROM HSKQuestions WHERE test_id = ?",
      [testId]
    );
    return result[0]?.count || 0;
  },

  async getDashboardStats() {
    try {
      const [totalTests] = await pool.query("SELECT COUNT(*) as count FROM hsktests");
      const [totalQuestions] = await pool.query("SELECT COUNT(*) as count FROM HSKQuestions");
      const [activeTests] = await pool.query("SELECT COUNT(*) as count FROM hsktests WHERE is_active = 1");
      const [totalAttempts] = await pool.query("SELECT COUNT(*) as count FROM hskresults");
      
      const [hskLevels] = await pool.query(`
        SELECT hsk_level, COUNT(*) as count 
        FROM hsktests 
        GROUP BY hsk_level 
        ORDER BY hsk_level
      `);
      
      const [skillTypes] = await pool.query(`
        SELECT skill_type, COUNT(*) as count 
        FROM HSKQuestions 
        GROUP BY skill_type
      `);
      
      const [timeStats] = await pool.query(`
        SELECT 
          AVG(duration_seconds) as avg_duration,
          MIN(duration_seconds) as min_duration,
          MAX(duration_seconds) as max_duration
        FROM hskresults 
        WHERE duration_seconds > 0
      `);

      return {
        totalTests: totalTests[0]?.count || 0,
        totalQuestions: totalQuestions[0]?.count || 0,
        activeTests: activeTests[0]?.count || 0,
        totalAttempts: totalAttempts[0]?.count || 0,
        hskLevels: hskLevels || [],
        skillTypes: skillTypes || [],
        timeStats: timeStats[0] || {}
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        totalTests: 0,
        totalQuestions: 0,
        activeTests: 0,
        totalAttempts: 0,
        hskLevels: [],
        skillTypes: [],
        timeStats: {}
      };
    }
  },

  async getTestWithQuestions(testId) {
    const [test] = await pool.query(`
      SELECT * FROM hsktests WHERE test_id = ?
    `, [testId]);
    
    if (!test[0]) return null;
    
    const [questions] = await pool.query(`
      SELECT * FROM HSKQuestions 
      WHERE test_id = ? 
      ORDER BY order_in_test, question_id
    `, [testId]);
    
    return {
      ...test[0],
      questions: questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
        matching_pairs: q.matching_pairs ? JSON.parse(q.matching_pairs) : [],
        ordering_items: q.ordering_items ? JSON.parse(q.ordering_items) : []
      }))
    };
  },

  async getRandomQuestions(testId, count) {
    const [questions] = await pool.query(`
      SELECT * FROM HSKQuestions 
      WHERE test_id = ? 
      ORDER BY RAND() 
      LIMIT ?
    `, [testId, count]);
    
    return questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : [],
      matching_pairs: q.matching_pairs ? JSON.parse(q.matching_pairs) : [],
      ordering_items: q.ordering_items ? JSON.parse(q.ordering_items) : []
    }));
  },

  // HSK Results methods
  async createResult(data) {
    const sql = `
      INSERT INTO hskresults (user_id, test_id, total_questions, time_limit, status, started_at, 
                             listening_score, reading_score, writing_score, total_score, is_passed,
                             time_spent, attempt_date)
      VALUES (?, ?, ?, ?, ?, NOW(), 0, 0, 0, 0, 0, 0, NOW())
    `;
    const vals = [
      data.user_id,
      data.test_id,
      data.total_questions || 0,
      data.time_limit || 0,
      data.status || 'in_progress'
    ];
    const [result] = await pool.query(sql, vals);
    return result.insertId; // Trả về ID của result vừa tạo
  },

  async getResultById(resultId) {
    const sql = "SELECT * FROM hskresults WHERE result_id = ?";
    const [results] = await pool.query(sql, [resultId]);
    return results[0];
  },

  async updateResult(resultId, updateData) {
    const sql = "UPDATE hskresults SET ? WHERE result_id = ?";
    const [result] = await pool.query(sql, [updateData, resultId]);
    return result.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  async deleteResult(resultId) {
    const sql = "DELETE FROM hskresults WHERE result_id = ?";
    const [result] = await pool.query(sql, [resultId]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  async getUserResults(userId, options = {}) {
    let sql = `
      SELECT r.*, t.title as test_title, t.hsk_level
      FROM hskresults r
      JOIN hsktests t ON r.test_id = t.test_id
      WHERE r.user_id = ?
    `;
    const params = [userId];
    
    if (options.test_id) {
      sql += " AND r.test_id = ?";
      params.push(options.test_id);
    }
    
    if (options.status) {
      sql += " AND r.status = ?";
      params.push(options.status);
    }
    
    sql += " ORDER BY COALESCE(r.started_at, r.attempt_date) DESC, r.result_id DESC";
    
    if (options.limit) {
      sql += " LIMIT ?";
      params.push(options.limit);
    }
    
    const [results] = await pool.query(sql, params);
    return results;
  },

  async getUserStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_tests,
        SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) as passed_tests,
        AVG(total_score) as avg_score,
        MAX(total_score) as best_score,
        SUM(time_spent) as total_time_spent
      FROM hskresults 
      WHERE user_id = ? AND status = 'graded'
    `;
    const [results] = await pool.query(sql, [userId]);
    return results[0] || {
      total_tests: 0,
      passed_tests: 0,
      avg_score: 0,
      best_score: 0,
      total_time_spent: 0
    };
  },

  async getLeaderboard(level = null, limit = 10) {
    let sql = `
      SELECT 
        u.user_id,
        u.username,
        COUNT(r.result_id) as total_tests,
        AVG(r.total_score) as average_score,
        MAX(r.total_score) as best_score,
        SUM(CASE WHEN r.total_score >= 180 THEN 1 ELSE 0 END) as passed_tests
      FROM users u
      JOIN hskresults r ON u.user_id = r.user_id
    `;
    
    const vals = [];
    
    if (level) {
      sql += ' JOIN hsktests t ON r.test_id = t.test_id WHERE t.hsk_level = ?';
      vals.push(level);
    }
    
    sql += `
      GROUP BY u.user_id, u.username
      HAVING total_tests >= 1
      ORDER BY average_score DESC, total_tests DESC
      LIMIT ?
    `;
    vals.push(limit);
    
    const [results] = await pool.query(sql, vals);
    return results;
  },

  // Thống kê theo level
  async getUserLevelStats(userId) {
    const sql = `
      SELECT 
        t.hsk_level,
        COUNT(*) as completed_tests,
        AVG(r.total_score) as average_score,
        SUM(CASE WHEN r.total_score >= 180 THEN 1 ELSE 0 END) as passed_tests
      FROM hskresults r
      JOIN hsktests t ON r.test_id = t.test_id
      WHERE r.user_id = ?
      GROUP BY t.hsk_level
      ORDER BY t.hsk_level
    `;
    const [results] = await pool.query(sql, [userId]);
    return results;
  },

  // Hoàn thành test
  async completeTest(resultId, data) {
    const updateData = {
      status: 'graded',
      ended_at: new Date(),
      listening_score: data.listening_score || 0,
      reading_score: data.reading_score || 0,
      writing_score: data.writing_score || 0,
      total_score: data.total_score || 0,
      is_passed: data.is_passed ? 1 : 0,
      time_spent: data.time_spent || 0
    };
    
    const sql = "UPDATE hskresults SET ? WHERE result_id = ?";
    const [result] = await pool.query(sql, [updateData, resultId]);
    return result.affectedRows > 0;
  },

  // Tạo user answer
  async createUserAnswer(data) {
    const sql = `
      INSERT INTO hskuseranswers (result_id, question_id, user_answer, is_correct, score, 
                                 question_order, time_spent, feedback, graded_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const vals = [
      data.result_id,
      data.question_id,
      data.user_answer,
      data.is_correct ? 1 : 0,
      data.score || 0,
      data.question_order || 0,
      data.time_spent || 0,
      data.feedback || null
    ];
    const [result] = await pool.query(sql, vals);
    return result.insertId;
  },

  // Lấy user answers theo result
  async getUserAnswersByResult(resultId) {
    const sql = `
      SELECT ua.*, q.*
      FROM hskuseranswers ua
      JOIN HSKQuestions q ON ua.question_id = q.question_id
      WHERE ua.result_id = ?
      ORDER BY ua.question_order ASC, ua.created_at ASC
    `;
    const [results] = await pool.query(sql, [resultId]);
    return results;
  },

  // Sắp xếp lại thứ tự câu hỏi
  async reorderQuestions(testId, orders) {
    try {
      console.log(`🔄 Starting reorder for test ${testId} with ${orders.length} orders`);
      
      // Bắt đầu transaction
      await pool.query('START TRANSACTION');
      console.log('✅ Transaction started');
      
      // Cập nhật thứ tự cho từng câu hỏi
      for (const order of orders) {
        const sql = `
          UPDATE HSKQuestions 
          SET order_in_test = ? 
          WHERE question_id = ? AND test_id = ?
        `;
        const [result] = await pool.query(sql, [order.order_in_test, order.question_id, testId]);
        console.log(`📝 Updated question ${order.question_id} to order ${order.order_in_test}, affected rows: ${result.affectedRows}`);
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      console.log('✅ Transaction committed');
      
      console.log(`✅ Successfully reordered ${orders.length} questions for test ${testId}`);
      return true;
      
    } catch (error) {
      // Rollback nếu có lỗi
      await pool.query('ROLLBACK');
      console.error('❌ Error in reorderQuestions:', error);
      throw error;
    }
  }
};

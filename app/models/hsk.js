const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  // Raw query helper for flexible reads (read-only)
  async _raw(sql, params = []) {
    return await query(sql, params);
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
    return await query(sql, vals);
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
    const r = await query(sql, vals);
    return r[0]?.total || 0;
  },
  async getTestById(id) {
    const r = await query("SELECT * FROM hsktests WHERE test_id = ?", [id]);
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
    return await query(sql, vals);
  },
  async updateTest(id, data) {
    const sql = "UPDATE hsktests SET ? WHERE test_id = ?";
    return await query(sql, [data, id]);
  },
  async deleteTest(id) {
    return await query("DELETE FROM hsktests WHERE test_id = ?", [id]);
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
    const rows = await query(sql, [testId]);
    return rows.map((r) => {
      // Parse JSON fields robustly
      try {
        if (typeof r.options === 'string') {
          r.options = r.options ? JSON.parse(r.options) : [];
        }
      } catch {
        r.options = [];
      }
      
      try {
        if (typeof r.matching_pairs === 'string') {
          r.matching_pairs = r.matching_pairs ? JSON.parse(r.matching_pairs) : [];
        }
      } catch {
        r.matching_pairs = [];
      }
      
      try {
        if (typeof r.ordering_items === 'string') {
          r.ordering_items = r.ordering_items ? JSON.parse(r.ordering_items) : [];
        }
      } catch {
        r.ordering_items = [];
      }
      
      return r;
    });
  },
  async getQuestionById(qid) {
    const r = await query("SELECT * FROM HSKQuestions WHERE question_id = ?", [
      qid,
    ]);
    if (!r[0]) return null;
    
    // Parse JSON fields robustly
    try {
      if (typeof r[0].options === 'string') {
        r[0].options = r[0].options ? JSON.parse(r[0].options) : [];
      }
    } catch {
      r[0].options = [];
    }
    
    try {
      if (typeof r[0].matching_pairs === 'string') {
        r[0].matching_pairs = r[0].matching_pairs ? JSON.parse(r[0].matching_pairs) : [];
      }
    } catch {
      r[0].matching_pairs = [];
    }
    
    try {
      if (typeof r[0].ordering_items === 'string') {
        r[0].ordering_items = r[0].ordering_items ? JSON.parse(r[0].ordering_items) : [];
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
    return await query(sql, vals);
  },

  async updateQuestion(qid, q) {
    const data = { ...q };
    if (Array.isArray(q.options)) data.options = JSON.stringify(q.options);
    if (Array.isArray(q.matching_pairs))
      data.matching_pairs = JSON.stringify(q.matching_pairs);
    if (Array.isArray(q.ordering_items))
      data.ordering_items = JSON.stringify(q.ordering_items);
    return await query("UPDATE HSKQuestions SET ? WHERE question_id = ?", [
      data,
      qid,
    ]);
  },
  async deleteQuestion(qid) {
    return await query("DELETE FROM HSKQuestions WHERE question_id = ?", [qid]);
  },
  async reorderQuestions(testId, orders) {
    const updates = orders.map((o) =>
      query(
        "UPDATE HSKQuestions SET order_in_test = ? WHERE question_id = ? AND test_id = ?",
        [o.order_in_test, o.question_id, testId]
      )
    );
    await Promise.all(updates);
    return true;
  },

  // Thống kê dashboard
  async getDashboardStats() {
    try {
      // Tổng số đề thi
      const totalTests = await query("SELECT COUNT(*) as count FROM hsktests");
      
      // Tổng số câu hỏi
      const totalQuestions = await query("SELECT COUNT(*) as count FROM HSKQuestions");
      
      // Đề thi hoạt động
      const activeTests = await query("SELECT COUNT(*) as count FROM hsktests WHERE is_active = 1");
      
      // Tổng lượt thi (nếu có bảng kết quả)
      const totalAttempts = await query("SELECT COUNT(*) as count FROM hskresults");
      
      // Thống kê theo cấp độ HSK
      const hskLevels = await query(`
        SELECT hsk_level, COUNT(*) as count 
        FROM hsktests 
        GROUP BY hsk_level 
        ORDER BY hsk_level
      `);
      
      // Thống kê theo kỹ năng
      const skillTypes = await query(`
        SELECT skill_type, COUNT(*) as count 
        FROM HSKQuestions 
        GROUP BY skill_type
      `);
      
      // Thống kê theo thời gian (7 ngày gần đây)
      const timeStats = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM hskresults 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Xử lý dữ liệu cho biểu đồ
      const hskLevelsData = [0, 0, 0, 0, 0, 0];
      hskLevels.forEach(item => {
        if (item.hsk_level >= 1 && item.hsk_level <= 6) {
          hskLevelsData[item.hsk_level - 1] = item.count;
        }
      });

      const skillTypesData = [0, 0, 0]; // listening, reading, writing
      skillTypes.forEach(item => {
        if (item.skill_type === 'listening') skillTypesData[0] = item.count;
        else if (item.skill_type === 'reading') skillTypesData[1] = item.count;
        else if (item.skill_type === 'writing') skillTypesData[2] = item.count;
      });

      const timeStatsData = [0, 0, 0, 0, 0, 0, 0];
      timeStats.forEach(item => {
        const dayDiff = Math.floor((Date.now() - new Date(item.date)) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < 7) {
          timeStatsData[6 - dayDiff] = item.count;
        }
      });

      return {
        total_tests: totalTests[0]?.count || 0,
        total_questions: totalQuestions[0]?.count || 0,
        active_tests: activeTests[0]?.count || 0,
        total_attempts: totalAttempts[0]?.count || 0,
        hsk_levels: hskLevelsData,
        skill_types: skillTypesData,
        time_stats: timeStatsData
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        total_tests: 0,
        total_questions: 0,
        active_tests: 0,
        total_attempts: 0,
        hsk_levels: [0, 0, 0, 0, 0, 0],
        skill_types: [0, 0, 0],
        time_stats: [0, 0, 0, 0, 0, 0, 0]
      };
    }
  },

  // Lấy đề thi gần đây
  async getRecentTests(limit = 5) {
    try {
      return await query(`
        SELECT * FROM hsktests 
        ORDER BY test_id DESC 
        LIMIT ?
      `, [limit]);
    } catch (error) {
      console.error('Error getting recent tests:', error);
      return [];
    }
  },



  // Cập nhật trạng thái hoạt động
  async updateTestActive(testId, isActive) {
    return await query(
      "UPDATE hsktests SET is_active = ? WHERE test_id = ?",
      [isActive ? 1 : 0, testId]
    );
  },

  // Export câu hỏi ra CSV format
  async exportQuestionsToCSV(testId) {
    try {
      const questions = await this.getQuestionsByTest(testId);
      const csvData = questions.map(q => ({
        'ID': q.question_id,
        'Loại kỹ năng': q.skill_type,
        'Loại câu hỏi': q.question_type,
        'Nội dung': q.question_text,
        'Audio URL': q.audio_url || '',
        'Image URL': q.image_url || '',
        'Đáp án đúng': q.correct_answer,
        'Giải thích': q.explanation || '',
        'Độ khó': q.difficulty_level,
        'Điểm': q.points,
        'Thứ tự': q.order_in_test
      }));
      return csvData;
    } catch (error) {
      console.error('Error exporting questions:', error);
      throw error;
    }
  },

  // Import câu hỏi từ CSV
  async importQuestionsFromCSV(testId, csvData) {
    try {
      const results = [];
      for (const row of csvData) {
        const questionData = {
          skill_type: row['Loại kỹ năng'] || 'reading',
          question_type: row['Loại câu hỏi'] || 'multiple_choice',
          question_text: row['Nội dung'],
          audio_url: row['Audio URL'] || null,
          image_url: row['Image URL'] || null,
          correct_answer: row['Đáp án đúng'],
          explanation: row['Giải thích'] || null,
          difficulty_level: row['Độ khó'] || 'easy',
          points: parseInt(row['Điểm']) || 1,
          order_in_test: parseInt(row['Thứ tự']) || 0
        };
        
        const result = await this.createQuestion(testId, questionData);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Error importing questions:', error);
      throw error;
    }
  },

  // ===== API FUNCTIONS =====

  // Tạo kết quả bài thi mới
  async createResult(resultData) {
    const sql = `
      INSERT INTO HSKResults (
        user_id, test_id, status, started_at, 
        total_questions, time_limit
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      resultData.user_id,
      resultData.test_id,
      resultData.status,
      resultData.started_at,
      resultData.total_questions,
      resultData.time_limit
    ];
    return await query(sql, vals);
  },

  // Lấy kết quả bài thi theo ID
  async getResultById(resultId) {
    const sql = `
      SELECT * FROM HSKResults 
      WHERE result_id = ?
    `;
    const results = await query(sql, [resultId]);
    return results[0] || null;
  },

  // Cập nhật kết quả bài thi
  async updateResult(resultId, updateData) {
    const sql = `
      UPDATE HSKResults 
      SET ? 
      WHERE result_id = ?
    `;
    return await query(sql, [updateData, resultId]);
  },

  // Tạo đáp án của user
  async createUserAnswer(answerData) {
    const sql = `
      INSERT INTO HSKUserAnswers (
        result_id, question_id, user_answer, is_correct
      ) VALUES (?, ?, ?, ?)
    `;
    const vals = [
      answerData.result_id,
      answerData.question_id,
      answerData.user_answer,
      answerData.is_correct
    ];
    return await query(sql, vals);
  },

  // Lấy đáp án của user theo result_id
  async getUserAnswersByResult(resultId) {
    const sql = `
      SELECT ua.*, q.question_text, q.correct_answer, q.explanation
      FROM HSKUserAnswers ua
      JOIN HSKQuestions q ON ua.question_id = q.question_id
      WHERE ua.result_id = ?
      ORDER BY ua.created_at
    `;
    return await query(sql, [resultId]);
  },

  // Lấy kết quả bài thi của user
  async getUserResults(userId, options = {}) {
    let sql = `
      SELECT r.*, t.title as test_title, t.hsk_level
      FROM HSKResults r
      JOIN hsktests t ON r.test_id = t.test_id
      WHERE r.user_id = ?
    `;
    const vals = [userId];

    if (options.test_id) {
      sql += ' AND r.test_id = ?';
      vals.push(options.test_id);
    }

    sql += ' ORDER BY COALESCE(r.started_at, r.attempt_date) DESC, r.result_id DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      vals.push(options.limit);
    }

    return await query(sql, vals);
  },

  // Thống kê kết quả của user
  async getUserStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_tests,
        SUM(CASE WHEN total_score >= 180 THEN 1 ELSE 0 END) as passed_tests,
        AVG(total_score) as average_score,
        MAX(total_score) as best_score,
        SUM(time_spent) as total_time_spent
      FROM HSKResults 
      WHERE user_id = ?
    `;
    const results = await query(sql, [userId]);
    return results[0] || {
      total_tests: 0,
      passed_tests: 0,
      average_score: 0,
      best_score: 0,
      total_time_spent: 0
    };
  },

  // Thống kê theo level
  async getUserLevelStats(userId) {
    const sql = `
      SELECT 
        t.hsk_level,
        COUNT(*) as completed_tests,
        AVG(r.total_score) as average_score,
        SUM(CASE WHEN r.total_score >= 180 THEN 1 ELSE 0 END) as passed_tests
      FROM HSKResults r
      JOIN hsktests t ON r.test_id = t.test_id
      WHERE r.user_id = ?
      GROUP BY t.hsk_level
      ORDER BY t.hsk_level
    `;
    return await query(sql, [userId]);
  },

  // Bảng xếp hạng
  async getLeaderboard(level = null, limit = 10) {
    let sql = `
      SELECT 
        u.user_id,
        u.username,
        COUNT(r.result_id) as total_tests,
        AVG(r.total_score) as average_score,
        MAX(r.total_score) as best_score,
        SUM(CASE WHEN r.total_score >= 180 THEN 1 ELSE 0 END) as passed_tests
      FROM Users u
      JOIN HSKResults r ON u.user_id = r.user_id
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
    
    return await query(sql, vals);
  },

  // Thống kê toàn hệ thống
  async getGlobalStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT r.user_id) as total_users,
        COUNT(r.result_id) as total_tests_taken,
        AVG(r.total_score) as average_score,
        COUNT(CASE WHEN r.total_score >= 180 THEN 1 END) as total_passed
      FROM HSKResults r
    `;
    const results = await query(sql);
    return results[0] || {
      total_users: 0,
      total_tests_taken: 0,
      average_score: 0,
      total_passed: 0
    };
  }
};

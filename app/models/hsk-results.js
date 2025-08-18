const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  // Lấy danh sách kết quả thi
  async getResults({ userId = null, testId = null, status = null, page = 1, limit = 20 }) {
    let sql = "SELECT r.*, t.title as test_title, t.hsk_level, u.username, u.email FROM hskresults r";
    sql += " LEFT JOIN hsktests t ON r.test_id = t.test_id";
    sql += " LEFT JOIN users u ON r.user_id = u.user_id";
    sql += " WHERE 1=1";
    
    const vals = [];
    if (userId) {
      sql += " AND r.user_id = ?";
      vals.push(userId);
    }
    if (testId) {
      sql += " AND r.test_id = ?";
      vals.push(testId);
    }
    if (status) {
      sql += " AND r.status = ?";
      vals.push(status);
    }
    
    sql += " ORDER BY r.submitted_at DESC LIMIT ?, ?";
    const offset = (parseInt(page) - 1) * parseInt(limit);
    vals.push(offset, parseInt(limit));
    
    return await query(sql, vals);
  },

  // Lấy tổng số kết quả
  async getResultsTotal({ userId = null, testId = null, status = null }) {
    let sql = "SELECT COUNT(*) as total FROM hskresults r WHERE 1=1";
    const vals = [];
    
    if (userId) {
      sql += " AND r.user_id = ?";
      vals.push(userId);
    }
    if (testId) {
      sql += " AND r.test_id = ?";
      vals.push(testId);
    }
    if (status) {
      sql += " AND r.status = ?";
      vals.push(status);
    }
    
    const result = await query(sql, vals);
    return result[0]?.total || 0;
  },

  // Lấy chi tiết kết quả thi
  async getResultById(resultId) {
    const sql = `
      SELECT r.*, t.title as test_title, t.hsk_level, t.passing_score,
             u.username, u.email, u.avatar
      FROM hskresults r
      LEFT JOIN hsktests t ON r.test_id = t.test_id
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.result_id = ?
    `;
    const result = await query(sql, [resultId]);
    return result[0];
  },

  // Lấy câu trả lời của user
  async getUserAnswers(resultId) {
    const sql = `
      SELECT ua.*, q.question_text, q.question_type, q.skill_type, q.options,
             q.correct_answer, q.explanation, q.points
      FROM hskuseranswers ua
      LEFT JOIN hskquestions q ON ua.question_id = q.question_id
      WHERE ua.result_id = ?
      ORDER BY ua.question_order
    `;
    const answers = await query(sql, [resultId]);
    
    // Parse options JSON
    return answers.map(answer => {
      try {
        if (answer.options) {
          answer.options = JSON.parse(answer.options);
        }
      } catch (e) {
        answer.options = [];
      }
      return answer;
    });
  },

  // Tạo kết quả thi mới
  async createResult(data) {
    const sql = `
      INSERT INTO hskresults (
        user_id, test_id, started_at, submitted_at, status,
        listening_score, reading_score, writing_score, total_score,
        time_spent, is_passed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      data.user_id,
      data.test_id,
      data.started_at || new Date(),
      data.submitted_at || null,
      data.status || 'in_progress',
      data.listening_score || 0,
      data.reading_score || 0,
      data.writing_score || 0,
      data.total_score || 0,
      data.time_spent || 0,
      data.is_passed ? 1 : 0
    ];
    return await query(sql, vals);
  },

  // Cập nhật kết quả thi
  async updateResult(resultId, data) {
    const sql = "UPDATE hskresults SET ? WHERE result_id = ?";
    return await query(sql, [data, resultId]);
  },

  // Lưu câu trả lời của user
  async saveUserAnswer(data) {
    const sql = `
      INSERT INTO hskuseranswers (
        result_id, question_id, user_answer, is_correct, score,
        question_order, time_spent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_answer = VALUES(user_answer),
        is_correct = VALUES(is_correct),
        score = VALUES(score),
        time_spent = VALUES(time_spent)
    `;
    const vals = [
      data.result_id,
      data.question_id,
      data.user_answer,
      data.is_correct ? 1 : 0,
      data.score || 0,
      data.question_order,
      data.time_spent || 0
    ];
    return await query(sql, vals);
  },

  // Chấm điểm thủ công (cho phần Writing)
  async gradeWritingManually(resultId, questionId, score, feedback) {
    const sql = `
      UPDATE hskuseranswers 
      SET score = ?, feedback = ?, graded_at = NOW()
      WHERE result_id = ? AND question_id = ?
    `;
    await query(sql, [score, feedback, resultId, questionId]);
    
    // Cập nhật tổng điểm
    await this.recalculateTotalScore(resultId);
  },

  // Tính lại tổng điểm
  async recalculateTotalScore(resultId) {
    const sql = `
      SELECT 
        SUM(CASE WHEN q.skill_type = 'listening' THEN ua.score ELSE 0 END) as listening_score,
        SUM(CASE WHEN q.skill_type = 'reading' THEN ua.score ELSE 0 END) as reading_score,
        SUM(CASE WHEN q.skill_type = 'writing' THEN ua.score ELSE 0 END) as writing_score,
        SUM(ua.score) as total_score
      FROM hskuseranswers ua
      LEFT JOIN hskquestions q ON ua.question_id = q.question_id
      WHERE ua.result_id = ?
    `;
    
    const scores = await query(sql, [resultId]);
    if (scores[0]) {
      const { listening_score, reading_score, writing_score, total_score } = scores[0];
      
      // Lấy điểm đạt của đề thi
      const testInfo = await query(`
        SELECT t.passing_score FROM hskresults r
        LEFT JOIN hsktests t ON r.test_id = t.test_id
        WHERE r.result_id = ?
      `, [resultId]);
      
      const passingScore = testInfo[0]?.passing_score || 60;
      const isPassed = total_score >= passingScore;
      
      // Cập nhật kết quả
      await this.updateResult(resultId, {
        listening_score: listening_score || 0,
        reading_score: reading_score || 0,
        writing_score: writing_score || 0,
        total_score: total_score || 0,
        is_passed: isPassed ? 1 : 0
      });
    }
  },

  // Thống kê kết quả theo thời gian
  async getResultsStats({ startDate = null, endDate = null, groupBy = 'month' }) {
    let dateFormat = '%Y-%m';
    if (groupBy === 'week') dateFormat = '%Y-%u';
    else if (groupBy === 'day') dateFormat = '%Y-%m-%d';
    
    let sql = `
      SELECT 
        DATE_FORMAT(submitted_at, ?) as period,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN is_passed = 0 THEN 1 ELSE 0 END) as failed,
        AVG(total_score) as avg_score,
        AVG(time_spent) as avg_time
      FROM hskresults
      WHERE status = 'submitted'
    `;
    
    const vals = [dateFormat];
    if (startDate) {
      sql += " AND submitted_at >= ?";
      vals.push(startDate);
    }
    if (endDate) {
      sql += " AND submitted_at <= ?";
      vals.push(endDate);
    }
    
    sql += " GROUP BY period ORDER BY period";
    return await query(sql, vals);
  },

  // Export kết quả thi
  async exportResultsToCSV({ userId = null, testId = null, status = null, startDate = null, endDate = null }) {
    let sql = `
      SELECT 
        r.result_id, r.user_id, u.username, u.email,
        t.title as test_title, t.hsk_level,
        r.listening_score, r.reading_score, r.writing_score, r.total_score,
        r.time_spent, r.is_passed, r.status, r.submitted_at
      FROM hskresults r
      LEFT JOIN hsktests t ON r.test_id = t.test_id
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE 1=1
    `;
    
    const vals = [];
    if (userId) {
      sql += " AND r.user_id = ?";
      vals.push(userId);
    }
    if (testId) {
      sql += " AND r.test_id = ?";
      vals.push(testId);
    }
    if (status) {
      sql += " AND r.status = ?";
      vals.push(status);
    }
    if (startDate) {
      sql += " AND r.submitted_at >= ?";
      vals.push(startDate);
    }
    if (endDate) {
      sql += " AND r.submitted_at <= ?";
      vals.push(endDate);
    }
    
    sql += " ORDER BY r.submitted_at DESC";
    const results = await query(sql, vals);
    
    return results.map(r => ({
      'ID Kết quả': r.result_id,
      'ID User': r.user_id,
      'Tên user': r.username,
      'Email': r.email,
      'Tên đề thi': r.test_title,
      'Cấp độ HSK': r.hsk_level,
      'Điểm nghe': r.listening_score,
      'Điểm đọc': r.reading_score,
      'Điểm viết': r.writing_score,
      'Tổng điểm': r.total_score,
      'Thời gian làm bài (phút)': Math.round(r.time_spent / 60),
      'Đạt/Không đạt': r.is_passed ? 'Đạt' : 'Không đạt',
      'Trạng thái': r.status,
      'Ngày nộp bài': r.submitted_at
    }));
  }
};

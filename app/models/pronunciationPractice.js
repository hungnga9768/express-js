const pool = require("../../connect-mysql");

module.exports = {
  // Lấy tất cả bài luyện phát âm của user
  async getUserPractices(userId, limit = 20) {
    const sql = `
      SELECT pp.*, v.simplified_chinese, v.pinyin, v.english_meaning
      FROM PronunciationPractice pp
      LEFT JOIN Vocabulary v ON pp.word_id = v.word_id
      WHERE pp.user_id = ?
      ORDER BY pp.submission_time DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [userId, limit]);
    return rows;
  },

  // Lấy bài luyện phát âm theo ID
  async getById(id, userId = null) {
    let sql = `
      SELECT pp.*, v.simplified_chinese, v.pinyin, v.english_meaning
      FROM PronunciationPractice pp
      LEFT JOIN Vocabulary v ON pp.word_id = v.word_id
      WHERE pp.practice_id = ?
    `;
    const params = [id];

    if (userId) {
      sql += " AND pp.user_id = ?";
      params.push(userId);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  // Tạo bài luyện phát âm mới
  async create(practiceData) {
    const sql = `
      INSERT INTO PronunciationPractice (
        user_id, word_id, grammar_id, audio_recording_url,
        accuracy_score, feedback, tone_analysis, pronunciation_errors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      practiceData.user_id,
      practiceData.word_id || null,
      practiceData.grammar_id || null,
      practiceData.audio_recording_url,
      practiceData.accuracy_score || null,
      practiceData.feedback || null,
      practiceData.tone_analysis || null,
      practiceData.pronunciation_errors || null
    ];

    const [result] = await pool.query(sql, values);
    return result.insertId;
  },

  // Cập nhật bài luyện phát âm
  async update(id, practiceData, userId = null) {
    let sql = `
      UPDATE PronunciationPractice SET 
        accuracy_score = ?, feedback = ?, tone_analysis = ?, pronunciation_errors = ?
      WHERE practice_id = ?
    `;
    
    const values = [
      practiceData.accuracy_score || null,
      practiceData.feedback || null,
      practiceData.tone_analysis || null,
      practiceData.pronunciation_errors || null,
      id
    ];

    if (userId) {
      sql += " AND user_id = ?";
      values.push(userId);
    }

    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  },

  // Xóa bài luyện phát âm
  async delete(id, userId = null) {
    let sql = "DELETE FROM PronunciationPractice WHERE practice_id = ?";
    const params = [id];

    if (userId) {
      sql += " AND user_id = ?";
      params.push(userId);
    }

     const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
  },

  // Lấy thống kê phát âm của user
  async getUserStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_practices,
        AVG(accuracy_score) as avg_accuracy,
        MAX(accuracy_score) as best_accuracy,
        COUNT(CASE WHEN accuracy_score >= 80 THEN 1 END) as good_practices,
        COUNT(CASE WHEN accuracy_score < 60 THEN 1 END) as needs_improvement
      FROM PronunciationPractice
      WHERE user_id = ?
    `;
    
    const [rows] = await pool.query(sql, [userId]);
    return rows[0];
  },

  // Lấy bài luyện phát âm theo từ vựng
  async getByWordId(wordId, userId = null) {
    let sql = `
      SELECT * FROM PronunciationPractice
      WHERE word_id = ?
    `;
    const params = [wordId];

    if (userId) {
      sql += " AND user_id = ?";
      params.push(userId);
    }

    sql += " ORDER BY submission_time DESC";
    
    const [result] = await pool.query(sql, params);
    return rows;
  },

  // Lấy bài luyện phát âm theo ngữ pháp
  async getByGrammarId(grammarId, userId = null) {
    let sql = `
      SELECT * FROM PronunciationPractice
      WHERE grammar_id = ?
    `;
    const params = [grammarId];

    if (userId) {
      sql += " AND user_id = ?";
      params.push(userId);
    }

    sql += " ORDER BY submission_time DESC";
    
    const [result] = await pool.query(sql, params);
    return rows;
  },

  // Lấy bài luyện phát âm cần cải thiện
  async getNeedsImprovement(userId, limit = 10) {
    const sql = `
      SELECT pp.*, v.simplified_chinese, v.pinyin, v.english_meaning
      FROM PronunciationPractice pp
      LEFT JOIN Vocabulary v ON pp.word_id = v.word_id
      WHERE pp.user_id = ? AND pp.accuracy_score < 70
      ORDER BY pp.submission_time DESC
      LIMIT ?
    `;
    
    const [rows] = await pool.query(sql, [userId, limit]);
    return rows;
  },

  // Lấy bài luyện phát âm tốt nhất
  async getBestPractices(userId, limit = 10) {
    const sql = `
      SELECT pp.*, v.simplified_chinese, v.pinyin, v.english_meaning
      FROM PronunciationPractice pp
      LEFT JOIN Vocabulary v ON pp.word_id = v.word_id
      WHERE pp.user_id = ? AND pp.accuracy_score >= 80
      ORDER BY pp.accuracy_score DESC, pp.submission_time DESC
      LIMIT ?
    `;
    
    const [rows] = await pool.query(sql, [userId, limit]);
    return rows;
  }
};

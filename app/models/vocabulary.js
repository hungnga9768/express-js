
const pool = require("../../connect-mysql");

module.exports = {
  // Lấy danh sách từ vựng (có phân trang và tìm kiếm)
  async getAll(search, offset = 0, limit = 20, hskLevel = null) {
    let sql = "SELECT * FROM vocabulary WHERE 1=1";
    const params = [];

    if (search) {
      sql += ` AND (simplified_chinese LIKE ? OR english_meaning LIKE ? OR pinyin LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(hskLevel);
    }

    sql += ` ORDER BY hsk_level ASC, word_id DESC LIMIT ?, ?`;
    params.push(offset, limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy tổng số từ vựng
  async getTotalRow(search, hskLevel = null) {
    let sql = "SELECT COUNT(*) AS totalRow FROM vocabulary WHERE 1=1";
    const params = [];

    if (search) {
      sql += ` AND (simplified_chinese LIKE ? OR english_meaning LIKE ? OR pinyin LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(hskLevel);
    }

    const [result] = await pool.query(sql, params);
    return result[0].totalRow;
  },

  // Lấy từ vựng theo ID
  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM vocabulary WHERE word_id = ?", [id]);
    return rows[0];
  },

  // Lấy từ vựng theo HSK level
  async getByHSKLevel(level) {
    const [rows] = await pool.query("SELECT * FROM vocabulary WHERE hsk_level = ? ORDER BY word_id", [level]);
    return rows;
  },

  // Lấy từ vựng theo khóa học
  async getByCourse(courseId) {
    const sql = `
      SELECT v.* FROM vocabulary v
      INNER JOIN coursevocabulary cv ON v.word_id = cv.word_id
      WHERE cv.course_id = ?
      ORDER BY v.hsk_level ASC, v.word_id
    `;
    const [rows] = await pool.query(sql, [courseId]);
    return rows;
  },

  // Tạo từ vựng mới
  async create(vocabData) {
    const sql = `
      INSERT INTO vocabulary (
        simplified_chinese, traditional_chinese, pinyin, 
        english_meaning, part_of_speech, hsk_level,
        example_sentence_chinese, example_sentence_pinyin, 
        example_sentence_english, audio_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      vocabData.simplified_chinese,
      vocabData.traditional_chinese || null,
      vocabData.pinyin,
      vocabData.english_meaning,
      vocabData.part_of_speech || null,
      vocabData.hsk_level || 1,
      vocabData.example_sentence_chinese || null,
      vocabData.example_sentence_pinyin || null,
      vocabData.example_sentence_english || null,
      vocabData.audio_url || null
    ];

    const [result] = await pool.query(sql, values);
    return result.insertId;
  },

  // Cập nhật từ vựng
  async update(id, vocabData) {
    const sql = `
      UPDATE vocabulary SET 
        simplified_chinese = ?, traditional_chinese = ?, pinyin = ?,
        english_meaning = ?, part_of_speech = ?, hsk_level = ?,
        example_sentence_chinese = ?, example_sentence_pinyin = ?,
        example_sentence_english = ?, audio_url = ?
      WHERE word_id = ?
    `;
    
    const values = [
      vocabData.simplified_chinese,
      vocabData.traditional_chinese || null,
      vocabData.pinyin,
      vocabData.english_meaning,
      vocabData.part_of_speech || null,
      vocabData.hsk_level || 1,
      vocabData.example_sentence_chinese || null,
      vocabData.example_sentence_pinyin || null,
      vocabData.example_sentence_english || null,
      vocabData.audio_url || null,
      id
    ];

    const [result] = await pool.query(sql, values);
    return result.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa từ vựng
  async delete(id) {
    const [result] = await pool.query("DELETE FROM vocabulary WHERE word_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Tìm kiếm từ vựng nâng cao
  async searchAdvanced(searchParams) {
    let sql = "SELECT * FROM vocabulary WHERE 1=1";
    const params = [];

    if (searchParams.search) {
      sql += ` AND (simplified_chinese LIKE ? OR english_meaning LIKE ? OR pinyin LIKE ?)`;
      params.push(`%${searchParams.search}%`, `%${searchParams.search}%`, `%${searchParams.search}%`);
    }

    if (searchParams.hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(searchParams.hskLevel);
    }

    if (searchParams.partOfSpeech) {
      sql += ` AND part_of_speech = ?`;
      params.push(searchParams.partOfSpeech);
    }

    if (searchParams.minLevel && searchParams.maxLevel) {
      sql += ` AND hsk_level BETWEEN ? AND ?`;
      params.push(searchParams.minLevel, searchParams.maxLevel);
    }

    sql += ` ORDER BY hsk_level ASC, word_id DESC`;

    if (searchParams.limit) {
      sql += ` LIMIT ?`;
      params.push(searchParams.limit);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy từ vựng theo cấp độ HSK với giới hạn
  async getByHSKLevelWithLimit(hskLevel, limit = 50) {
    const sql = "SELECT * FROM vocabulary WHERE hsk_level = ? ORDER BY word_id LIMIT ?";
    const [rows] = await pool.query(sql, [hskLevel, limit]);
    return rows;
  },

  // Kiểm tra từ vựng trùng lặp
  async checkDuplicate(simplifiedChinese, excludeId = null) {
    let sql = "SELECT COUNT(*) as count FROM vocabulary WHERE simplified_chinese = ?";
    const params = [simplifiedChinese];
    
    if (excludeId) {
      sql += " AND word_id != ?";
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0].count > 0;
  }
};
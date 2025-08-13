
const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  // Lấy danh sách từ vựng với phân trang và tìm kiếm
  async getAll(search, offset, limit, hskLevel = null) {
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

    return await query(sql, params);
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

    const result = await query(sql, params);
    return result[0].totalRow;
  },

  // Lấy từ vựng theo ID
  async getById(id) {
    const rows = await query("SELECT * FROM vocabulary WHERE word_id = ?", [id]);
    return rows[0];
  },

  // Lấy từ vựng theo HSK level
  async getByHSKLevel(level) {
    return await query("SELECT * FROM vocabulary WHERE hsk_level = ? ORDER BY word_id", [level]);
  },

  // Lấy từ vựng theo khóa học
  async getByCourse(courseId) {
    const sql = `
      SELECT v.* FROM vocabulary v
      INNER JOIN coursevocabulary cv ON v.word_id = cv.word_id
      WHERE cv.course_id = ?
      ORDER BY v.hsk_level ASC, v.word_id
    `;
    return await query(sql, [courseId]);
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

    const result = await query(sql, values);
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

    const result = await query(sql, values);
    return result.affectedRows > 0;
  },

  // Xóa từ vựng
  async delete(id) {
    const result = await query("DELETE FROM vocabulary WHERE word_id = ?", [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra trùng lặp
  async checkDuplicate(simplifiedChinese, wordId = null) {
    let sql = "SELECT * FROM vocabulary WHERE simplified_chinese = ?";
    const params = [simplifiedChinese];

    if (wordId) {
      sql += " AND word_id != ?";
      params.push(wordId);
    }

    const rows = await query(sql, params);
    return rows.length > 0;
  },

  // Lấy từ vựng ngẫu nhiên cho bài tập
  async getRandomWords(limit = 10, hskLevel = null) {
    let sql = "SELECT * FROM vocabulary";
    const params = [];

    if (hskLevel) {
      sql += " WHERE hsk_level = ?";
      params.push(hskLevel);
    }

    sql += " ORDER BY RAND() LIMIT ?";
    params.push(limit);

    return await query(sql, params);
  },

  // Tìm kiếm từ vựng nâng cao
  async searchAdvanced(filters) {
    let sql = "SELECT * FROM vocabulary WHERE 1=1";
    const params = [];

    if (filters.search) {
      sql += ` AND (simplified_chinese LIKE ? OR english_meaning LIKE ? OR pinyin LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(filters.hskLevel);
    }

    if (filters.partOfSpeech) {
      sql += ` AND part_of_speech = ?`;
      params.push(filters.partOfSpeech);
    }

    if (filters.hasAudio) {
      sql += ` AND audio_url IS NOT NULL`;
    }

    sql += ` ORDER BY hsk_level ASC, word_id DESC`;
    
    if (filters.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return await query(sql, params);
  }
};
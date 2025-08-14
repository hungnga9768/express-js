const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  // Lấy tất cả ngữ pháp
  async getAll(search, offset, limit, hskLevel = null) {
    let sql = "SELECT * FROM Grammar WHERE 1=1";
    const params = [];

    if (search) {
      sql += ` AND (title LIKE ? OR structure LIKE ? OR explanation LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(hskLevel);
    }

    sql += ` ORDER BY hsk_level ASC, grammar_id DESC LIMIT ?, ?`;
    params.push(offset, limit);

    return await query(sql, params);
  },

  // Lấy tổng số ngữ pháp
  async getTotalRow(search, hskLevel = null) {
    let sql = "SELECT COUNT(*) AS totalRow FROM Grammar WHERE 1=1";
    const params = [];

    if (search) {
      sql += ` AND (title LIKE ? OR structure LIKE ? OR explanation LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(hskLevel);
    }

    const result = await query(sql, params);
    return result[0].totalRow;
  },

  // Lấy ngữ pháp theo ID
  async getById(id) {
    const rows = await query("SELECT * FROM Grammar WHERE grammar_id = ?", [id]);
    return rows[0];
  },

  // Lấy ngữ pháp theo HSK level
  async getByHSKLevel(level, limit = 10) {
    const sql = `
      SELECT * FROM Grammar 
      WHERE hsk_level = ? 
      ORDER BY RAND() 
      LIMIT ?
    `;
    return await query(sql, [level, limit]);
  },

  // Tạo ngữ pháp mới
  async create(grammarData) {
    const sql = `
      INSERT INTO Grammar (
        title, structure, explanation, example_chinese,
        example_pinyin, example_english, difficulty_level, hsk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      grammarData.title,
      grammarData.structure,
      grammarData.explanation || null,
      grammarData.example_chinese,
      grammarData.example_pinyin || null,
      grammarData.example_english || null,
      grammarData.difficulty_level || 'beginner',
      grammarData.hsk_level || 1
    ];

    const result = await query(sql, values);
    return result.insertId;
  },

  // Cập nhật ngữ pháp
  async update(id, grammarData) {
    const sql = `
      UPDATE Grammar SET 
        title = ?, structure = ?, explanation = ?,
        example_chinese = ?, example_pinyin = ?, example_english = ?,
        difficulty_level = ?, hsk_level = ?
      WHERE grammar_id = ?
    `;
    
    const values = [
      grammarData.title,
      grammarData.structure,
      grammarData.explanation || null,
      grammarData.example_chinese,
      grammarData.example_pinyin || null,
      grammarData.example_english || null,
      grammarData.difficulty_level || 'beginner',
      grammarData.hsk_level || 1,
      id
    ];

    const result = await query(sql, values);
    return result.affectedRows > 0;
  },

  // Xóa ngữ pháp
  async delete(id) {
    const result = await query("DELETE FROM Grammar WHERE grammar_id = ?", [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra trùng lặp
  async checkDuplicate(title, grammarId = null) {
    let sql = "SELECT * FROM Grammar WHERE title = ?";
    const params = [title];

    if (grammarId) {
      sql += " AND grammar_id != ?";
      params.push(grammarId);
    }

    const rows = await query(sql, params);
    return rows.length > 0;
  },

  // Lấy ngữ pháp ngẫu nhiên cho bài tập
  async getRandomGrammar(limit = 10, hskLevel = null) {
    let sql = "SELECT * FROM Grammar";
    const params = [];

    if (hskLevel) {
      sql += " WHERE hsk_level = ?";
      params.push(hskLevel);
    }

    sql += " ORDER BY RAND() LIMIT ?";
    params.push(limit);

    return await query(sql, params);
  },

  // Tìm kiếm ngữ pháp nâng cao
  async searchAdvanced(filters) {
    let sql = "SELECT * FROM Grammar WHERE 1=1";
    const params = [];

    if (filters.search) {
      sql += ` AND (title LIKE ? OR structure LIKE ? OR explanation LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(filters.hskLevel);
    }

    if (filters.difficultyLevel) {
      sql += ` AND difficulty_level = ?`;
      params.push(filters.difficultyLevel);
    }

    sql += ` ORDER BY hsk_level ASC, grammar_id DESC`;
    
    if (filters.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return await query(sql, params);
  }
};

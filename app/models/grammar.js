const pool = require("../../connect-mysql");

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

    const [rows] = await pool.query(sql, params);
    return rows;
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

    const [result] = await pool.query(sql, params);
    return result[0].totalRow;
  },

  // Lấy ngữ pháp theo ID
  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM Grammar WHERE grammar_id = ?", [id]);
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
    const [rows] = await pool.query(sql, [level, limit]);
    return rows;
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

    const [result] = await pool.query(sql, values);
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

    const [result] = await pool.query(sql, values);
    return result.affectedRows;
  },

  // Xóa ngữ pháp
  async delete(id) {
    const [result] = await pool.query("DELETE FROM Grammar WHERE grammar_id = ?", [id]);
    return result.affectedRows;
  },

  // Kiểm tra trùng lặp
  async checkDuplicate(title, id = null) {
    let sql = "SELECT COUNT(*) as count FROM Grammar WHERE title = ?";
    const params = [title];
    
    if (id) {
      sql += " AND grammar_id != ?";
      params.push(id);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0].count > 0;
  },

  // Lấy ngữ pháp ngẫu nhiên
  async getRandomGrammar(level = null, limit = 5) {
    let sql = "SELECT * FROM Grammar WHERE 1=1";
    const params = [];

    if (level) {
      sql += " AND hsk_level = ?";
      params.push(level);
    }

    sql += " ORDER BY RAND() LIMIT ?";
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy ngữ pháp theo độ khó
  async getByDifficulty(difficulty, limit = 10) {
    const sql = `
      SELECT * FROM Grammar 
      WHERE difficulty_level = ? 
      ORDER BY hsk_level ASC, grammar_id DESC 
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [difficulty, limit]);
    return rows;
  },

  // Tìm kiếm nâng cao
  async searchAdvanced(searchParams) {
    let sql = "SELECT * FROM Grammar WHERE 1=1";
    const params = [];

    if (searchParams.search) {
      sql += ` AND (title LIKE ? OR structure LIKE ? OR explanation LIKE ?)`;
      params.push(`%${searchParams.search}%`, `%${searchParams.search}%`, `%${searchParams.search}%`);
    }

    if (searchParams.hskLevel) {
      sql += ` AND hsk_level = ?`;
      params.push(searchParams.hskLevel);
    }

    if (searchParams.difficulty) {
      sql += ` AND difficulty_level = ?`;
      params.push(searchParams.difficulty);
    }

    sql += ` ORDER BY hsk_level ASC, grammar_id DESC`;

    if (searchParams.limit) {
      sql += ` LIMIT ?`;
      params.push(searchParams.limit);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }
};

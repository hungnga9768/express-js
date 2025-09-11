
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
      vocabData.english_meaning.substring(0, 255), // Giới hạn 255 ký tự
      vocabData.part_of_speech || null,
      vocabData.hsk_level || 1,
      vocabData.example_sentence_chinese || null,
      vocabData.example_sentence_pinyin || null,
      vocabData.example_sentence_english || null,
      vocabData.audio_url || null
    ];

    const [result] = await pool.query(sql, values);
    const wordId = result.insertId;
    
    // Tự động liên kết với tất cả game
    await this.linkToAllGames(wordId);
    
    return wordId;
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
      vocabData.english_meaning.substring(0, 255), // Giới hạn 255 ký tự
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
    // Xóa liên kết với game trước
    await pool.query("DELETE FROM GameVocabulary WHERE word_id = ?", [id]);
    
    // Xóa từ vựng
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
  },

  // Upsert từ vựng (insert hoặc update nếu trùng)
  async upsert(vocabData) {
    try {
      // Kiểm tra xem từ vựng đã tồn tại chưa
      const existingId = await this.getIdBySimplifiedChinese(vocabData.simplified_chinese);
      
      if (existingId) {
        // Nếu đã tồn tại, cập nhật
        const updateData = {
          simplified_chinese: vocabData.simplified_chinese, // Giữ nguyên simplified_chinese
          traditional_chinese: vocabData.traditional_chinese || null,
          pinyin: vocabData.pinyin,
          english_meaning: vocabData.english_meaning.substring(0, 255), // Giới hạn 255 ký tự
          part_of_speech: vocabData.part_of_speech || null,
          hsk_level: vocabData.hsk_level || 1,
          example_sentence_chinese: vocabData.example_sentence_chinese || null,
          example_sentence_pinyin: vocabData.example_sentence_pinyin || null,
          example_sentence_english: vocabData.example_sentence_english || null,
          audio_url: vocabData.audio_url || null
        };
        
        await this.update(existingId, updateData);
        return { id: existingId, action: 'updated' };
      } else {
        // Nếu chưa tồn tại, tạo mới (đã tự động liên kết trong create)
        const newId = await this.create(vocabData);
        return { id: newId, action: 'created' };
      }
    } catch (error) {
      console.error("Error in upsert:", error);
      throw error;
    }
  },

  // Lấy ID từ vựng theo simplified_chinese
  async getIdBySimplifiedChinese(simplifiedChinese) {
    const [rows] = await pool.query("SELECT word_id FROM vocabulary WHERE simplified_chinese = ?", [simplifiedChinese]);
    return rows[0]?.word_id;
  },

  // Liên kết từ vựng với tất cả các game vocabulary
  async linkToAllGames(wordId) {
    try {
      // Lấy danh sách tất cả game_id từ bảng Games
      const [games] = await pool.query("SELECT game_id FROM Games WHERE is_active = TRUE");
      
      if (games.length === 0) {
        return { success: true, message: "Không có game nào để liên kết" };
      }

      // Tạo các cặp (game_id, word_id) để insert
      const gameVocabularyPairs = games.map(game => [game.game_id, wordId]);
      
      // Insert vào GameVocabulary với ON DUPLICATE KEY UPDATE để tránh lỗi trùng lặp
      const insertSql = `
        INSERT INTO GameVocabulary (game_id, word_id) 
        VALUES ${gameVocabularyPairs.map(() => '(?, ?)').join(', ')}
        ON DUPLICATE KEY UPDATE game_id = game_id
      `;
      
      const flatValues = gameVocabularyPairs.flat();
      await pool.query(insertSql, flatValues);
      
      return { 
        success: true, 
        message: `Đã liên kết từ vựng với ${games.length} game`,
        linkedGames: games.length
      };
    } catch (error) {
      console.error("Error linking vocabulary to games:", error);
      return { success: false, error: error.message };
    }
  },

  // Liên kết từ vựng với game cụ thể
  async linkToGame(wordId, gameId) {
    try {
      const sql = `
        INSERT INTO GameVocabulary (game_id, word_id) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE game_id = game_id
      `;
      
      await pool.query(sql, [gameId, wordId]);
      return { success: true, message: "Đã liên kết từ vựng với game" };
    } catch (error) {
      console.error("Error linking vocabulary to game:", error);
      return { success: false, error: error.message };
    }
  },

  // Hủy liên kết từ vựng với tất cả game
  async unlinkFromAllGames(wordId) {
    try {
      await pool.query("DELETE FROM GameVocabulary WHERE word_id = ?", [wordId]);
      return { success: true, message: "Đã hủy liên kết từ vựng với tất cả game" };
    } catch (error) {
      console.error("Error unlinking vocabulary from games:", error);
      return { success: false, error: error.message };
    }
  }
};
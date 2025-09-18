// Kết nối MySQL
const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến lesson vocabulary
module.exports = {
  // Lấy từ vựng theo lesson
  async getVocabularyByLesson(lessonId) {
    const sql = `
      SELECT 
        v.word_id,
        v.simplified_chinese as chinese_word,
        v.traditional_chinese,
        v.pinyin,
        v.english_meaning as vietnamese_meaning,
        v.part_of_speech as word_type,
        v.hsk_level,
        v.audio_url,
        v.example_sentence_chinese as example_sentence,
        v.example_sentence_english as example_translation
      FROM lessonvocabulary lv
      JOIN vocabulary v ON lv.word_id = v.word_id
      WHERE lv.lesson_id = ?
      ORDER BY v.simplified_chinese ASC
    `;
    
    const [rows] = await pool.query(sql, [lessonId]);
    return rows;
  },

  // Kiểm tra từ vựng đã tồn tại trong lesson chưa
  async checkVocabularyInLesson(lessonId, wordId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM lessonvocabulary 
      WHERE lesson_id = ? AND word_id = ?
    `;
    
    const [rows] = await pool.query(sql, [lessonId, wordId]);
    return rows[0].count > 0;
  },

  // Thêm từ vựng vào lesson
  async addVocabularyToLesson(lessonId, wordId) {
    const sql = `
      INSERT INTO lessonvocabulary (lesson_id, word_id) 
      VALUES (?, ?)
    `;
    
    const [result] = await pool.query(sql, [lessonId, wordId]);
    return result;
  },

  // Xóa từ vựng khỏi lesson
  async removeVocabularyFromLesson(lessonId, wordId) {
    const sql = `
      DELETE FROM lessonvocabulary 
      WHERE lesson_id = ? AND word_id = ?
    `;
    
    const [result] = await pool.query(sql, [lessonId, wordId]);
    return result;
  },

  // Tìm kiếm từ vựng
  async searchVocabulary(keyword) {
    const sql = `
      SELECT 
        word_id,
        simplified_chinese as chinese_word,
        traditional_chinese,
        pinyin,
        english_meaning as vietnamese_meaning,
        part_of_speech as word_type,
        hsk_level
      FROM vocabulary 
      WHERE 
        simplified_chinese LIKE ? OR 
        traditional_chinese LIKE ? OR
        pinyin LIKE ? OR 
        english_meaning LIKE ?
      ORDER BY simplified_chinese ASC
      LIMIT 50
    `;
    
    const searchTerm = `%${keyword}%`;
    const [rows] = await pool.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
    return rows;
  },

  // Lấy thống kê từ vựng theo lesson
  async getVocabularyStats(lessonId) {
    const sql = `
      SELECT 
        COUNT(*) as total_words,
        COUNT(CASE WHEN v.hsk_level = 1 THEN 1 END) as hsk1_count,
        COUNT(CASE WHEN v.hsk_level = 2 THEN 1 END) as hsk2_count,
        COUNT(CASE WHEN v.hsk_level = 3 THEN 1 END) as hsk3_count,
        COUNT(CASE WHEN v.hsk_level = 4 THEN 1 END) as hsk4_count,
        COUNT(CASE WHEN v.hsk_level = 5 THEN 1 END) as hsk5_count,
        COUNT(CASE WHEN v.hsk_level = 6 THEN 1 END) as hsk6_count
      FROM lessonvocabulary lv
      JOIN vocabulary v ON lv.word_id = v.word_id
      WHERE lv.lesson_id = ?
    `;
    
    const [rows] = await pool.query(sql, [lessonId]);
    return rows[0];
  },

  // Lấy tất cả lessons có từ vựng
  async getLessonsWithVocabulary() {
    const sql = `
      SELECT 
        l.lesson_id,
        l.title,
        COUNT(lv.word_id) as vocabulary_count
      FROM lessons l
      LEFT JOIN lessonvocabulary lv ON l.lesson_id = lv.lesson_id
      GROUP BY l.lesson_id, l.title
      HAVING vocabulary_count > 0
      ORDER BY l.lesson_id ASC
    `;
    
    const [rows] = await pool.query(sql);
    return rows;
  }
};

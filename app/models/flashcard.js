const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  // Lấy flashcards của user
  async getUserFlashcards(userId, limit = 50) {
    const sql = `
      SELECT f.*, v.simplified_chinese, v.traditional_chinese, v.pinyin, 
             v.english_meaning, v.part_of_speech, v.hsk_level
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.word_id = v.word_id
      WHERE f.user_id = ?
      ORDER BY f.next_review_date ASC, f.creation_date DESC
      LIMIT ?
    `;
    return await query(sql, [userId, limit]);
  },

  // Lấy flashcard theo ID và user_id
  async getById(id, userId) {
    const sql = `
      SELECT f.*, v.simplified_chinese, v.traditional_chinese, v.pinyin, 
             v.english_meaning, v.part_of_speech, v.hsk_level
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.word_id = v.word_id
      WHERE f.flashcard_id = ? AND f.user_id = ?
    `;
    const result = await query(sql, [id, userId]);
    return result[0] || null;
  },

  // Kiểm tra trùng lặp dựa trên nội dung
  async checkDuplicateByContent(userId, frontContent, backContent) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM flashcards 
      WHERE user_id = ? AND front_content = ? AND back_content = ?
    `;
    const result = await query(sql, [userId, frontContent.trim(), backContent.trim()]);
    return result[0].count > 0;
  },

  // Kiểm tra trùng lặp dựa trên word_id
  async checkDuplicateByWordId(userId, wordId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM flashcards 
      WHERE user_id = ? AND word_id = ?
    `;
    const result = await query(sql, [userId, wordId]);
    return result[0].count > 0;
  },

  // Tạo flashcard mới
  async create(flashcardData) {
    const sql = `
      INSERT INTO flashcards (
        user_id, word_id, front_content, back_content, 
        difficulty_level, next_review_date, creation_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
      flashcardData.user_id,
      flashcardData.word_id || null,
      flashcardData.front_content,
      flashcardData.back_content,
      flashcardData.difficulty_level || 'medium',
      flashcardData.next_review_date || new Date()
    ];

    const result = await query(sql, values);
    return result.insertId;
  },

  // Lấy flashcards cần ôn tập
  async getDueForReview(userId, limit = 20) {
    const sql = `
      SELECT f.*, v.simplified_chinese, v.traditional_chinese, v.pinyin, 
             v.english_meaning, v.part_of_speech, v.hsk_level
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.word_id = v.word_id
      WHERE f.user_id = ? AND (f.next_review_date <= NOW() OR f.next_review_date IS NULL)
      ORDER BY f.next_review_date ASC
      LIMIT ?
    `;
    return await query(sql, [userId, limit]);
  },

  // Cập nhật trạng thái ôn tập
  async updateReviewStatus(id, difficulty, nextReviewDate) {
    const sql = `
      UPDATE flashcards SET 
        last_reviewed = NOW(), 
        next_review_date = ?,
        difficulty_level = ?
      WHERE flashcard_id = ?
    `;
    
    const result = await query(sql, [nextReviewDate, difficulty, id]);
    return result.affectedRows > 0;
  },

  // Cập nhật flashcard
  async update(id, updateData) {
    const sql = `
      UPDATE flashcards SET 
        front_content = ?,
        back_content = ?,
        difficulty_level = ?
      WHERE flashcard_id = ?
    `;
    
    const values = [
      updateData.front_content,
      updateData.back_content,
      updateData.difficulty_level,
      id
    ];

    const result = await query(sql, values);
    return result.affectedRows > 0;
  },

  // Xóa flashcard
  async delete(id, userId) {
    const result = await query(
      "DELETE FROM flashcards WHERE flashcard_id = ? AND user_id = ?", 
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  // Lấy số lượng flashcard của user
  async getUserFlashcardCount(userId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM flashcards 
      WHERE user_id = ?
    `;
    const result = await query(sql, [userId]);
    return result[0].count;
  }
};
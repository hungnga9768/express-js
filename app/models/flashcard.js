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

  // Tạo flashcard mới
  async create(flashcardData) {
    const sql = `
      INSERT INTO flashcards (
        user_id, word_id, front_content, back_content, 
        difficulty_level, next_review_date
      ) VALUES (?, ?, ?, ?, ?, ?)
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

  // Cập nhật flashcard
  async update(id, flashcardData) {
    const sql = `
      UPDATE flashcards SET 
        front_content = ?, back_content = ?, difficulty_level = ?,
        last_reviewed = ?, next_review_date = ?
      WHERE flashcard_id = ?
    `;
    
    const values = [
      flashcardData.front_content,
      flashcardData.back_content,
      flashcardData.difficulty_level,
      flashcardData.last_reviewed || new Date(),
      flashcardData.next_review_date,
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
  }
};
const flashcardModel = require("../../models/flashcard");
const vocabularyModel = require("../../models/vocabulary");

module.exports = {
  // Lấy flashcards của user
  async getUserFlashcards(req, res) {
    try {
      const userId = req.user.user_id;
      const { limit = 50 } = req.query;

      const flashcards = await flashcardModel.getUserFlashcards(userId, parseInt(limit));

      res.json({
        success: true,
        data: flashcards,
        count: flashcards.length
      });
    } catch (error) {
      console.error("Error getting user flashcards:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy flashcards"
      });
    }
  },

  // Tạo flashcard mới
  async createFlashcard(req, res) {
    try {
      const userId = req.user.user_id;
      const { word_id, front_content, back_content, difficulty_level } = req.body;

      // Validate input
      if (!front_content || !back_content) {
        return res.status(400).json({
          success: false,
          message: "Nội dung mặt trước và sau không được để trống"
        });
      }

      // Nếu có word_id, kiểm tra từ vựng tồn tại
      if (word_id) {
        const vocabulary = await vocabularyModel.getById(word_id);
        if (!vocabulary) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy từ vựng"
          });
        }
      }

      const flashcardData = {
        user_id: userId,
        word_id: word_id || null,
        front_content,
        back_content,
        difficulty_level: difficulty_level || 'medium'
      };

      const flashcardId = await flashcardModel.create(flashcardData);

      res.status(201).json({
        success: true,
        message: "Tạo flashcard thành công",
        data: { flashcard_id: flashcardId }
      });
    } catch (error) {
      console.error("Error creating flashcard:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo flashcard"
      });
    }
  },

  // Cập nhật flashcard
  async updateFlashcard(req, res) {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;
      const { front_content, back_content, difficulty_level } = req.body;

      // Kiểm tra flashcard thuộc về user
      const existingFlashcard = await flashcardModel.getUserFlashcards(userId);
      const userFlashcard = existingFlashcard.find(f => f.flashcard_id == id);

      if (!userFlashcard) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy flashcard"
        });
      }

      const updateData = {
        front_content: front_content || userFlashcard.front_content,
        back_content: back_content || userFlashcard.back_content,
        difficulty_level: difficulty_level || userFlashcard.difficulty_level
      };

      const success = await flashcardModel.update(id, updateData);

      if (success) {
        res.json({
          success: true,
          message: "Cập nhật flashcard thành công"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Không thể cập nhật flashcard"
        });
      }
    } catch (error) {
      console.error("Error updating flashcard:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật flashcard"
      });
    }
  },

  // Xóa flashcard
  async deleteFlashcard(req, res) {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;

      const success = await flashcardModel.delete(id, userId);

      if (success) {
        res.json({
          success: true,
          message: "Xóa flashcard thành công"
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy flashcard để xóa"
        });
      }
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa flashcard"
      });
    }
  },

  // Lấy flashcards cần ôn tập
  async getDueFlashcards(req, res) {
    try {
      const userId = req.user.user_id;
      const { limit = 20 } = req.query;

      const flashcards = await flashcardModel.getDueForReview(userId, parseInt(limit));

      res.json({
        success: true,
        data: flashcards,
        count: flashcards.length
      });
    } catch (error) {
      console.error("Error getting due flashcards:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy flashcards cần ôn tập"
      });
    }
  },

  // Cập nhật trạng thái ôn tập
  async updateReviewStatus(req, res) {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;
      const { difficulty, nextReviewDate } = req.body;

      // Validate difficulty
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: "Mức độ khó không hợp lệ"
        });
      }

      // Kiểm tra flashcard thuộc về user
      const existingFlashcard = await flashcardModel.getUserFlashcards(userId);
      const userFlashcard = existingFlashcard.find(f => f.flashcard_id == id);

      if (!userFlashcard) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy flashcard"
        });
      }

      const success = await flashcardModel.updateReviewStatus(id, difficulty, nextReviewDate);

      if (success) {
        res.json({
          success: true,
          message: "Cập nhật trạng thái ôn tập thành công"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái ôn tập"
        });
      }
    } catch (error) {
      console.error("Error updating review status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái ôn tập"
      });
    }
  }
};

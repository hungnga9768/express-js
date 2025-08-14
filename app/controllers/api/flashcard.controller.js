const flashcardModel = require("../../models/flashcard");
const vocabularyModel = require("../../models/vocabulary");

module.exports = {
  // Lấy flashcards của user
  async getUserFlashcards(req, res) {
    try {
      const userId = req.user?.user_id;
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

  // Tạo flashcard mới - Kiểm tra trùng lặp chính xác
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

      // Kiểm tra trùng lặp dựa trên nội dung, không chỉ word_id
      const isDuplicate = await flashcardModel.checkDuplicateByContent(userId, front_content, back_content);
      
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: "Flashcard với nội dung này đã tồn tại"
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

        // Kiểm tra xem từ vựng đã có trong flashcard của user chưa
        const isWordDuplicate = await flashcardModel.checkDuplicateByWordId(userId, parseInt(word_id));

        if (isWordDuplicate) {
          return res.status(400).json({
            success: false,
            message: "Từ vựng này đã có trong flashcard của bạn"
          });
        }
      }

      const flashcardData = {
        user_id: userId,
        word_id: word_id || null,
        front_content: front_content.trim(),
        back_content: back_content.trim(),
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
      const userId = req.user?.user_id;
      
      const { id } = req.params;
      let { difficulty, nextReviewDate } = req.body;


      // Validate difficulty
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: "Mức độ khó không hợp lệ"
        });
      }

      // Kiểm tra flashcard thuộc về user
      const existingFlashcard = await flashcardModel.getById(id, userId);

      if (!existingFlashcard) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy flashcard"
        });
      }// Chuyển đổi ISO date sang MySQL DATETIME format
    if (nextReviewDate) {
      const dateObj = new Date(nextReviewDate);
      nextReviewDate = dateObj.toISOString().slice(0, 19).replace('T', ' '); 
      // Ví dụ: "2025-08-17 10:07:49"
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
  }
};

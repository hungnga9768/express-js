const vocabularyModel = require("../../models/vocabulary");
const flashcardModel = require("../../models/flashcard");

module.exports = {
  // Lấy danh sách từ vựng
  async getVocabulary(req, res) {
    try {
      const { search, page = 1, limit = 20, hskLevel } = req.query;
      const offset = (page - 1) * limit;

      const [vocabulary, totalRows] = await Promise.all([
        vocabularyModel.getAll(search, offset, parseInt(limit), hskLevel),
        vocabularyModel.getTotalRow(search, hskLevel)
      ]);

      res.json({
        success: true,
        data: vocabulary,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRows / limit),
          totalItems: totalRows,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error("Error getting vocabulary:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách từ vựng"
      });
    }
  },

  // Lấy từ vựng theo ID
  async getVocabularyById(req, res) {
    try {
      const { id } = req.params;
      const vocabulary = await vocabularyModel.getById(id);

      if (!vocabulary) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy từ vựng"
        });
      }

      res.json({
        success: true,
        data: vocabulary
      });
    } catch (error) {
      console.error("Error getting vocabulary by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin từ vựng"
      });
    }
  },

  // Lấy từ vựng theo HSK level
  async getVocabularyByHSK(req, res) {
    try {
      const { level } = req.params;
      const vocabulary = await vocabularyModel.getByHSKLevel(parseInt(level));

      res.json({
        success: true,
        data: vocabulary,
        count: vocabulary.length
      });
    } catch (error) {
      console.error("Error getting vocabulary by HSK level:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy từ vựng theo cấp độ HSK"
      });
    }
  },

  // Lấy từ vựng theo khóa học
  async getVocabularyByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const vocabulary = await vocabularyModel.getByCourse(courseId);

      res.json({
        success: true,
        data: vocabulary,
        count: vocabulary.length
      });
    } catch (error) {
      console.error("Error getting vocabulary by course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy từ vựng theo khóa học"
      });
    }
  },

  // Tìm kiếm từ vựng nâng cao
  async searchVocabulary(req, res) {
    try {
      const filters = req.query;
      const vocabulary = await vocabularyModel.searchAdvanced(filters);

      res.json({
        success: true,
        data: vocabulary,
        count: vocabulary.length
      });
    } catch (error) {
      console.error("Error searching vocabulary:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tìm kiếm từ vựng"
      });
    }
  },

  // Lấy từ vựng ngẫu nhiên cho bài tập
  async getRandomVocabulary(req, res) {
    try {
      const { limit = 10, hskLevel } = req.query;
      const vocabulary = await vocabularyModel.getRandomWords(
        parseInt(limit), 
        hskLevel ? parseInt(hskLevel) : null
      );

      res.json({
        success: true,
        data: vocabulary,
        count: vocabulary.length
      });
    } catch (error) {
      console.error("Error getting random vocabulary:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy từ vựng ngẫu nhiên"
      });
    }
  }
};

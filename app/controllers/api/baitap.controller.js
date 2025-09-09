const baitap = require("../../models/baitap");

module.exports = {
  // Lấy danh sách bộ bài tập với phân trang & tìm kiếm
  async index(req, res) {
    try {
      const { search, page = 1, limit = 20, lessonId, type, difficulty } = req.query;
      const offset = (page - 1) * limit;

      let exercises;
      let totalRows;

      if (lessonId) {
        exercises = await baitap.getByLesson(lessonId);
        totalRows = exercises.length;
      } else if (type) {
        exercises = await baitap.getByType(type, limit);
        totalRows = exercises.length;
      } else if (difficulty) {
        exercises = await baitap.getByDifficulty(difficulty, limit);
        totalRows = exercises.length;
      } else {
        exercises = await baitap.getAll(search, offset, limit);
        totalRows = await baitap.getTotalRow(search);
      }

      const totalPages = Math.ceil(totalRows / limit);

      res.json({
        success: true,
        data: exercises,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalRows,
          itemsPerPage: parseInt(limit)
        },
        message: "Đã tải danh sách bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tải bài tập",
        error: error.message
      });
    }
  },

  // Lấy chi tiết bộ bài tập
  async show(req, res) {
    try {
      const { id } = req.params;
      const exerciseSet = await baitap.getById(id);
      
      if (!exerciseSet) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bộ bài tập"
        });
      }

      const questions = await baitap.getWithQuestions(id);

      res.json({
        success: true,
        data: {
          exerciseSet,
          questions
        },
        message: "Đã tải chi tiết bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tải chi tiết bài tập",
        error: error.message
      });
    }
  },

  // Lấy bài tập theo bài học
  async getByLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const exercises = await baitap.getByLesson(lessonId);
      
      res.json({
        success: true,
        data: exercises,
        message: "Đã tải bài tập theo bài học thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài tập theo bài học:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tải bài tập theo bài học",
        error: error.message
      });
    }
  },

  // Lấy bài tập ngẫu nhiên
  async getRandom(req, res) {
    try {
      const { limit = 10, hskLevel } = req.query;
      const exercises = await baitap.getRandomExercises(parseInt(limit), hskLevel);
      
      res.json({
        success: true,
        data: exercises,
        message: "Đã tải bài tập ngẫu nhiên thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài tập ngẫu nhiên:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tải bài tập ngẫu nhiên",
        error: error.message
      });
    }
  },

  // Tạo bộ bài tập mới
  async create(req, res) {
    try {
      const exerciseSetData = req.body;
      
      // Kiểm tra dữ liệu
      if (!exerciseSetData.title || !exerciseSetData.lesson_id) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề và bài học là bắt buộc"
        });
      }

      // Kiểm tra trùng tiêu đề
      const isDuplicate = await baitap.checkDuplicateTitle(exerciseSetData.title);
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề bài tập đã tồn tại"
        });
      }

      const result = await baitap.create(exerciseSetData);
      
      res.status(201).json({
        success: true,
        data: { exercise_set_id: result.insertId },
        message: "Tạo bộ bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo bài tập",
        error: error.message
      });
    }
  },

  // Thêm câu hỏi vào bộ bài tập
  async addQuestion(req, res) {
    try {
      const questionData = req.body;
      
      if (!questionData.exercise_set_id || !questionData.question || !questionData.correct_answer) {
        return res.status(400).json({
          success: false,
          message: "Bộ bài tập, câu hỏi và đáp án là bắt buộc"
        });
      }

      const result = await baitap.addQuestion(questionData);
      
      res.status(201).json({
        success: true,
        data: { exercise_id: result.insertId },
        message: "Thêm câu hỏi thành công"
      });
    } catch (error) {
      console.error("Lỗi khi thêm câu hỏi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm câu hỏi",
        error: error.message
      });
    }
  },

  // Cập nhật bộ bài tập
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (updateData.title) {
        const isDuplicate = await baitap.checkDuplicateTitle(updateData.title, id);
        if (isDuplicate) {
          return res.status(400).json({
            success: false,
            message: "Tiêu đề bài tập đã tồn tại"
          });
        }
      }

      await baitap.update(id, updateData);
      
      res.json({
        success: true,
        message: "Cập nhật bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật bài tập",
        error: error.message
      });
    }
  },

  // Cập nhật câu hỏi
  async updateQuestion(req, res) {
    try {
      const { questionId } = req.params;
      const updateData = req.body;
      
      await baitap.updateQuestion(questionId, updateData);
      
      res.json({
        success: true,
        message: "Cập nhật câu hỏi thành công"
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật câu hỏi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật câu hỏi",
        error: error.message
      });
    }
  },

  // Xóa bộ bài tập
  async delete(req, res) {
    try {
      const { id } = req.params;
      await baitap.delete(id);
      
      res.json({
        success: true,
        message: "Xóa bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi xóa bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa bài tập",
        error: error.message
      });
    }
  },

  // Xóa bộ bài tập (alias cho delete)
  async remove(req, res) {
    return this.delete(req, res);
  },

  // Xóa câu hỏi
  async deleteQuestion(req, res) {
    try {
      const { questionId } = req.params;
      await baitap.deleteQuestion(questionId);
      
      res.json({
        success: true,
        message: "Xóa câu hỏi thành công"
      });
    } catch (error) {
      console.error("Lỗi khi xóa câu hỏi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa câu hỏi",
        error: error.message
      });
    }
  },

  // Xóa câu hỏi (alias cho deleteQuestion)
  async removeQuestion(req, res) {
    return this.deleteQuestion(req, res);
  },

  // Kiểm tra đáp án
  async checkAnswer(req, res) {
    try {
      const { exerciseId, userAnswer } = req.body;
      
      if (!exerciseId || !userAnswer) {
        return res.status(400).json({
          success: false,
          message: "ID bài tập và đáp án là bắt buộc"
        });
      }

      const result = await baitap.checkAnswer(exerciseId, userAnswer);
      
      res.json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      console.error("Lỗi khi kiểm tra đáp án:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra đáp án",
        error: error.message
      });
    }
  },

  // Nộp bài tập và nhận kết quả
  async submitExercise(req, res) {
    try {
      const { exerciseSetId, answers } = req.body;
      
      if (!exerciseSetId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: "ID bài tập và danh sách đáp án là bắt buộc"
        });
      }

      // Lấy thông tin bài tập và câu hỏi
      const exerciseSet = await baitap.getById(exerciseSetId);
      if (!exerciseSet) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài tập"
        });
      }

      const questions = await baitap.getWithQuestions(exerciseSetId);
      
      // Kiểm tra từng đáp án
      const results = [];
      let correctCount = 0;
      let totalQuestions = questions.length;

      for (const answer of answers) {
        const question = questions.find(q => q.exercise_id == answer.questionId);
        if (question) {
          const result = await baitap.checkAnswer(answer.questionId, answer.userAnswer);
          results.push({
            questionId: answer.questionId,
            question: question.question,
            userAnswer: answer.userAnswer,
            correctAnswer: question.correct_answer,
            isCorrect: result.isCorrect,
            explanation: question.explanation,
            options: question.options
          });
          
          if (result.isCorrect) {
            correctCount++;
          }
        }
      }

      // Tính điểm và kết quả tổng thể
      const score = Math.round((correctCount / totalQuestions) * 100);
      const grade = score >= 80 ? "Xuất sắc" : 
                   score >= 70 ? "Tốt" : 
                   score >= 60 ? "Khá" : 
                   score >= 50 ? "Trung bình" : "Cần cải thiện";

      res.json({
        success: true,
        data: {
          exerciseSet: {
            exercise_set_id: exerciseSet.exercise_set_id,
            title: exerciseSet.title,
            description: exerciseSet.description
          },
          summary: {
            totalQuestions,
            correctCount,
            incorrectCount: totalQuestions - correctCount,
            score,
            grade
          },
          results,
          message: `Bạn đã hoàn thành bài tập với ${correctCount}/${totalQuestions} câu đúng (${score}%)`
        },
        message: "Đã nộp bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi nộp bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi nộp bài tập",
        error: error.message
      });
    }
  },

  // Lấy thống kê bài tập
  async getStats(req, res) {
    try {
      const stats = await baitap.getStats();
      
      res.json({
        success: true,
        data: stats,
        message: "Đã tải thống kê bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message
      });
    }
  }
};

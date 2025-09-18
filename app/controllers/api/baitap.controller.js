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
      const isDuplicate = await baitap.checkDuplicateTitleForCreate(exerciseSetData.title);
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề bài tập đã tồn tại"
        });
      }

      const result = await baitap.create(exerciseSetData);
      
      res.status(201).json({
        success: true,
        data: { set_id: result.insertId },
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
      
      if (!questionData.set_id || !questionData.question || !questionData.correct_answer) {
        return res.status(400).json({
          success: false,
          message: "Bộ bài tập, câu hỏi và đáp án là bắt buộc"
        });
      }

      // Validate exercise_type
      const validTypes = [
        'multiple_choice', 'true_false', 'fill_blank', 'matching',
        'drag_drop', 'ordering', 'image_choice', 'dialog_cards',
        'image_sequencing', 'memory_game', 'writing'
      ];
      
      if (!questionData.exercise_type || !validTypes.includes(questionData.exercise_type)) {
        return res.status(400).json({
          success: false,
          message: "Loại câu hỏi không hợp lệ"
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
      const { setId, answers, userId } = req.body;
      
      if (!setId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: "ID bài tập và danh sách đáp án là bắt buộc"
        });
      }

      // Lấy thông tin bài tập và câu hỏi
      const exerciseSet = await baitap.getById(setId);
      if (!exerciseSet) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài tập"
        });
      }

      const questions = await baitap.getWithQuestions(setId);
      
      // Kiểm tra từng đáp án và lưu kết quả
      const results = [];
      let totalScore = 0; // Tổng điểm thực tế (có thể là số thập phân)
      let correctCount = 0; // Số câu được coi là đúng (>= 50%)
      let totalQuestions = questions.length;

      for (const answer of answers) {
        const question = questions.find(q => q.exercise_id == answer.questionId);
        if (question) {
          const result = await baitap.checkAnswer(answer.questionId, answer.userAnswer);
          
          // Tính điểm cho câu này (sử dụng partialScore nếu có)
          const questionScore = result.partialScore || (result.isCorrect ? 1 : 0);
          totalScore += questionScore;
          
          // Lưu kết quả vào database nếu có userId
          if (userId) {
            await baitap.saveExerciseResult({
              exercise_id: answer.questionId,
              user_id: userId,
              user_answer: JSON.stringify(answer.userAnswer),
              is_correct: result.isCorrect ? 1 : 0
            });
          }
          
          results.push({
            questionId: answer.questionId,
            question: question.question,
            userAnswer: answer.userAnswer,
            correctAnswer: question.correct_answer,
            isCorrect: result.isCorrect,
            explanation: question.explanation,
            options: question.options,
            // Thêm thông tin điểm chi tiết
            partialScore: questionScore,
            scoreDetails: result.correctPairs && result.totalPairs ? 
              `${result.correctPairs}/${result.totalPairs} cặp đúng` : 
              result.correctItems && result.totalItems ?
              `${result.correctItems}/${result.totalItems} mục đúng` : null
          });
          
          if (result.isCorrect) {
            correctCount++;
          }
        }
      }

      // Tính điểm tổng thể dựa trên tổng điểm thực tế
      const score = Math.round((totalScore / totalQuestions) * 100);
      const grade = score >= 80 ? "Xuất sắc" : 
                   score >= 70 ? "Tốt" : 
                   score >= 60 ? "Khá" : 
                   score >= 50 ? "Trung bình" : "Cần cải thiện";

      res.json({
        success: true,
        data: {
          exerciseSet: {
            set_id: exerciseSet.set_id,
            title: exerciseSet.title,
            description: exerciseSet.description
          },
          summary: {
            totalQuestions,
            correctCount,
            incorrectCount: totalQuestions - correctCount,
            totalScore: Math.round(totalScore * 100) / 100, // Làm tròn 2 chữ số thập phân
            score,
            grade,
            averageScore: Math.round((totalScore / totalQuestions) * 100)
          },
          results,
          message: `Bạn đã hoàn thành bài tập với ${correctCount}/${totalQuestions} câu đúng. Điểm số: ${score}% (${Math.round(totalScore * 100) / 100}/${totalQuestions} điểm)`
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
  },

  // Lấy kết quả làm bài của user
  async getUserResults(req, res) {
    try {
      const { userId } = req.params;
      const { setId, limit = 50, offset = 0 } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID là bắt buộc"
        });
      }

      const results = await baitap.getUserResults(userId, setId, limit, offset);
      
      res.json({
        success: true,
        data: results,
        message: "Đã tải kết quả làm bài thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy kết quả:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy kết quả",
        error: error.message
      });
    }
  },

  // Lấy thống kê chi tiết của user
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      const { setId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID là bắt buộc"
        });
      }

      const stats = await baitap.getUserStats(userId, setId);
      
      res.json({
        success: true,
        data: stats,
        message: "Đã tải thống kê user thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê user:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê user",
        error: error.message
      });
    }
  },

  // Lấy bài tập theo loại
  async getByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const validTypes = [
        'multiple_choice', 'true_false', 'fill_blank', 'matching',
        'drag_drop', 'ordering', 'image_choice', 'dialog_cards',
        'image_sequencing', 'memory_game', 'writing'
      ];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Loại câu hỏi không hợp lệ"
        });
      }

      const exercises = await baitap.getByType(type, limit, offset);
      
      res.json({
        success: true,
        data: exercises,
        message: `Đã tải bài tập loại ${type} thành công`
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài tập theo loại:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy bài tập theo loại",
        error: error.message
      });
    }
  },

  // Nhân bản câu hỏi
  async duplicateQuestion(req, res) {
    try {
      const { questionId } = req.params;
      
      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: "Question ID là bắt buộc"
        });
      }

      const result = await baitap.duplicateQuestion(questionId);
      
      res.status(201).json({
        success: true,
        data: { exercise_id: result.insertId },
        message: "Nhân bản câu hỏi thành công"
      });
    } catch (error) {
      console.error("Lỗi khi nhân bản câu hỏi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi nhân bản câu hỏi",
        error: error.message
      });
    }
  },

  // ===== LESSON-SPECIFIC APIS =====

  // Lấy bài tập chưa hoàn thành của user trong lesson
  async getIncompleteByLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID là bắt buộc"
        });
      }

      const incompleteExercises = await baitap.getIncompleteByLesson(lessonId, userId);
      
      res.json({
        success: true,
        data: incompleteExercises,
        message: "Đã tải bài tập chưa hoàn thành thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài tập chưa hoàn thành:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy bài tập chưa hoàn thành",
        error: error.message
      });
    }
  },

  // Gợi ý bài tập tiếp theo cho user trong lesson
  async getRecommendedExercises(req, res) {
    try {
      const { lessonId } = req.params;
      const { userId, limit = 5 } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID là bắt buộc"
        });
      }

      const recommendations = await baitap.getRecommendedExercises(lessonId, userId, limit);
      
      res.json({
        success: true,
        data: recommendations,
        message: "Đã tải gợi ý bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy gợi ý bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy gợi ý bài tập",
        error: error.message
      });
    }
  },

  // Lấy thống kê chi tiết của lesson
  async getLessonStats(req, res) {
    try {
      const { lessonId } = req.params;
      const { userId } = req.query;
      
      const stats = await baitap.getLessonStats(lessonId, userId);
      
      res.json({
        success: true,
        data: stats,
        message: "Đã tải thống kê lesson thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê lesson",
        error: error.message
      });
    }
  },

  // ===== HISTORY & RETRY APIS =====

  // Lấy lịch sử làm bài của user (tất cả bài tập)
  async getUserHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const history = await baitap.getUserHistory(userId, limit, offset);
      
      res.json({
        success: true,
        data: history,
        message: "Đã tải lịch sử làm bài thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử",
        error: error.message
      });
    }
  },

  // Lấy lịch sử làm bài cụ thể 1 set
  async getSetHistory(req, res) {
    try {
      const { userId, setId } = req.params;
      
      const history = await baitap.getSetHistory(userId, setId);
      
      res.json({
        success: true,
        data: history,
        message: "Đã tải lịch sử bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử bài tập",
        error: error.message
      });
    }
  },

  // Lấy câu trả lời sai để làm lại
  async getIncorrectAnswers(req, res) {
    try {
      const { userId, setId } = req.params;
      
      const incorrectAnswers = await baitap.getIncorrectAnswers(userId, setId);
      
      res.json({
        success: true,
        data: incorrectAnswers,
        message: "Đã tải câu trả lời sai thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy câu sai:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy câu sai",
        error: error.message
      });
    }
  }
};

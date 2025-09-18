// Kết nối MySQL
const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến bài tập
module.exports = {
  // Lấy danh sách bài tập (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM exercise_sets";
    if (search && search.trim()) sql += " WHERE title LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    const safeLimit = Math.max(1, parseInt(limit) || 10);
    
    sql += " ORDER BY set_id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  
  // Lấy danh sách bài tập (có thể có tìm kiếm)
  async getDs(search) {
    let sql = "SELECT * FROM exercise_sets";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?";
      const [rows] = await pool.query(sql, [`%${search.trim()}%`]);
      return rows;
    }
    const [rows] = await pool.query(sql);
    return rows;
  },

  // Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM exercise_sets";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  // Lấy chi tiết bài tập theo ID
  async getById(id) {
    const [result] = await pool.query(
      "SELECT * FROM exercise_sets WHERE set_id = ?",
      [id]
    );
    return result[0]; // trả về 1 object duy nhất
  },
  // Thêm bài tập mới
  async create(baitap) {
    const sql = `
      INSERT INTO exercise_sets (lesson_id, title, description) VALUES (?, ?, ?)
    `;
    const values = [baitap.lesson_id, baitap.title, baitap.description];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },
  // Thêm câu hỏi cho bài tập
  async createcauhoi(cauhoi) {
    // Validate required fields
    if (!cauhoi.set_id) {
      throw new Error('set_id is required');
    }
    if (!cauhoi.exercise_type) {
      throw new Error('exercise_type is required');
    }
    if (!cauhoi.question || cauhoi.question.trim() === '') {
      throw new Error('question is required');
    }

    // Ensure correct_answer is not null for database
    const processedCorrectAnswer = cauhoi.correct_answer || '';
    
    const sql = `
      INSERT INTO exercises (set_id, exercise_type, question, options, correct_answer, explanation, media, order_in_set) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      parseInt(cauhoi.set_id),
      cauhoi.exercise_type,
      cauhoi.question.trim(),
      cauhoi.options,
      processedCorrectAnswer,
      cauhoi.explanation,
      cauhoi.media,
      cauhoi.order_in_set || 0,
    ];
    
    console.log('Model inserting values:', values);
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của bản ghi vừa tạo
  },
  // Cập nhật bài tập
  async update(id, data) {
    const sql = `UPDATE exercise_sets SET ? WHERE set_id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa bài tập
  async delete(id) {
    const [result] = await pool.query("DELETE FROM exercise_sets WHERE set_id = ?", [
      id,
    ]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      `SELECT * FROM exercise_sets WHERE title = ? AND set_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
  async getDscauhoi(search) {
    const [rows] = await pool.query(
      "SELECT * FROM exercises WHERE set_id = ? ORDER BY order_in_set, exercise_id",
      [search]
    );
    return rows;
  },
  async getIdcauhoi(search) {
    const [rows] = await pool.query(
      "SELECT * FROM exercises WHERE exercise_id = ?",
      [search]
    );
    return rows[0];
  },
  async updatecauhoi(id, data) {
    const sql = `
      UPDATE exercises 
      SET exercise_type = ?, question = ?, options = ?, correct_answer = ?, explanation = ?
      WHERE exercise_id = ?
    `;
    const values = [
      data.exercise_type,
      data.question,
      data.options,
      data.correct_answer,
      data.explanation,
      parseInt(id)
    ];
    const [result] = await pool.query(sql, values);
    return result.affectedRows;
  },
  async deletecauhoi(id) {
    const [result] = await pool.query("DELETE FROM exercises WHERE exercise_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị ảnh hưởng
  },
  // Lấy bài tập kèm câu hỏi theo ID
  async getWithQuestions(exerciseSetId) {
    const sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        e.media,
        e.order_in_set
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      WHERE es.set_id = ?
      ORDER BY e.order_in_set, e.exercise_id
    `;
    const [rows] = await pool.query(sql, [exerciseSetId]);
    return rows;
  },

  // Lấy bài tập kèm câu hỏi theo bài học
  async getByLesson(lessonId) {
    const sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        e.media,
        e.order_in_set
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      WHERE es.lesson_id = ?
      ORDER BY es.set_id, e.order_in_set, e.exercise_id
    `;
    const [rows] = await pool.query(sql, [lessonId]);
    return rows;
  },

  // Lấy bài tập ngẫu nhiên
  async getRandomExercises(limit = 10, lessonId = null) {
    let sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description
      FROM exercise_sets es
    `;
    
    if (lessonId) {
      sql += ` WHERE es.lesson_id = ?`;
      sql += ` ORDER BY RAND() LIMIT ?`;
      const [rows] = await pool.query(sql, [lessonId, limit]);
      return rows;
    } else {
      sql += ` ORDER BY RAND() LIMIT ?`;
      const [rows] = await pool.query(sql, [limit]);
      return rows;
    }
  },

  // Kiểm tra đáp án của câu hỏi
  async checkAnswer(exerciseId, userAnswer) {
    const sql = `
      SELECT 
        exercise_id,
        exercise_type,
        question,
        options,
        correct_answer,
        explanation
      FROM exercises 
      WHERE exercise_id = ?
    `;
    
    const [rows] = await pool.query(sql, [exerciseId]);
    
    if (rows.length === 0) {
      return {
        isCorrect: false,
        message: "Không tìm thấy câu hỏi",
        correctAnswer: null,
        explanation: null
      };
    }

    const question = rows[0];
    const exerciseType = question.exercise_type;
    const correctAnswer = question.correct_answer;
    
    let isCorrect = false;
    
    try {
      switch (exerciseType) {
        case 'multiple_choice':
        case 'true_false':
        case 'writing':
          // So sánh string đơn giản, không phân biệt hoa thường
          isCorrect = String(userAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
          break;
          
        case 'image_choice':
          // So sánh số index
          isCorrect = parseInt(userAnswer) === parseInt(correctAnswer);
          break;
          
        case 'fill_blank':
        case 'ordering':
        case 'dialog_cards':
        case 'image_sequencing':
        case 'memory_game':
          // So sánh JSON array với chấm điểm từng phần
          const userArray = Array.isArray(userAnswer) ? userAnswer : JSON.parse(userAnswer);
          const correctArray = Array.isArray(correctAnswer) ? correctAnswer : JSON.parse(correctAnswer);
          
          if (exerciseType === 'fill_blank' || exerciseType === 'memory_game' || exerciseType === 'dialog_cards') {
            // Với fill_blank, memory_game, dialog_cards: chấm điểm từng phần
            const totalItems = correctArray.length;
            let correctItems = 0;
            
            // Hàm so sánh đặc biệt cho dialog_cards
            const compareDialogCards = (userItem, correctItem) => {
              if (exerciseType === 'dialog_cards') {
                // So sánh front/back không quan tâm thứ tự key
                return (userItem.front === correctItem.front && userItem.back === correctItem.back) ||
                       (userItem.front === correctItem.back && userItem.back === correctItem.front);
              } else {
                // Các loại khác so sánh bình thường
                return JSON.stringify(userItem) === JSON.stringify(correctItem);
              }
            };
            
            // Đếm số items đúng
            userArray.forEach(userItem => {
              if (correctArray.some(correctItem => compareDialogCards(userItem, correctItem))) {
                correctItems++;
              }
            });
            
            const partialScore = correctItems / totalItems;
            isCorrect = partialScore >= 0.5; // >= 50% mới pass
            
            question.partialScore = partialScore;
            question.correctItems = correctItems;
            question.totalItems = totalItems;
          } else {
            // Với ordering, image_sequencing: phải đúng hoàn toàn
            isCorrect = JSON.stringify(userArray.sort()) === JSON.stringify(correctArray.sort());
          }
          break;
          
        case 'matching':
        case 'drag_drop':
          // So sánh JSON object với chấm điểm từng phần
          const userObj = typeof userAnswer === 'object' ? userAnswer : JSON.parse(userAnswer);
          const correctObj = typeof correctAnswer === 'object' ? correctAnswer : JSON.parse(correctAnswer);
          
          // Hàm kiểm tra xem hai object có biểu diễn cùng một mối quan hệ không
          const checkMatchingPairs = (user, correct) => {
            const correctKeys = Object.keys(correct);
            const totalPairs = correctKeys.length;
            let correctPairs = 0;
            
            correctKeys.forEach(key => {
              const correctValue = correct[key];
              
              // Kiểm tra cả hai hướng: key->value và value->key
              if (user[key] === correctValue || user[correctValue] === key) {
                correctPairs++;
              }
            });
            
            return { correctPairs, totalPairs };
          };
          
          const result = checkMatchingPairs(userObj, correctObj);
          const correctPairs = result.correctPairs;
          const totalPairs = result.totalPairs;
          
          // Tính điểm theo tỷ lệ (>= 50% được coi là đúng)
          const partialScore = correctPairs / totalPairs;
          isCorrect = partialScore >= 0.5; // Đúng >= 50% mới pass
          
          // Lưu thông tin chi tiết để sử dụng sau
          question.partialScore = partialScore;
          question.correctPairs = correctPairs;
          question.totalPairs = totalPairs;
          break;
          
        default:
          // Fallback: so sánh string
          isCorrect = String(userAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
      }
    } catch (error) {
      console.error('Error comparing answers:', error);
      // Fallback: so sánh string nếu có lỗi parse JSON
      isCorrect = String(userAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
    }
    
    // Tạo message chi tiết cho các câu hỏi có điểm từng phần
    let message = isCorrect ? "Đáp án chính xác!" : "Đáp án không chính xác";
    if (question.partialScore !== undefined) {
      const percentage = Math.round(question.partialScore * 100);
      if (question.correctPairs !== undefined) {
        // Matching/drag_drop
        message = `${message} (${question.correctPairs}/${question.totalPairs} cặp đúng - ${percentage}%)`;
      } else if (question.correctItems !== undefined) {
        // Fill_blank/memory_game
        message = `${message} (${question.correctItems}/${question.totalItems} mục đúng - ${percentage}%)`;
      }
    }
    
    return {
      isCorrect,
      message,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      question: question.question,
      options: question.options,
      exerciseType: exerciseType,
      // Thêm thông tin điểm từng phần
      partialScore: question.partialScore || (isCorrect ? 1 : 0),
      correctPairs: question.correctPairs,
      totalPairs: question.totalPairs,
      correctItems: question.correctItems,
      totalItems: question.totalItems
    };
  },

  // Lấy thống kê bài tập
  async getStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT es.set_id) as totalExerciseSets,
        COUNT(e.exercise_id) as totalQuestions,
        COUNT(DISTINCT es.lesson_id) as totalLessons
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
    `;
    
    const [rows] = await pool.query(sql);
    return rows[0];
  },

  async getexercisesetsWithQuestions() {
    const sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        e.media,
        e.order_in_set
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      ORDER BY es.set_id, e.order_in_set, e.exercise_id
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // ===== CÁC HÀM MỚI CHO BẢNG EXERCISE_RESULTS =====
  
  // Lưu kết quả làm bài (UPDATE nếu đã tồn tại, INSERT nếu chưa có)
  async saveResult(result) {
    const sql = `
      INSERT INTO exercise_results (exercise_id, user_id, user_answer, is_correct, submitted_at) 
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        user_answer = VALUES(user_answer),
        is_correct = VALUES(is_correct),
        submitted_at = NOW()
    `;
    const values = [result.exercise_id, result.user_id, result.user_answer, result.is_correct];
    const [rows] = await pool.query(sql, values);
    return rows.insertId || rows.affectedRows;
  },

  // Lấy kết quả làm bài của user
  async getUserResults(userId, exerciseId = null) {
    let sql = `
      SELECT 
        er.result_id,
        er.exercise_id,
        er.user_id,
        er.user_answer,
        er.is_correct,
        er.submitted_at,
        e.exercise_type,
        e.question,
        es.title as exercise_set_title
      FROM exercise_results er
      LEFT JOIN exercises e ON er.exercise_id = e.exercise_id
      LEFT JOIN exercise_sets es ON e.set_id = es.set_id
      WHERE er.user_id = ?
    `;
    
    const params = [userId];
    if (exerciseId) {
      sql += ` AND er.exercise_id = ?`;
      params.push(exerciseId);
    }
    
    sql += ` ORDER BY er.submitted_at DESC`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // ===== CÁC HÀM MỚI CHO BẢNG EXERCISE_MEDIA =====
  
  // Lưu media file
  async saveMedia(media) {
    const sql = `
      INSERT INTO exercise_media (exercise_id, media_type, field_name, file_path, file_name) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [media.exercise_id, media.media_type, media.field_name, media.file_path, media.file_name];
    const [rows] = await pool.query(sql, values);
    return rows.insertId;
  },

  // Lấy media files của exercise
  async getExerciseMedia(exerciseId) {
    const sql = `
      SELECT * FROM exercise_media 
      WHERE exercise_id = ? 
      ORDER BY media_type, field_name
    `;
    const [rows] = await pool.query(sql, [exerciseId]);
    return rows;
  },

  // Xóa media file
  async deleteMedia(mediaId) {
    const [result] = await pool.query("DELETE FROM exercise_media WHERE media_id = ?", [mediaId]);
    return result.affectedRows;
  },

  // ===== CÁC HÀM BỔ SUNG CHO API =====

  // Thêm câu hỏi (alias cho createcauhoi)
  async addQuestion(questionData) {
    return await this.createcauhoi(questionData);
  },

  // Cập nhật câu hỏi (alias cho updatecauhoi)
  async updateQuestion(questionId, data) {
    return await this.updatecauhoi(questionId, data);
  },

  // Xóa câu hỏi (alias cho deletecauhoi)
  async deleteQuestion(questionId) {
    return await this.deletecauhoi(questionId);
  },

  // Lưu kết quả làm bài (alias cho saveResult)
  async saveExerciseResult(resultData) {
    return await this.saveResult(resultData);
  },

  // Lấy bài tập theo loại
  async getByType(exerciseType, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        COUNT(e.exercise_id) as question_count
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      WHERE e.exercise_type = ?
      GROUP BY es.set_id
      ORDER BY es.created_at DESC
      LIMIT ?, ?
    `;
    const [rows] = await pool.query(sql, [exerciseType, parseInt(offset), parseInt(limit)]);
    return rows;
  },

  // Lấy thống kê chi tiết của user
  async getUserStats(userId, setId = null) {
    let sql = `
      SELECT 
        COUNT(DISTINCT er.exercise_id) as totalAttempted,
        SUM(er.is_correct) as totalCorrect,
        COUNT(er.result_id) as totalSubmissions,
        AVG(er.is_correct * 100) as averageScore,
        MAX(er.submitted_at) as lastSubmission
      FROM exercise_results er
      LEFT JOIN exercises e ON er.exercise_id = e.exercise_id
      WHERE er.user_id = ?
    `;
    
    const params = [userId];
    if (setId) {
      sql += ` AND e.set_id = ?`;
      params.push(setId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  // Nhân bản câu hỏi
  async duplicateQuestion(questionId) {
    // Lấy thông tin câu hỏi gốc
    const originalQuestion = await this.getIdcauhoi(questionId);
    if (!originalQuestion) {
      throw new Error('Không tìm thấy câu hỏi để nhân bản');
    }

    // Tạo câu hỏi mới với nội dung giống hệt
    const duplicateData = {
      set_id: originalQuestion.set_id,
      exercise_type: originalQuestion.exercise_type,
      question: `[Bản sao] ${originalQuestion.question}`,
      options: originalQuestion.options,
      correct_answer: originalQuestion.correct_answer,
      explanation: originalQuestion.explanation,
      media: originalQuestion.media,
      order_in_set: originalQuestion.order_in_set
    };

    const newQuestionId = await this.createcauhoi(duplicateData);
    return { insertId: newQuestionId };
  },

  // Kiểm tra trùng tiêu đề khi tạo mới
  async checkDuplicateTitleForCreate(title) {
    const [result] = await pool.query(
      `SELECT * FROM exercise_sets WHERE title = ?`,
      [title]
    );
    return result.length > 0;
  },

  // Lấy bài tập theo độ khó (nếu có field difficulty)
  async getByDifficulty(difficulty, limit = 20) {
    const sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        COUNT(e.exercise_id) as question_count
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      GROUP BY es.set_id
      ORDER BY es.created_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [parseInt(limit)]);
    return rows;
  },

  // ===== LESSON-SPECIFIC FUNCTIONS =====

  // Lấy bài tập chưa hoàn thành của user trong lesson
  async getIncompleteByLesson(lessonId, userId) {
    const sql = `
      SELECT DISTINCT
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        e.order_in_set
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      LEFT JOIN exercise_results er ON e.exercise_id = er.exercise_id AND er.user_id = ?
      WHERE es.lesson_id = ? 
        AND e.exercise_id IS NOT NULL
        AND (er.is_correct IS NULL OR er.is_correct = 0)
      ORDER BY es.set_id, e.order_in_set, e.exercise_id
    `;
    const [rows] = await pool.query(sql, [userId, lessonId]);
    return rows;
  },

  // Gợi ý bài tập tiếp theo dựa trên performance
  async getRecommendedExercises(lessonId, userId, limit = 5) {
    const sql = `
      SELECT 
        es.set_id,
        es.lesson_id,
        es.title,
        es.description,
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        e.order_in_set,
        COALESCE(user_stats.attempts, 0) as attempts,
        COALESCE(user_stats.success_rate, 0) as success_rate
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      LEFT JOIN (
        SELECT 
          exercise_id,
          COUNT(*) as attempts,
          AVG(is_correct) * 100 as success_rate
        FROM exercise_results 
        WHERE user_id = ?
        GROUP BY exercise_id
      ) user_stats ON e.exercise_id = user_stats.exercise_id
      WHERE es.lesson_id = ? 
        AND e.exercise_id IS NOT NULL
        AND (user_stats.success_rate < 80 OR user_stats.success_rate IS NULL)
      ORDER BY 
        CASE 
          WHEN user_stats.success_rate IS NULL THEN 1
          ELSE 2
        END,
        user_stats.success_rate ASC,
        e.order_in_set ASC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [userId, lessonId, parseInt(limit)]);
    return rows;
  },

  // Lấy thống kê chi tiết của lesson
  async getLessonStats(lessonId, userId = null) {
    let sql = `
      SELECT 
        COUNT(DISTINCT es.set_id) as totalExerciseSets,
        COUNT(e.exercise_id) as totalQuestions,
        COUNT(DISTINCT e.exercise_type) as totalQuestionTypes
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      WHERE es.lesson_id = ?
    `;
    
    const params = [lessonId];
    const [basicStats] = await pool.query(sql, params);
    
    let result = basicStats[0];
    
    // Nếu có userId, thêm thống kê cá nhân
    if (userId) {
      const userStatsSql = `
        SELECT 
          COUNT(DISTINCT er.exercise_id) as completedQuestions,
          SUM(er.is_correct) as correctAnswers,
          COUNT(er.result_id) as totalAttempts,
          AVG(er.is_correct * 100) as averageScore,
          MAX(er.submitted_at) as lastActivity
        FROM exercise_results er
        LEFT JOIN exercises e ON er.exercise_id = e.exercise_id
        LEFT JOIN exercise_sets es ON e.set_id = es.set_id
        WHERE es.lesson_id = ? AND er.user_id = ?
      `;
      
      const [userStats] = await pool.query(userStatsSql, [lessonId, userId]);
      result = { ...result, ...userStats[0] };
      
      // Tính progress percentage
      result.progressPercentage = result.totalQuestions > 0 
        ? Math.round((result.completedQuestions / result.totalQuestions) * 100)
        : 0;
    }
    
    return result;
  },

  // ===== HISTORY & RETRY FUNCTIONS =====

  // Lấy lịch sử làm bài của user (tất cả bài tập)
  async getUserHistory(userId, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        es.set_id,
        es.title as exercise_title,
        es.lesson_id,
        COUNT(DISTINCT e.exercise_id) as total_questions,
        COUNT(er.result_id) as attempted_questions,
        SUM(er.is_correct) as correct_answers,
        ROUND(AVG(er.is_correct * 100), 2) as score,
        MAX(er.submitted_at) as last_attempt,
        MIN(er.submitted_at) as first_attempt
      FROM exercise_sets es
      LEFT JOIN exercises e ON es.set_id = e.set_id
      LEFT JOIN exercise_results er ON e.exercise_id = er.exercise_id AND er.user_id = ?
      WHERE er.user_id IS NOT NULL
      GROUP BY es.set_id
      ORDER BY last_attempt DESC
      LIMIT ?, ?
    `;
    const [rows] = await pool.query(sql, [userId, parseInt(offset), parseInt(limit)]);
    return rows;
  },

  // Lấy lịch sử làm bài cụ thể 1 set
  async getSetHistory(userId, setId) {
    const sql = `
      SELECT 
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        er.user_answer,
        er.is_correct,
        er.submitted_at,
        COUNT(er2.result_id) as attempt_count
      FROM exercises e
      LEFT JOIN exercise_results er ON e.exercise_id = er.exercise_id AND er.user_id = ?
      LEFT JOIN exercise_results er2 ON e.exercise_id = er2.exercise_id AND er2.user_id = ?
      WHERE e.set_id = ?
      GROUP BY e.exercise_id, er.result_id
      ORDER BY e.order_in_set, e.exercise_id, er.submitted_at DESC
    `;
    const [rows] = await pool.query(sql, [userId, userId, setId]);
    return rows;
  },

  // Lấy câu trả lời sai để làm lại
  async getIncorrectAnswers(userId, setId) {
    const sql = `
      SELECT 
        e.exercise_id,
        e.exercise_type,
        e.question,
        e.options,
        e.correct_answer,
        e.explanation,
        er.user_answer,
        er.submitted_at,
        (SELECT COUNT(*) 
         FROM exercise_results er3 
         WHERE er3.exercise_id = e.exercise_id 
           AND er3.user_id = ? 
           AND er3.is_correct = 0
        ) as wrong_attempts
      FROM exercises e
      INNER JOIN exercise_results er ON e.exercise_id = er.exercise_id
      WHERE e.set_id = ? 
        AND er.user_id = ? 
        AND er.is_correct = 0
        AND er.submitted_at = (
          SELECT MAX(submitted_at) 
          FROM exercise_results 
          WHERE exercise_id = e.exercise_id AND user_id = ?
        )
      ORDER BY er.submitted_at DESC
    `;
    const [rows] = await pool.query(sql, [userId, setId, userId, userId]);
    return rows;
  }
};

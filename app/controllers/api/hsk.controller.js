const hskModel = require("../../models/hsk");

module.exports = {
  // Helper function để chuyển đổi datetime sang MySQL format
  formatDateTime(date) {
    if (!date) return null;
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  },

  // Helper function để kiểm tra đáp án và tính điểm từng phần
  checkAnswer(question, userAnswer) {
    if (!question.correct_answer || !userAnswer) return { isCorrect: false, points: 0, partialScore: 0 };
    
    const correctAnswer = question.correct_answer.trim();
    const userAns = userAnswer.trim();
    
    // So sánh trực tiếp (không phân biệt hoa thường)
    if (correctAnswer.toLowerCase() === userAns.toLowerCase()) {
      return { isCorrect: true, points: question.points, partialScore: question.points };
    }
    
    // Xử lý các trường hợp đặc biệt
    if (question.question_type === 'multiple_choice') {
      // Chuyển đổi A,B,C,D thành 0,1,2,3
      const letterToNumber = { 'A': '0', 'B': '1', 'C': '2', 'D': '3' };
      const userNum = letterToNumber[userAns.toUpperCase()];
      if (userNum && correctAnswer === userNum) {
        return { isCorrect: true, points: question.points, partialScore: question.points };
      }
    }
    
    // Xử lý true/false
    if (question.question_type === 'true_false') {
      const userBool = userAns.toLowerCase();
      if ((correctAnswer === 'true' && userBool === 'true') ||
          (correctAnswer === 'false' && userBool === 'false')) {
        return { isCorrect: true, points: question.points, partialScore: question.points };
      }
    }
    
    // Xử lý fill_blank (có thể có nhiều chỗ trống) - TÍNH ĐIỂM TỪNG PHẦN
    if (question.question_type === 'fill_blank') {
      // Đáp án có thể là "A,A,A" hoặc "A,B,C" cho nhiều chỗ trống
      const correctAnswers = correctAnswer.split(',');
      const userAnswers = userAns.split(',');
      
      if (correctAnswers.length !== userAnswers.length) {
        return { isCorrect: false, points: 0, partialScore: 0 };
      }
      
      // Đếm số chỗ trống đúng
      let correctBlanks = 0;
      for (let i = 0; i < correctAnswers.length; i++) {
        if (correctAnswers[i].trim() === userAnswers[i].trim()) {
          correctBlanks++;
        }
      }
      
      // Tính điểm từng phần
      const totalBlanks = correctAnswers.length;
      const partialScore = Math.round((correctBlanks / totalBlanks) * question.points);
      const isFullyCorrect = correctBlanks === totalBlanks;
      
      return { 
        isCorrect: isFullyCorrect, 
        points: isFullyCorrect ? question.points : partialScore, 
        partialScore: partialScore 
      };
    }
    
    // Xử lý matching (ghép nối) - TÍNH ĐIỂM TỪNG PHẦN
    if (question.question_type === 'matching') {
      // Đáp án có thể là "A-1,B-2,C-3" hoặc "A-1,B-2"
      const correctPairsArray = correctAnswer.split(',').map(pair => pair.trim());
      const userPairs = userAns.split(',').map(pair => pair.trim());
      
      if (correctPairsArray.length !== userPairs.length) {
        return { isCorrect: false, points: 0, partialScore: 0 };
      }
      
      // Đếm số cặp ghép nối đúng
      let correctPairsCount = 0;
      const sortedCorrect = correctPairsArray.sort();
      const sortedUser = userPairs.sort();
      
      for (let i = 0; i < sortedCorrect.length; i++) {
        if (sortedCorrect[i] === sortedUser[i]) {
          correctPairsCount++;
        }
      }
      
      // Tính điểm từng phần
      const totalPairs = correctPairsArray.length;
      const partialScore = Math.round((correctPairsCount / totalPairs) * question.points);
      const isFullyCorrect = correctPairsCount === totalPairs;
      
      return { 
        isCorrect: isFullyCorrect, 
        points: isFullyCorrect ? question.points : partialScore, 
        partialScore: partialScore 
      };
    }
    
    // Xử lý ordering (sắp xếp) - TÍNH ĐIỂM TỪNG PHẦN
    if (question.question_type === 'ordering') {
      // Đáp án có thể là "1,2,3,4" hoặc "2,1,3,4"
      const correctOrder = correctAnswer.split(',').map(num => num.trim());
      const userOrder = userAns.split(',').map(num => num.trim());
      
      if (correctOrder.length !== userOrder.length) {
        return { isCorrect: false, points: 0, partialScore: 0 };
      }
      
      // Đếm số vị trí đúng thứ tự
      let correctPositions = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (correctOrder[i] === userOrder[i]) {
          correctPositions++;
        }
      }
      
      // Tính điểm từng phần
      const totalPositions = correctOrder.length;
      const partialScore = Math.round((correctPositions / totalPositions) * question.points);
      const isFullyCorrect = correctPositions === totalPositions;
      
      return { 
        isCorrect: isFullyCorrect, 
        points: isFullyCorrect ? question.points : partialScore, 
        partialScore: partialScore 
      };
    }
    
    return { isCorrect: false, points: 0, partialScore: 0 };
  },

  // 1. Lấy danh sách đề thi
  async getTests(req, res) {
    try {
      const { level, status, page = 1, limit = 20 } = req.query;
      
      // Parse query parameters
      const offset = (page - 1) * limit;
      const filters = {};
      
      if (level) filters.level = parseInt(level);
      if (status) filters.status = status;
      
      // Lấy danh sách đề thi
      const tests = await hskModel.getTests({ 
        search: '', 
        level: filters.level, 
        offset, 
        limit: parseInt(limit) 
      });
      
      // Lấy tổng số đề thi
      const total = await hskModel.getTestsTotal({ 
        search: '', 
        level: filters.level 
      });
      
      // Tính toán pagination
      const totalPages = Math.ceil(total / limit);
      
      res.json({
        success: true,
        data: {
          tests: tests.map(test => ({
            test_id: test.test_id,
            hsk_level: test.hsk_level,
            title: test.title,
            description: test.description,
            total_questions: test.total_questions,
            time_limit: test.time_limit,
            passing_score: test.passing_score,
            randomize_questions: test.randomize_questions,
            status: test.status,
            is_active: test.is_active
          })),
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Error getting tests:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đề thi',
        error: error.message
      });
    }
  },

  // ===== PHASE 3 - PRACTICE, SEARCH, ANALYTICS, SESSION =====

  // 10. Luyện tập theo kỹ năng
  async getPracticeQuestions(req, res) {
    try {
      const { skillType } = req.params; // listening | reading | writing
      const { level, limit = 10, difficulty } = req.query;

      // Lấy câu hỏi theo kỹ năng (và level nếu có)
      let sql = `
        SELECT q.* FROM HSKQuestions q
        JOIN hsktests t ON q.test_id = t.test_id
        WHERE q.skill_type = ?
      `;
      const vals = [skillType];
      if (level) {
        sql += ' AND t.hsk_level = ?';
        vals.push(parseInt(level));
      }
      if (difficulty) {
        sql += ' AND q.difficulty_level = ?';
        vals.push(difficulty);
      }
      sql += ' ORDER BY RAND() LIMIT ?';
      vals.push(parseInt(limit));

      const rows = await hskModel._raw(sql, vals);

      const questions = (rows || []).map((q) => ({
        question_id: q.question_id,
        question_type: q.question_type,
        skill_type: q.skill_type,
        question_text: q.question_text,
        audio_url: q.audio_url,
        image_url: q.image_url,
        options: (() => { try { return typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch { return []; } })(),
        points: q.points,
        difficulty_level: q.difficulty_level
      }));

      res.json({ success: true, data: { skill_type: skillType, level: level ? parseInt(level) : undefined, questions } });
    } catch (error) {
      console.error('❌ Error getting practice questions:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy câu hỏi luyện tập', error: error.message });
    }
  },

  // 11. Tìm kiếm đề thi
  async searchTests(req, res) {
    try {
      const { q = '', level, status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      const tests = await hskModel.getTests({ search: q, level: level ? parseInt(level) : undefined, status, offset, limit: parseInt(limit) });
      const total = await hskModel.getTestsTotal({ search: q, level: level ? parseInt(level) : undefined, status });
      const totalPages = Math.ceil(total / limit);

      res.json({ success: true, data: { tests, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: totalPages } } });
    } catch (error) {
      console.error('❌ Error searching tests:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm đề thi', error: error.message });
    }
  },

  // 12. Phân tích điểm yếu cá nhân
  async getUserWeaknesses(req, res) {
    try {
      const { userId } = req.params;
      // Lấy 50 câu trả lời gần nhất
      const sql = `
        SELECT ua.question_id, ua.user_answer, ua.is_correct, q.skill_type, q.question_type, t.hsk_level
        FROM hskuseranswers ua
        JOIN hskresults r ON ua.result_id = r.result_id
        JOIN HSKQuestions q ON ua.question_id = q.question_id
        JOIN hsktests t ON q.test_id = t.test_id
        WHERE r.user_id = ?
        ORDER BY ua.created_at DESC
        LIMIT 50
      `;
      const rows = await hskModel._raw(sql, [userId]);

      const skillAgg = { listening: { wrong: 0, total: 0 }, reading: { wrong: 0, total: 0 }, writing: { wrong: 0, total: 0 } };
      const typeAgg = {};
      rows.forEach(r => {
        if (!skillAgg[r.skill_type]) skillAgg[r.skill_type] = { wrong: 0, total: 0 };
        skillAgg[r.skill_type].total += 1;
        if (!r.is_correct) skillAgg[r.skill_type].wrong += 1;
        if (!typeAgg[r.question_type]) typeAgg[r.question_type] = { wrong: 0, total: 0 };
        typeAgg[r.question_type].total += 1;
        if (!r.is_correct) typeAgg[r.question_type].wrong += 1;
      });

      // Xác định điểm yếu: tỷ lệ sai cao
      const skills = Object.keys(skillAgg).map(k => ({ skill_type: k, wrong: skillAgg[k].wrong, total: skillAgg[k].total, wrong_rate: skillAgg[k].total ? Math.round((skillAgg[k].wrong / skillAgg[k].total) * 100) : 0 }));
      const types = Object.keys(typeAgg).map(k => ({ question_type: k, wrong: typeAgg[k].wrong, total: typeAgg[k].total, wrong_rate: typeAgg[k].total ? Math.round((typeAgg[k].wrong / typeAgg[k].total) * 100) : 0 }));

      res.json({ success: true, data: { user_id: parseInt(userId), weaknesses: { by_skill: skills, by_type: types } } });
    } catch (error) {
      console.error('❌ Error getting user weaknesses:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi phân tích điểm yếu', error: error.message });
    }
  },

  // 13. Lưu phiên làm bài (auto-save)
  async saveSessionProgress(req, res) {
    try {
      const { result_id, answers_snapshot, time_spent } = req.body;
      if (!result_id) {
        return res.status(400).json({ success: false, message: 'result_id là bắt buộc' });
      }
      // Lưu ảnh chụp phiên vào bảng HSKResults (các cột JSON/snapshot nếu có)
      const data = { time_spent: time_spent || 0 };
      await hskModel.updateResult(result_id, data);
      // Tuỳ chọn: lưu snapshot vào bảng riêng nếu muốn
      res.json({ success: true, data: { result_id: parseInt(result_id), saved: true } });
    } catch (error) {
      console.error('❌ Error saving session progress:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lưu phiên làm bài', error: error.message });
    }
  },
  // 2. Chi tiết đề thi
  async getTestById(req, res) {
    try {
      const { testId } = req.params;
  
      
      // Lấy thông tin đề thi
      const test = await hskModel.getTestById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đề thi'
        });
      }
      
      // Lấy số câu hỏi
      const questions = await hskModel.getQuestionsByTest(testId);
      const questionCount = questions.length;
      
      // Tính thời gian ước tính (nếu không có time_limit)
      const estimatedTime = test.time_limit || (questionCount * 2); // 2 phút/câu hỏi
      
      res.json({
        success: true,
        data: {
          test: {
            test_id: test.test_id,
            hsk_level: test.hsk_level,
            title: test.title,
            description: test.description,
            total_questions: test.total_questions,
            time_limit: test.time_limit,
            passing_score: test.passing_score,
            randomize_questions: test.randomize_questions,
            status: test.status,
            is_active: test.is_active
          },
          question_count: questionCount,
          estimated_time: estimatedTime,
          can_take: test.is_active && test.status === 'public'
        }
      });
    } catch (error) {
      console.error('❌ Error getting test by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin đề thi',
        error: error.message
      });
    }
  },

  // 3. Bắt đầu bài thi
  async startTest(req, res) {
    try {
      const { testId } = req.params;
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id là bắt buộc'
        });
      }
      
      // Kiểm tra user có tồn tại không
      const userModel = require('../../models/user');
      const user = await userModel.getById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng với ID: ' + user_id
        });
      }
      
      // Kiểm tra đề thi
      const test = await hskModel.getTestById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đề thi'
        });
      }
      
      if (!test.is_active || test.status !== 'public') {
        return res.status(400).json({
          success: false,
          message: 'Đề thi không khả dụng'
        });
      }
      
             // Tạo kết quả bài thi mới
       const resultData = {
         user_id: parseInt(user_id),
         test_id: parseInt(testId),
         status: 'in_progress',
         started_at: module.exports.formatDateTime(new Date()),
         total_questions: test.total_questions,
         time_limit: test.time_limit
       };
      
      const resultId = await hskModel.createResult(resultData);
      
      res.json({
        success: true,
        data: {
          result_id: resultId,
          test_info: {
            test_id: test.test_id,
            title: test.title,
            hsk_level: test.hsk_level,
            total_questions: test.total_questions,
            time_limit: test.time_limit,
            passing_score: test.passing_score
          },
          started_at: resultData.started_at,
          time_limit: test.time_limit,
          total_questions: test.total_questions
        }
      });
    } catch (error) {
      console.error('❌ Error starting test:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi bắt đầu bài thi',
        error: error.message
      });
    }
  },

  // 4. Lấy câu hỏi bài thi
  async getTestQuestions(req, res) {
    try {
      const { testId } = req.params;
      const { result_id, randomize } = req.query;
      
      // Kiểm tra đề thi
      const test = await hskModel.getTestById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đề thi'
        });
      }
      
      // Lấy câu hỏi
      let questions = await hskModel.getQuestionsByTest(testId);
      
      // Xử lý randomize nếu cần
      if (randomize === 'true' || test.randomize_questions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }
      
      // Format câu hỏi cho frontend (ẩn đáp án đúng nhưng giữ cấu trúc câu hỏi)
      const formattedQuestions = questions.map(q => ({
        question_id: q.question_id,
        question_type: q.question_type,
        skill_type: q.skill_type,
        question_text: q.question_text,
        audio_url: q.audio_url,
        image_url: q.image_url,
        options: q.options,
        points: q.points,
        order_in_test: q.order_in_test,
        difficulty_level: q.difficulty_level,
        // Giữ các trường cấu trúc câu hỏi nhưng ẩn đáp án đúng
        matching_pairs: q.matching_pairs,
        ordering_items: q.ordering_items,
        rewrite_instruction: q.rewrite_instruction,
        // Ẩn đáp án đúng và giải thích
        // correct_answer: q.correct_answer,
        // explanation: q.explanation
      }));
      
      res.json({
        success: true,
        data: {
          test_id: parseInt(testId),
          total_questions: questions.length,
          questions: formattedQuestions
        }
      });
    } catch (error) {
      console.error('❌ Error getting test questions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy câu hỏi bài thi',
        error: error.message
      });
    }
  },

  // 5. Nộp bài thi
  async submitTest(req, res) {
    try {
      const { resultId } = req.params;
      const { answers, ended_at, time_spent } = req.body;
      
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đáp án không hợp lệ'
        });
      }
      
      // Lấy thông tin kết quả
      const result = await hskModel.getResultById(resultId);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kết quả bài thi'
        });
      }
      
      // Lấy câu hỏi để chấm điểm
      const questions = await hskModel.getQuestionsByTest(result.test_id);
      const questionMap = {};
      questions.forEach(q => {
        questionMap[q.question_id] = q;
      });
      
      // Chấm điểm
      let totalScore = 0;
      let correctAnswers = 0;
      let listeningScore = 0;
      let readingScore = 0;
      let writingScore = 0;
      
      const answerDetails = [];
      
             for (const answer of answers) {
         const question = questionMap[answer.question_id];
         if (!question) continue;
         
                   const result = module.exports.checkAnswer(question, answer.user_answer);
         const points = result.points;
         
         // Tính điểm theo kỹ năng
         if (question.skill_type === 'listening') {
           listeningScore += points;
         } else if (question.skill_type === 'reading') {
           readingScore += points;
         } else if (question.skill_type === 'writing') {
           writingScore += points;
         }
         
         totalScore += points;
         if (result.isCorrect) correctAnswers++;
         
         // Lưu chi tiết đáp án
         answerDetails.push({
           question_id: answer.question_id,
           user_answer: answer.user_answer,
           is_correct: result.isCorrect,
           points: points,
           partial_score: result.partialScore
         });
       }
      
      // Kiểm tra đạt/không đạt
      const test = await hskModel.getTestById(result.test_id);
      const passed = totalScore >= test.passing_score;
      
                   // Cập nhật kết quả
      const updateData = {
        status: 'graded',
        ended_at: module.exports.formatDateTime(ended_at || new Date()),
        time_spent: time_spent || 0,
        total_score: totalScore,
        listening_score: listeningScore,
        reading_score: readingScore,
        writing_score: writingScore,
        is_passed: passed ? 1 : 0
      };
      
      await hskModel.completeTest(resultId, updateData);
      
      // Lưu chi tiết đáp án
      for (let i = 0; i < answerDetails.length; i++) {
        const answerDetail = answerDetails[i];
        await hskModel.createUserAnswer({
          result_id: resultId,
          question_id: answerDetail.question_id,
          user_answer: answerDetail.user_answer,
          is_correct: answerDetail.is_correct,
          score: answerDetail.points,
          question_order: i + 1,
          time_spent: 0, // Có thể tính từ frontend
          feedback: null
        });
      }
      
      res.json({
        success: true,
        data: {
          result_id: parseInt(resultId),
          total_score: totalScore,
          listening_score: listeningScore,
          reading_score: readingScore,
          writing_score: writingScore,
          passed: passed,
          correct_answers: correctAnswers,
          total_questions: questions.length,
          time_spent: time_spent || 0,
          passing_score: test.passing_score
        }
      });
    } catch (error) {
      console.error('❌ Error submitting test:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nộp bài thi',
        error: error.message
      });
    }
  },

  // ===== PHASE 2 - RESULTS & ANALYTICS =====

  // 6. Chi tiết kết quả bài thi
  async getResultById(req, res) {
    try {
      const { resultId } = req.params;
      
      // Lấy thông tin kết quả
      const result = await hskModel.getResultById(resultId);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kết quả bài thi'
        });
      }
      
      // Lấy thông tin đề thi
      const test = await hskModel.getTestById(result.test_id);
      
      // Lấy chi tiết đáp án của user
      const userAnswers = await hskModel.getUserAnswersByResult(resultId);
      
      // Tính toán thời gian làm bài
      const timeSpent = result.time_spent || 0;
      const timeLimit = result.time_limit || 0;
      const timeEfficiency = timeLimit > 0 ? Math.round((timeSpent / timeLimit) * 100) : 0;
      
      // Tính điểm trung bình theo kỹ năng
      const skillStats = {
        listening: {
          score: result.listening_score || 0,
          percentage: 0
        },
        reading: {
          score: result.reading_score || 0,
          percentage: 0
        },
        writing: {
          score: result.writing_score || 0,
          percentage: 0
        }
      };
      
      // Tính phần trăm điểm theo kỹ năng
      const totalPossibleScore = test.total_questions * 3; // Giả sử mỗi câu 3 điểm
      if (totalPossibleScore > 0) {
        skillStats.listening.percentage = Math.round((skillStats.listening.score / totalPossibleScore) * 100);
        skillStats.reading.percentage = Math.round((skillStats.reading.score / totalPossibleScore) * 100);
        skillStats.writing.percentage = Math.round((skillStats.writing.score / totalPossibleScore) * 100);
      }
      
      res.json({
        success: true,
        data: {
          result: {
            result_id: result.result_id,
            user_id: result.user_id,
            test_id: result.test_id,
            status: result.status,
            started_at: result.started_at,
            ended_at: result.ended_at,
            time_spent: timeSpent,
            time_limit: timeLimit,
            time_efficiency: timeEfficiency,
            total_score: result.total_score,
            listening_score: result.listening_score,
            reading_score: result.reading_score,
            writing_score: result.writing_score,
            passed: result.passed,
            total_questions: result.total_questions
          },
          test: {
            test_id: test.test_id,
            title: test.title,
            hsk_level: test.hsk_level,
            passing_score: test.passing_score
          },
          skill_stats: skillStats,
          answers: userAnswers.map(answer => ({
            // Thông tin từ bảng hskuseranswers
            answer_id: answer.answer_id,
            result_id: answer.result_id,
            question_id: answer.question_id,
            user_answer: answer.user_answer,
            is_correct: answer.is_correct,
            score: answer.score,
            question_order: answer.question_order,
            time_spent: answer.time_spent,
            feedback: answer.feedback,
            graded_at: answer.graded_at,
            created_at: answer.created_at,
            
            // Thông tin từ bảng HSKQuestions
            test_id: answer.test_id,
            question_type: answer.question_type,
            question_text: answer.question_text,
            audio_url: answer.audio_url,
            image_url: answer.image_url,
            options: answer.options,
            correct_answer: answer.correct_answer,
            explanation: answer.explanation,
            difficulty_level: answer.difficulty_level,
            points: answer.points,
            order_in_test: answer.order_in_test,
            matching_pairs: answer.matching_pairs,
            ordering_items: answer.ordering_items,
            rewrite_instruction: answer.rewrite_instruction
          }))
        }
      });
    } catch (error) {
      console.error('❌ Error getting result by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết kết quả',
        error: error.message
      });
    }
  },

  // 7. Lịch sử bài thi của user
  async getUserResults(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, test_id } = req.query;
      
      const offset = (page - 1) * limit;
      const options = {
        limit: parseInt(limit),
        test_id: test_id ? parseInt(test_id) : null
      };
      
      // Lấy lịch sử bài thi
      const results = await hskModel.getUserResults(userId, options);
      
      // Lấy tổng số bài thi
      const allResults = await hskModel.getUserResults(userId, {});
      const total = allResults.length;
      const totalPages = Math.ceil(total / limit);
      
      // Format kết quả
      const formattedResults = results.map(result => ({
        result_id: result.result_id,
        test_id: result.test_id,
        test_title: result.test_title,
        hsk_level: result.hsk_level,
        status: result.status,
        started_at: result.started_at,
        ended_at: result.ended_at,
        time_spent: result.time_spent,
        total_score: result.total_score,
        passed: result.passed || false,
        total_questions: result.total_questions
      }));
      
      res.json({
        success: true,
        data: {
          user_id: parseInt(userId),
          results: formattedResults,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Error getting user results:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử bài thi',
        error: error.message
      });
    }
  },

  // 8. Thống kê cá nhân
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      
      // Lấy thống kê tổng quan
      const stats = await hskModel.getUserStats(userId);
      
      // Lấy thống kê theo level
      const levelStats = await hskModel.getUserLevelStats(userId);
      
      // Tính toán các chỉ số bổ sung
      const passRate = stats.total_tests > 0 ? Math.round((stats.passed_tests / stats.total_tests) * 100) : 0;
      const avgTimePerTest = stats.total_tests > 0 ? Math.round((stats.total_time_spent || 0) / stats.total_tests) : 0;
      
      // Phân tích xu hướng
      const recentResults = await hskModel.getUserResults(userId, { limit: 5 });
      const recentScores = recentResults.map(r => r.total_score);
      const scoreTrend = recentScores.length > 1 ? 
        (recentScores[0] - recentScores[recentScores.length - 1]) : 0;
      
      res.json({
        success: true,
        data: {
          user_id: parseInt(userId),
          overview: {
            total_tests: stats.total_tests,
            passed_tests: stats.passed_tests,
            pass_rate: passRate,
            average_score: Math.round(stats.avg_score || 0),
            best_score: stats.best_score,
            total_time_spent: stats.total_time_spent,
            avg_time_per_test: avgTimePerTest
          },
          level_stats: levelStats.map(level => ({
            hsk_level: level.hsk_level,
            completed_tests: level.completed_tests,
            passed_tests: level.passed_tests,
            average_score: Math.round(level.average_score || 0),
            pass_rate: level.completed_tests > 0 ? 
              Math.round((level.passed_tests / level.completed_tests) * 100) : 0
          })),
          trends: {
            recent_scores: recentScores,
            score_trend: scoreTrend, // positive = improving, negative = declining
            trend_direction: scoreTrend > 0 ? 'improving' : scoreTrend < 0 ? 'declining' : 'stable'
          }
        }
      });
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê cá nhân',
        error: error.message
      });
    }
  },

  // 9. Bảng xếp hạng
  async getLeaderboard(req, res) {
    try {
      const { level } = req.params;
      const { limit = 20 } = req.query;
      
      // Validate level
      if (level && (level < 1 || level > 6)) {
        return res.status(400).json({
          success: false,
          message: 'Level phải từ 1 đến 6'
        });
      }
      
      // Lấy bảng xếp hạng
      const leaderboard = await hskModel.getLeaderboard(
        level ? parseInt(level) : null, 
        parseInt(limit)
      );
      
      // Format dữ liệu
      const formattedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        username: user.username,
        avatar: null,
        stats: {
          total_tests: user.total_tests,
          average_score: Math.round(user.average_score || 0),
          best_score: user.best_score,
          passed_tests: user.passed_tests,
          pass_rate: user.total_tests > 0 ? 
            Math.round((user.passed_tests / user.total_tests) * 100) : 0
        }
      }));
      
      res.json({
        success: true,
        data: {
          level: level ? parseInt(level) : 'all',
          leaderboard: formattedLeaderboard,
          total_rankings: formattedLeaderboard.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy bảng xếp hạng',
        error: error.message
      });
    }
  },

  // 14. Tạo user test (chỉ để test API)
  async createTestUser(req, res) {
    try {
      const userModel = require('../../models/user');
      const bcrypt = require('bcrypt');
      
      // Tạo user test
      const testUser = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password_hash: await bcrypt.hash('123456', 10),
        full_name: 'Test User',
        account_status: 'active',
        subscription_type: 'free'
      };
      
      const resultId = await userModel.create(testUser);
      
      res.json({
        success: true,
        data: {
          user_id: resultId,
          username: testUser.username,
          email: testUser.email,
          message: 'Tạo user test thành công. Sử dụng user_id này để test API.'
        }
      });
    } catch (error) {
      console.error('❌ Error creating test user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo user test',
        error: error.message
      });
    }
  }
};

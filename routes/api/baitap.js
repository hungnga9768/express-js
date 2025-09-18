const express = require("express");
const router = express.Router();
const baitapController = require("../../app/controllers/api/baitap.controller");

// ========================================
// EXERCISE SETS ROUTES (Bộ bài tập)
// ========================================

// GET /api/baitap - Lấy danh sách bộ bài tập với phân trang & tìm kiếm
router.get('/', baitapController.index);

// GET /api/baitap/stats - Lấy thống kê tổng quan
router.get('/stats', baitapController.getStats);

// GET /api/baitap/random - Lấy bài tập ngẫu nhiên
router.get('/random', baitapController.getRandom);

// GET /api/baitap/lesson/:lessonId - Lấy bài tập theo bài học
router.get('/lesson/:lessonId', baitapController.getByLesson);

// GET /api/baitap/lesson/:lessonId/incomplete - Lấy bài tập chưa hoàn thành của user
router.get('/lesson/:lessonId/incomplete', baitapController.getIncompleteByLesson);

// GET /api/baitap/lesson/:lessonId/recommend - Gợi ý bài tập tiếp theo
router.get('/lesson/:lessonId/recommend', baitapController.getRecommendedExercises);

// GET /api/baitap/lesson/:lessonId/stats - Thống kê lesson
router.get('/lesson/:lessonId/stats', baitapController.getLessonStats);

// GET /api/baitap/type/:type - Lấy bài tập theo loại
router.get('/type/:type', baitapController.getByType);

// GET /api/baitap/:id - Lấy chi tiết bộ bài tập
router.get('/:id', baitapController.show);

// POST /api/baitap - Tạo bộ bài tập mới
router.post('/', baitapController.create);

// PUT /api/baitap/:id - Cập nhật bộ bài tập
router.put('/:id', baitapController.update);

// DELETE /api/baitap/:id - Xóa bộ bài tập
router.delete('/:id', baitapController.delete);

// ========================================
// QUESTIONS ROUTES (Câu hỏi)
// ========================================

// POST /api/baitap/questions - Thêm câu hỏi vào bộ bài tập
router.post('/questions', baitapController.addQuestion);

// PUT /api/baitap/questions/:questionId - Cập nhật câu hỏi
router.put('/questions/:questionId', baitapController.updateQuestion);

// POST /api/baitap/questions/:questionId/duplicate - Nhân bản câu hỏi
router.post('/questions/:questionId/duplicate', baitapController.duplicateQuestion);

// DELETE /api/baitap/questions/:questionId - Xóa câu hỏi
router.delete('/questions/:questionId', baitapController.deleteQuestion);

// ========================================
// EXERCISE SUBMISSION & RESULTS (Nộp bài & Kết quả)
// ========================================

// POST /api/baitap/check-answer - Kiểm tra đáp án một câu
router.post('/check-answer', baitapController.checkAnswer);

// POST /api/baitap/submit - Nộp bài tập hoàn chỉnh
router.post('/submit', baitapController.submitExercise);

// GET /api/baitap/users/:userId/results - Lấy kết quả làm bài của user
router.get('/users/:userId/results', baitapController.getUserResults);

// GET /api/baitap/users/:userId/stats - Lấy thống kê chi tiết của user
router.get('/users/:userId/stats', baitapController.getUserStats);

// ========================================
// HISTORY & RETRY ROUTES (Lịch sử & Làm lại)
// ========================================

// GET /api/baitap/history/:userId - Lấy lịch sử làm bài của user
router.get('/history/:userId', baitapController.getUserHistory);

// GET /api/baitap/history/:userId/:setId - Lịch sử làm bài cụ thể
router.get('/history/:userId/:setId', baitapController.getSetHistory);

// GET /api/baitap/incorrect/:userId/:setId - Lấy câu trả lời sai để làm lại
router.get('/incorrect/:userId/:setId', baitapController.getIncorrectAnswers);

module.exports = router;

const express = require("express");
const router = express.Router();
const ctrl = require("../../app/controllers/api/hsk.controller");
const authenticateTokenUser = require("../../middlewares/authAPI");
const { checkHSKPermission, checkDailyLimit, incrementUsage } = require("../../middlewares/subscription");

// Phase 1 - Core API
// 1. Lấy danh sách đề thi
router.get("/tests", ctrl.getTests);

// 2. Chi tiết đề thi
router.get("/tests/:testId", ctrl.getTestById);

// 3. Bắt đầu bài thi
router.post("/tests/:testId/start", 
  authenticateTokenUser,
  checkHSKPermission,
  checkDailyLimit(),
  incrementUsage,
  ctrl.startTest
);

// 4. Lấy câu hỏi bài thi
router.get("/tests/:testId/questions", ctrl.getTestQuestions);

// 5. Nộp bài thi
router.post("/results/:resultId/submit", ctrl.submitTest);

// Phase 2 - Results & Analytics API
// 6. Chi tiết kết quả bài thi
router.get("/results/:resultId", ctrl.getResultById);

// 7. Lịch sử bài thi của user
router.get("/results/user/:userId", ctrl.getUserResults);

// 8. Thống kê cá nhân
router.get("/stats/user/:userId", ctrl.getUserStats);

// 9. Bảng xếp hạng
router.get("/leaderboard/:level", ctrl.getLeaderboard);

// Phase 3 - Practice, Search, Analytics, Session
// 10. Luyện tập theo kỹ năng
router.get("/practice/:skillType", ctrl.getPracticeQuestions);

// 11. Tìm kiếm đề thi
router.get("/search/tests", ctrl.searchTests);

// 12. Phân tích điểm yếu cá nhân
router.get("/analytics/weaknesses/:userId", ctrl.getUserWeaknesses);

// 13. Lưu phiên làm bài (auto-save)
router.post("/session/save", ctrl.saveSessionProgress);

module.exports = router;

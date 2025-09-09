const express = require("express");
const router = express.Router();
const baitapCtrl = require("../../app/controllers/api/baitap.controller");

// ==================== PUBLIC ROUTES (Chỉ đọc dữ liệu) ====================
// Lấy danh sách bài tập với phân trang & tìm kiếm
router.get("/", baitapCtrl.index);

// Lấy bài tập ngẫu nhiên
router.get("/random", baitapCtrl.getRandom);

// Lấy thống kê bài tập
router.get("/stats", baitapCtrl.getStats);

// Lấy bài tập theo bài học
router.get("/lesson/:lessonId", baitapCtrl.getByLesson);

// Lấy chi tiết bộ bài tập
router.get("/:id", baitapCtrl.show);

// Nộp bài tập và nhận kết quả
router.post("/submit", baitapCtrl.submitExercise);

module.exports = router;

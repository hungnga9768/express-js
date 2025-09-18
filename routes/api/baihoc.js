const express = require("express");
const router = express.Router();
const baihocCtrl = require("../../app/controllers/api/baihoc.controller");
const authenticateTokenUser = require("../../middlewares/authAPI");

// ==================== PUBLIC ROUTES (Không cần đăng nhập) ====================
// Quản lý bài học
router.get("/", baihocCtrl.index);
router.get("/:id", baihocCtrl.getLessonById);
router.get("/course/:courseId", baihocCtrl.getLessonsByCourse);

// Quản lý từ vựng bài học
router.get("/:id/vocabulary", baihocCtrl.getVocabularyByLesson);

// ==================== PROTECTED ROUTES (Cần đăng nhập) ====================
// Theo dõi tiến độ học tập
router.post("/:id/start", authenticateTokenUser, baihocCtrl.startLesson);
router.post("/:id/complete", authenticateTokenUser, baihocCtrl.completeLesson);
router.get("/:id/progress", authenticateTokenUser, baihocCtrl.getLessonProgress);

// Quản lý ghi chú bài học
router.post("/:id/note", authenticateTokenUser, baihocCtrl.addLessonNote);
router.get("/:id/notes", authenticateTokenUser, baihocCtrl.getLessonNotes);
router.put("/:id/notes/:noteId", authenticateTokenUser, baihocCtrl.updateLessonNote);
router.delete("/:id/notes/:noteId", authenticateTokenUser, baihocCtrl.deleteLessonNote);

// Quản lý ghi chú tổng quát
router.get("/user/notes", authenticateTokenUser, baihocCtrl.getUserNotes);
router.get("/user/notes/search", authenticateTokenUser, baihocCtrl.searchNotes);

// ==================== ADMIN ROUTES (Cần đăng nhập admin) ====================
router.post("/", baihocCtrl.create);
router.put("/:id", baihocCtrl.update);
router.delete("/:id", baihocCtrl.remove);

module.exports = router;

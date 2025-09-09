const express = require("express");
const router = express.Router();
const { uploadThumbnail } = require("../../middlewares/upload");
const courseCtrl = require("../../app/controllers/api/khoahoc.controllers");
const authenticateTokenUser = require("../../middlewares/authAPI");

// ==================== PUBLIC ROUTES (Không cần đăng nhập) ====================
// Quản lý khóa học
router.get("/search", courseCtrl.searchCourses);
router.get("/hsk/:hsk_level", courseCtrl.getCoursesByHSKLevel);

// ==================== PROTECTED ROUTES (Cần đăng nhập) ====================
// Đăng ký khóa học
router.get("/enrolled", authenticateTokenUser, courseCtrl.getEnrolledCourses);
router.post("/:id/enroll", authenticateTokenUser, courseCtrl.enrollCourse);
router.delete("/:id/unenroll", authenticateTokenUser, courseCtrl.unenrollCourse);

// ==================== PUBLIC ROUTES (Không cần đăng nhập) ====================
// Quản lý khóa học
router.get("/", courseCtrl.index);
router.get("/:id",authenticateTokenUser, courseCtrl.getCourseById);
router.get("/:id/lessons", courseCtrl.getCourseLessons);

// Tiến độ học tập
router.get("/:id/progress", authenticateTokenUser, courseCtrl.getCourseProgress);
router.post("/:id/lessons/:lessonId/complete", authenticateTokenUser, courseCtrl.completeLesson);
router.get("/:id/lessons/:lessonId/status", authenticateTokenUser, courseCtrl.getLessonStatus);

// Đánh giá khóa học
router.post("/:id/review", authenticateTokenUser, courseCtrl.addCourseReview);
router.get("/:id/reviews", courseCtrl.getCourseReviews);

// ==================== ADMIN ROUTES (Cần đăng nhập admin) ====================
router.post("/", uploadThumbnail, courseCtrl.create);
router.put("/:id", uploadThumbnail, courseCtrl.update);
router.delete("/:id", courseCtrl.remove);

module.exports = router;

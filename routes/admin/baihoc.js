const express = require("express");
const router = express.Router();
const baihocCtrl = require("../../app/controllers/admin/baihoc.controller");

// Import phân quyền admin
const { requireContentManager } = require("../../middlewares/checkAdminRole");

// ========================================
// BASIC LESSON MANAGEMENT
// ========================================
router.get("/danhsach", baihocCtrl.index);
router.get("/add-baihoc", baihocCtrl.showAddForm);
router.post("/add-baihoc", baihocCtrl.create);
router.get("/edit-baihoc/:id", baihocCtrl.showEditForm);
router.post("/edit-baihoc/:id", baihocCtrl.update);
router.post("/delete-baihoc/:id", baihocCtrl.remove);
router.post("/update-multiple", baihocCtrl.updateMultiple);
router.post("/bulk-update", baihocCtrl.bulkUpdateLessons);

// ========================================
// LESSON EXERCISES MANAGEMENT (for tabs)
// ========================================
router.get("/lesson/:lessonId/exercises", baihocCtrl.getExercisesByLesson);

// ========================================
// LESSON VOCABULARY MANAGEMENT (delegated to lesson-vocabulary routes)
// ========================================
// Note: Vocabulary management is now handled by /admin/lesson-vocabulary/* routes
// These routes are kept for backward compatibility with existing frontend code
router.get("/lesson/:lessonId/vocabulary", baihocCtrl.getVocabularyByLesson);
router.post("/lesson/:lessonId/vocabulary/:wordId", baihocCtrl.addVocabularyToLesson);
router.delete("/lesson/:lessonId/vocabulary/:wordId", baihocCtrl.removeVocabularyFromLesson);
router.get("/vocabulary/search", baihocCtrl.searchVocabulary);

// ========================================
// LESSON STATISTICS & OVERVIEW
// ========================================
router.get("/lesson/:lessonId/overview", baihocCtrl.getLessonOverview);

module.exports = router;

const express = require("express");
const router = express.Router();
const vocabularyCtrl = require("../../app/controllers/api/vocabulary.controller");
const flashcardCtrl = require("../../app/controllers/api/flashcard.controller");
// Note: Lesson vocabulary management moved to admin routes
const authenticateTokenUser = require("../../middlewares/authAPI");
const { 
  checkFlashcardPermission
} = require("../../middlewares/subscription");

// ========================================
// FLASHCARD ROUTES
// ========================================
router.get("/flashcards",authenticateTokenUser, checkFlashcardPermission, flashcardCtrl.getUserFlashcards);
router.get("/flashcards/due",authenticateTokenUser, checkFlashcardPermission, flashcardCtrl.getDueFlashcards);
router.post("/flashcards",authenticateTokenUser, checkFlashcardPermission, flashcardCtrl.createFlashcard);
router.delete("/flashcards/:id",authenticateTokenUser, checkFlashcardPermission, flashcardCtrl.deleteFlashcard);
router.put("/flashcards/:id/review",authenticateTokenUser, checkFlashcardPermission, flashcardCtrl.updateReviewStatus);

// ========================================
// PUBLIC VOCABULARY ROUTES (for mobile/web clients)
// ========================================
router.get("/", vocabularyCtrl.getVocabulary);
router.get("/search", vocabularyCtrl.searchVocabulary); // Restored original search
router.get("/random", vocabularyCtrl.getRandomVocabulary);
router.get("/hsk/:level", vocabularyCtrl.getVocabularyByHSK);
router.get("/course/:courseId", vocabularyCtrl.getVocabularyByCourse);
router.get("/:id", vocabularyCtrl.getVocabularyById);

// Note: Lesson vocabulary management routes moved to /admin/lesson-vocabulary/*


module.exports = router;

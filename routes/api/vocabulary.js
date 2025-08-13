const express = require("express");
const router = express.Router();
const vocabularyCtrl = require("../../app/controllers/api/vocabulary.controller");
const flashcardCtrl = require("../../app/controllers/api/flashcard.controller");
const authenticateTokenUser = require("../../middlewares/authAPI");

// Routes công khai (không cần đăng nhập)
router.get("/", vocabularyCtrl.getVocabulary);
router.get("/search", vocabularyCtrl.searchVocabulary);
router.get("/random", vocabularyCtrl.getRandomVocabulary);
router.get("/hsk/:level", vocabularyCtrl.getVocabularyByHSK);
router.get("/course/:courseId", vocabularyCtrl.getVocabularyByCourse);
router.get("/:id", vocabularyCtrl.getVocabularyById);

// Routes cần đăng nhập (flashcards)
router.use(authenticateTokenUser);
router.get("/flashcards", flashcardCtrl.getUserFlashcards);
router.get("/flashcards/due", flashcardCtrl.getDueFlashcards);
router.post("/flashcards", flashcardCtrl.createFlashcard);
router.put("/flashcards/:id", flashcardCtrl.updateFlashcard);
router.delete("/flashcards/:id", flashcardCtrl.deleteFlashcard);
router.put("/flashcards/:id/review", flashcardCtrl.updateReviewStatus);

module.exports = router;

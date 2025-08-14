const express = require("express");
const router = express.Router();
const vocabularyCtrl = require("../../app/controllers/api/vocabulary.controller");
const flashcardCtrl = require("../../app/controllers/api/flashcard.controller");
const authenticateTokenUser = require("../../middlewares/authAPI");
router.get("/flashcards",authenticateTokenUser, flashcardCtrl.getUserFlashcards);
router.get("/flashcards/due",authenticateTokenUser, flashcardCtrl.getDueFlashcards);
router.post("/flashcards",authenticateTokenUser, flashcardCtrl.createFlashcard);
router.delete("/flashcards/:id",authenticateTokenUser, flashcardCtrl.deleteFlashcard);
router.put("/flashcards/:id/review",authenticateTokenUser, flashcardCtrl.updateReviewStatus);
// Routes công khai (không cần đăng nhập)
router.get("/", vocabularyCtrl.getVocabulary);
router.get("/search", vocabularyCtrl.searchVocabulary);
router.get("/random", vocabularyCtrl.getRandomVocabulary);
router.get("/hsk/:level", vocabularyCtrl.getVocabularyByHSK);
router.get("/course/:courseId", vocabularyCtrl.getVocabularyByCourse);
router.get("/:id", vocabularyCtrl.getVocabularyById);


module.exports = router;

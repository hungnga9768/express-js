const express = require("express");
const router = express.Router();
const ctrl = require("../../app/controllers/admin/hsk.controller");
const { uploadMedia } = require("../../middlewares/upload");

router.get("/", ctrl.index);
router.get("/dashboard", ctrl.dashboard);

router.get("/add", ctrl.createForm);
router.post("/create", ctrl.create);
router.get("/edit/:id", ctrl.editForm);
router.post("/update/:id", ctrl.update);
router.post("/delete/:id", ctrl.delete);

// Toggle trạng thái
router.post("/toggle-randomize/:id", ctrl.toggleRandomize);
router.post("/toggle-status/:id", ctrl.toggleStatus);
router.post("/toggle-active/:id", ctrl.toggleActive);

router.get("/:testId/questions", ctrl.questionsPage);
router.post("/:testId/questions", uploadMedia, ctrl.createQuestion);
router.get("/:testId/questions/:questionId/edit", ctrl.editQuestionForm);
router.get("/:testId/questions/:questionId/preview", ctrl.previewQuestion);
router.post("/:testId/questions/:questionId/update", uploadMedia, ctrl.updateQuestion);
router.post("/:testId/questions/:questionId/delete", ctrl.deleteQuestion);
router.post("/:testId/questions/reorder", express.json(), ctrl.reorderQuestions);

// Import/Export questions
router.get("/:testId/questions/export", ctrl.exportQuestions);
router.post("/:testId/questions/import", ctrl.importQuestions);

module.exports = router;

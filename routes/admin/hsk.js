const express = require("express");
const router = express.Router();
const ctrl = require("../../app/controllers/admin/hsk.controller");

router.get("/", ctrl.index);

router.get("/add", ctrl.createForm);
router.post("/create", ctrl.create);
router.get("/edit/:id", ctrl.editForm);
router.post("/update/:id", ctrl.update);
router.post("/delete/:id", ctrl.delete);
router.post("/toggle-randomize/:id", ctrl.toggleRandomize);

router.get("/:testId/questions", ctrl.questionsPage);
router.post("/:testId/questions", ctrl.createQuestion);
router.post("/:testId/questions/:questionId/update", ctrl.updateQuestion);
router.post("/:testId/questions/:questionId/delete", ctrl.deleteQuestion);
router.post("/:testId/questions/reorder", ctrl.reorderQuestions);

module.exports = router;

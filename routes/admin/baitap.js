const express = require("express");
const router = express.Router();
const baitapCtrl = require("../../app/controllers/admin/baitap.controller");

// Quản lý khóa học
router.get("/danhsach", baitapCtrl.index);
router.get("/add", baitapCtrl.showAddForm);
router.post("/add", baitapCtrl.create);
router.get("/edit/:id", baitapCtrl.showEditForm);
router.post("/edit/:id", baitapCtrl.update);
router.post("/delete/:id", baitapCtrl.remove);
router.post("/cauhoi/add", baitapCtrl.createcauhoi);
router.get("/cauhoi/edit/:id", baitapCtrl.showEditCauhoiForm);
router.post("/cauhoi/edit/:id", baitapCtrl.updatecauhoi);
router.post("/cauhoi/delete/:id", baitapCtrl.removecauhoi);

// ========================================
// API ROUTES FOR AJAX OPERATIONS
// ========================================
router.post("/api/create", baitapCtrl.createViaAjax);
router.get("/api/:id", baitapCtrl.getExerciseDetails);
// router.post("/bulk-update", baitapCtrl.updateMultipleExercises); // TODO: Implement this method

// ========================================
// AI QUESTION GENERATION ROUTES
// ========================================
router.post("/ai/generate", baitapCtrl.generateAIQuestions);
router.post("/ai/save-questions", baitapCtrl.saveAIQuestions);

module.exports = router;

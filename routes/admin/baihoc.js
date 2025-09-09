const express = require("express");
const router = express.Router();
const baihocCtrl = require("../../app/controllers/admin/baihoc.controller");

// Import phân quyền admin
const { requireContentManager } = require("../../middlewares/checkAdminRole");

// Quản lý bài học - Content manager trở lên
router.get("/danhsach", baihocCtrl.index);
router.get("/add-baihoc", baihocCtrl.showAddForm);
router.post("/add-baihoc", baihocCtrl.create);
router.get("/edit-baihoc/:id", baihocCtrl.showEditForm);
router.post("/edit-baihoc/:id", baihocCtrl.update);
router.post("/delete-baihoc/:id", baihocCtrl.remove);
router.post("/update-multiple", baihocCtrl.updateMultiple);
router.post("/bulk-update", baihocCtrl.bulkUpdateLessons);

module.exports = router;

const express = require("express");
const router = express.Router();
const { uploadThumbnail } = require("../../middlewares/upload");
const courseCtrl = require("../../app/controllers/admin/khoahoc.controllers");

// Import phân quyền admin
const { requireContentManager } = require("../../middlewares/checkAdminRole");

// Quản lý khóa học - Content manager trở lên
router.get("/danhsach", courseCtrl.index);
router.get("/add-khoahoc", courseCtrl.showAddForm);
router.post("/add-khoahoc", uploadThumbnail, courseCtrl.create);
router.get("/edit-khoahoc/:id", courseCtrl.showEditForm);
router.post("/edit-khoahoc/:id", uploadThumbnail, courseCtrl.update);
router.post("/delete-khoahoc/:id", courseCtrl.remove);
router.post("/update-multiple", courseCtrl.updateMultipleCourses);

module.exports = router;

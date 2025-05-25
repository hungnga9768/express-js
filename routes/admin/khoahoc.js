const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const courseCtrl = require("../../app/controllers/admin/khoahoc.controllers");

// Quản lý khóa học
router.get("/danhsach", courseCtrl.index);
router.get("/add-khoahoc", courseCtrl.showAddForm);
router.post("/add-khoahoc", upload.single("thumbnail_url"), courseCtrl.create);
router.get("/edit-khoahoc/:id", courseCtrl.showEditForm);
router.post(
  "/edit-khoahoc/:id",
  upload.single("thumbnail_url"),
  courseCtrl.update
);
router.post("/delete-khoahoc/:id", courseCtrl.remove);

module.exports = router;

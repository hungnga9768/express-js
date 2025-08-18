const express = require("express");
const router = express.Router();
const { uploadThumbnail } = require("../../middlewares/upload");
const courseCtrl = require("../../app/controllers/api/khoahoc.controllers");

// Quản lý khóa học
router.get("/", courseCtrl.index);
router.post("/", uploadThumbnail, courseCtrl.create);
router.get("/:id", courseCtrl.showEditForm);
router.post("/:id", uploadThumbnail, courseCtrl.update);
router.post("/:id", courseCtrl.remove);

module.exports = router;

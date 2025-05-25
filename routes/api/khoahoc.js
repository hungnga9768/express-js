const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const courseCtrl = require("../../app/controllers/api/khoahoc.controllers");

// Quản lý khóa học
router.get("/", courseCtrl.index);
router.post("/", upload.single("thumbnail"), courseCtrl.create);
router.get("/:id", courseCtrl.showEditForm);
router.post("/:id", upload.single("thumbnail"), courseCtrl.update);
router.post("/:id", courseCtrl.remove);

module.exports = router;

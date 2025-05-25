const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const userCtr = require("../../app/controllers/admin/user.controllers");

// Quản lý khóa học
router.get("/danhsach", userCtr.index);
router.get("/add", userCtr.showAddForm);
router.post("/add", upload.single("profile_picture"), userCtr.create);
router.get("/edit/:id", userCtr.showEditForm);
router.post("/edit/:id", upload.single("profile_picture"), userCtr.update);
router.post("/delete/:id", userCtr.remove);

module.exports = router;

const express = require("express");
const router = express.Router();
const { uploadAvatar } = require("../../middlewares/upload");
const userCtr = require("../../app/controllers/admin/user.controllers");

// Import phân quyền admin
const { requireAnyAdmin } = require("../../middlewares/checkAdminRole");

// Quản lý user - Tất cả admin
router.get("/danhsach", userCtr.index);
router.get("/add", userCtr.showAddForm);
router.post("/add", uploadAvatar, userCtr.create);
router.get("/edit/:id", userCtr.showEditForm);
router.post("/edit/:id", uploadAvatar, userCtr.update);
router.post("/delete/:id", userCtr.remove);

module.exports = router;

const express = require("express");
const router = express.Router();
const { uploadAvatar } = require("../../middlewares/upload");
const adminsCtl = require("../../app/controllers/admin/admins.controller");
// Quản lý admin
router.get("/danhsach", adminsCtl.index);
router.get("/add", adminsCtl.showAddForm);
router.post("/add", uploadAvatar, adminsCtl.create);
router.get("/edit/:id", adminsCtl.showEditForm);
router.post("/edit/:id", uploadAvatar, adminsCtl.update);
router.post("/delete/:id", adminsCtl.remove);

module.exports = router;

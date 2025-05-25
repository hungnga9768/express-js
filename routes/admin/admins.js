const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const adminsCtl = require("../../app/controllers/admin/admins.controller");
// Quản lý admin
router.get("/danhsach", adminsCtl.index);
router.get("/add", adminsCtl.showAddForm);
router.post("/add", upload.single("avatar"), adminsCtl.create);
router.get("/edit/:id", adminsCtl.showEditForm);
router.post("/edit/:id", upload.single("avatar"), adminsCtl.update);
router.post("/delete/:id", adminsCtl.remove);

module.exports = router;

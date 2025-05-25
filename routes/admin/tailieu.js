const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const tailieuCtl = require("../../app/controllers/admin/tailieu.controller");

// Quản lý khóa học
router.get("/danhsach", tailieuCtl.index);
router.get("/add", tailieuCtl.showAddForm);
router.post("/add", upload.single("thumbnail_url"), tailieuCtl.create);
router.get("/edit/:id", tailieuCtl.showEditForm);
router.post("/edit/:id", upload.single("thumbnail_url"), tailieuCtl.update);
// router.post("/delete/:id", tailieuCtl.remove);

module.exports = router;

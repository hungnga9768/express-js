const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const baitapCtrl = require("../../app/controllers/admin/baitap.controller");

// Quản lý khóa học
router.get("/danhsach", baitapCtrl.index);
router.get("/add", baitapCtrl.showAddForm);
router.post("/add", baitapCtrl.create);
router.get("/edit/:id", baitapCtrl.showEditForm);
router.post("/edit/:id", baitapCtrl.update);
router.post("/delete/:id", baitapCtrl.remove);
router.post("/cauhoi/add", baitapCtrl.createcauhoi);
router.post("/cauhoi/delete/:id", baitapCtrl.removecauhoi);

module.exports = router;

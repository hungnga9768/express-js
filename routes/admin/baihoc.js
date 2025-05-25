const express = require("express");
const router = express.Router();
const baihocCtrl = require("../../app/controllers/admin/baihoc.controller");

// Quản lý khóa học
router.get("/danhsach", baihocCtrl.index);
router.get("/add-baihoc", baihocCtrl.showAddForm);
router.post("/add-baihoc", baihocCtrl.create);
router.get("/edit-baihoc/:id", baihocCtrl.showEditForm);
router.post("/edit-baihoc/:id", baihocCtrl.update);
router.post("/delete-baihoc/:id", baihocCtrl.remove);

module.exports = router;

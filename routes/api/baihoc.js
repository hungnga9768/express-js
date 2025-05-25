const express = require("express");
const router = express.Router();
const baihocCtrl = require("../../app/controllers/api/baihoc.controller");

// Quản lý khóa học
router.get("/", baihocCtrl.index);
router.post("/", baihocCtrl.create);
router.get("/:id", baihocCtrl.showEditForm);
router.put("/:id", baihocCtrl.update);
router.delete("/:id", baihocCtrl.remove);

module.exports = router;

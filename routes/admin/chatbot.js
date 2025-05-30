const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const chatbotCtrl = require("../../app/controllers/admin/chatbot.controller");

// Quản lý khóa học
router.get("/danhsach", chatbotCtrl.index);
router.get("/add", chatbotCtrl.showAddForm);
router.post("/add", upload.single("avatar_url"), chatbotCtrl.create);
router.get("/edit/:id", chatbotCtrl.showEditForm);
router.post("/edit/:id", upload.single("avatar_url"), chatbotCtrl.update);
router.post("/delete/:id", chatbotCtrl.remove);
module.exports = router;

const express = require("express");
const router = express.Router();
const { uploadChatbotAvatar } = require("../../middlewares/upload");
const chatbotCtrl = require("../../app/controllers/admin/chatbot.controller");

// Quản lý khóa học
router.get("/danhsach", chatbotCtrl.index);
router.get("/add", chatbotCtrl.showAddForm);
router.post("/add", uploadChatbotAvatar, chatbotCtrl.create);
router.get("/edit/:id", chatbotCtrl.showEditForm);
router.post("/edit/:id", uploadChatbotAvatar, chatbotCtrl.update);
router.post("/delete/:id", chatbotCtrl.remove);
module.exports = router;

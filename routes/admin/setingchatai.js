const express = require("express");
const router = express.Router();
const SettingChatAi = require("../../app/controllers/admin/settingchatai.controller");

// Quản lý khóa học
router.get("/danhsach", SettingChatAi.index);
// router.get("/add", SettingChatAi.showAddForm);
// router.post("/add", SettingChatAi.);
router.get("/edit/:id", SettingChatAi.showEditForm);
router.post("/edit/:id", SettingChatAi.update);
// router.post("/delete/:id", SettingChatAi.remove);
module.exports = router;

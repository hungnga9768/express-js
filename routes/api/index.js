const express = require("express");
const router = express.Router();
const tailieuCtrl = require("../../app/controllers/api/tailieu.controller");
const userCtrl = require("../../app/controllers/api/user.controllers");
const SettingsCtrl = require("../../app/controllers/api/setting.controller");
const { uploadProfilePicture } = require("../../middlewares/upload");
const khoahoc = require("../api/khoahoc");
const baihoc = require("../api/baihoc");
const vocabulary = require("../api/vocabulary");
const auth = require("../api/auth");
const forgotPassword = require("../api/forgotPassword");
const games = require("../api/games");
const hsk = require("../api/hsk");
const baitap = require("../api/baitap");
const geminiCtrl = require("../../app/controllers/api/gemini.controller");
const speechPractice = require("../api/speechPractice");
const usage = require("../api/usage");
// router baor vệ check đăng nhập thông qua cái này mới chạy
const authenticateTokenUser = require("../../middlewares/authAPI");
// Import subscription middleware
const { 
  checkChatPermission, 
  checkTranslatePermission, 
  checkSpeechPermission,
  checkDailyLimit,
  incrementUsage 
} = require("../../middlewares/subscription");

router.use("/auth", auth);
router.use("/auth", forgotPassword);
router.use("/khoahoc", khoahoc);
router.use("/baihoc",authenticateTokenUser, baihoc);
router.use("/vocabulary", vocabulary);
router.use("/games",authenticateTokenUser, games);
router.use("/hsk",authenticateTokenUser, hsk);
router.use("/baitap", baitap);
router.get("/tailieu/", tailieuCtrl.index);
router.get("/tailieu/:id", tailieuCtrl.getID);
// api quan li nguoi dung
router.post("/login", userCtrl.Login);
router.post("/register", userCtrl.create);
router.get("/logout", userCtrl.logout);
router.post("/refresh-token", userCtrl.refreshToken);
router.get("/check-login", authenticateTokenUser, (req, res) => {
  res.json({ user: req.user });
});
router.get("/logout", userCtrl.logout);
//router quan li giao dien
router.get("/banner", SettingsCtrl.index);
router.get("/config", SettingsCtrl.getConfig);

//touter giao tiep người dùng với api

router.post("/chat", 
  authenticateTokenUser, 
  checkChatPermission(),
  checkDailyLimit('chat'),
  incrementUsage('chat'),
  geminiCtrl.handleChat
);
//hàm lấy danh sách chatbot
router.get("/chat-topics", geminiCtrl.getchattopics);
// hàm lấy lịch sử phiên chat
router.get(
  "/chat/history/:sessionId",
  authenticateTokenUser,
  geminiCtrl.getChatHistoryDetail
);
// hàm lấy phiên chat cho người dùng
router.get(
  "/chat/sessions",
  authenticateTokenUser,
  geminiCtrl.getUserChatSessions
);
// hàm xóa toàn bộ lịch sử chat của một phiên cụ thể
router.delete(
  "/chat/sessions/:sessionId",
  authenticateTokenUser,
  geminiCtrl.deleteChatSession
);
// hàm xóa toàn bộ lịch sử chat của người dùng
router.delete(
  "/chat/history/all",
  authenticateTokenUser,
  geminiCtrl.deleteAllChatHistory
);
// hàm xóa một tin nhắn cụ thể
router.delete(
  "/chat/messages/:messageId",
  authenticateTokenUser,
  geminiCtrl.deleteChatMessage
);
// hàm dịch
router.post("/translate",
  authenticateTokenUser,
  checkTranslatePermission(),
  checkDailyLimit('translate'),
  incrementUsage('translate'),
  geminiCtrl.translate
);
// cho câu tương tự sau khi dịch
router.post("/suggest-similar",geminiCtrl.suggestsimilar
);
//giải thích nghĩa tương tự sau khi dịch
router.post("/explain-context",geminiCtrl.explaincontext
);
//những router  trong trang profile người dùng
router.post("/user-profile",authenticateTokenUser,userCtrl.getprofile
);
router.post("/user-profile-avatar",authenticateTokenUser, uploadProfilePicture, userCtrl.userprofileavatar
);
router.post("/user-profile-fullname",authenticateTokenUser, userCtrl.userprofilefullname
);
router.post("/user-profile-change-password",authenticateTokenUser, userCtrl.userprofilechangepassword
);

// ===== SPEECH PRACTICE (PHÁT ÂM + LUYỆN NGHE) =====
router.use("/speech-practice", speechPractice);

// ===== USAGE TRACKING =====
router.use("/usage", usage);

module.exports = router;

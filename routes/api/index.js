const express = require("express");
const router = express.Router();
const baitapCtrl = require("../../app/controllers/api/baitap.controller");
const tailieuCtrl = require("../../app/controllers/api/tailieu.controller");
const userCtrl = require("../../app/controllers/api/user.controllers");
const SettingsCtrl = require("../../app/controllers/api/setting.controller");
const khoahoc = require("../api/khoahoc");
const baihoc = require("../api/baihoc");
const auth = require("../api/auth");
const passport = require("passport");
// router baor vệ check đăng nhập thông qua cái này mới chạy
const authenticateTokenUser = require("../../middlewares/authAPI");

router.use("/auth", auth);
router.use("/khoahoc", khoahoc);
router.use("/baihoc", baihoc);
router.get("/tailieu/", authenticateTokenUser, tailieuCtrl.index);
router.get("/tailieu/:id", tailieuCtrl.getID);
router.get("/baitap/", baitapCtrl.index);

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

module.exports = router;

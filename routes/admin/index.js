const express = require("express");
const router = express.Router();
const admins = require("../../app/controllers/admin/admins.controller");
const khoahoc = require("./khoahoc");
const baihoc = require("./baihoc");
const user = require("./user");
const admin = require("./admins");
const baitap = require("./baitap");
const tailieu = require("./tailieu");
const setting = require("./setting");
const authenticateToken = require("../../middlewares/authenticateToken");
router.get("/", (req, res) => {
  res.render("home");
});
router.get("/login", admins.showLogin);
router.post("/login", admins.checkLogin);
router.get("/logout", admins.Logout);

router.use(authenticateToken);

router.use("/khoahoc", khoahoc);
router.use("/baihoc", baihoc);
router.use("/admins", admin);
router.use("/baitap", baitap);
router.use("/tailieu", tailieu);
router.use("/user", user);
router.use("/setting", setting);

module.exports = router;

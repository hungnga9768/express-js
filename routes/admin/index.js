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
const Chatbot = require("./chatbot");
const vocabulary = require("./vocabulary");
const hsk = require("./hsk");
const game = require("./game");
const cloudinary = require("./cloudinary");
const payments = require("./payments");
const subscriptionPlans = require("./subscriptionPlans");
const authenticateToken = require("../../middlewares/authenticateToken");
const loadGrobalsettings = require("../../middlewares/loadGrobalsettings");

// Import phân quyền admin
const { 
  requireSuperAdmin, 
  requireContentManager, 
  requireAnyAdmin,
  requireAdminEditPermission,
  requireAdminDeletePermission 
} = require("../../middlewares/checkAdminRole");
router.use(loadGrobalsettings);
router.get("/login", admins.showLogin);
router.post("/login", admins.checkLogin);
router.get("/logout", admins.Logout);
router.use(authenticateToken);
router.get("/",(req,res)=>{
res.render("home")
})

// ==================== PHÂN QUYỀN ADMIN ====================

// QUẢN LÝ ADMIN - Chỉ super_admin
router.use("/admins", requireSuperAdmin, admin);

// CÀI ĐẶT HỆ THỐNG - Chỉ super_admin  
router.use("/setting", requireSuperAdmin, setting);

// QUẢN LÝ NỘI DUNG - Content manager trở lên
router.use("/khoahoc", requireContentManager, khoahoc);
router.use("/baihoc", requireContentManager, baihoc);
router.use("/baitap", requireContentManager, baitap);
router.use("/tailieu", requireContentManager, tailieu);
router.use("/vocabulary", requireContentManager, vocabulary);
router.use("/hsk", requireContentManager, require("./hsk"));
router.use("/hsk-results", requireContentManager, require("./hsk-results"));
router.use("/games", requireContentManager, game);

// QUẢN LÝ USER - Tất cả admin
router.use("/user", requireAnyAdmin, user);

// CHATBOT - Tất cả admin
router.use("/chatbot", requireAnyAdmin, Chatbot);

// CLOUDINARY API - Content manager trở lên
router.use("/api/cloudinary", requireContentManager, cloudinary);

// QUẢN LÝ THANH TOÁN - Super admin
router.use("/payments", requireSuperAdmin, payments);

// QUẢN LÝ SUBSCRIPTION PLANS - Super admin
router.use("/subscription-plans", requireSuperAdmin, subscriptionPlans);

module.exports = router;

const express = require("express");
const router = express.Router();
const { uploadAvatar } = require("../../middlewares/upload");
const adminsCtl = require("../../app/controllers/admin/admins.controller");

// Import phân quyền admin
const { 
  requireSuperAdmin,
  requireAdminEditPermission,
  requireAdminDeletePermission 
} = require("../../middlewares/checkAdminRole");

// Quản lý admin - Tất cả đều cần super_admin
router.get("/danhsach", adminsCtl.index);
router.get("/add", adminsCtl.showAddForm);
router.post("/add", uploadAvatar, adminsCtl.create);
router.get("/edit/:id", requireAdminEditPermission, adminsCtl.showEditForm);
router.post("/edit/:id", uploadAvatar, requireAdminEditPermission, adminsCtl.update);
router.post("/delete/:id", requireAdminDeletePermission, adminsCtl.remove);

module.exports = router;

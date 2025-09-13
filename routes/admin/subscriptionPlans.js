const express = require("express");
const router = express.Router();
const subscriptionPlanCtrl = require("../../app/controllers/admin/subscriptionPlan.controller");

/**
 * Subscription Plans Admin Routes
 * Prefix: /admin/subscription-plans
 * Middleware: requireSuperAdmin đã được apply ở parent route
 */

// Routes hiển thị
router.get("/", subscriptionPlanCtrl.index);                    // Danh sách plans với filter & search
router.get("/add", subscriptionPlanCtrl.createForm);            // Form thêm mới
router.get("/edit/:id", subscriptionPlanCtrl.editForm);         // Form chỉnh sửa

// API Routes - CRUD Operations
router.post("/create", subscriptionPlanCtrl.create);            // Tạo plan mới
router.put("/update/:id", subscriptionPlanCtrl.update);         // Cập nhật plan
router.post("/update/:id", subscriptionPlanCtrl.update);        // Thêm POST để hỗ trợ form

// DELETE ROUTES - Multiple methods để đảm bảo hoạt động
router.delete("/delete/:id", subscriptionPlanCtrl.delete);      // DELETE method
router.post("/delete/:id", subscriptionPlanCtrl.delete);        // POST method backup
router.get("/delete/:id", subscriptionPlanCtrl.delete);         // GET method test

router.get("/api/:id", subscriptionPlanCtrl.getById);           // Lấy plan theo ID

// API Routes - Special Actions
router.post("/toggle-active/:id", subscriptionPlanCtrl.toggleActive);        // Toggle active/inactive
router.post("/update-sort-order", subscriptionPlanCtrl.updateSortOrder);     // Cập nhật thứ tự

// API Routes - Bulk Operations  
router.post("/bulk-toggle-active", subscriptionPlanCtrl.bulkToggleActive);   // Bulk toggle
router.post("/bulk-delete", subscriptionPlanCtrl.bulkDelete);                // Bulk delete

// Export Routes
router.get("/export", subscriptionPlanCtrl.exportToCSV);                     // Export CSV

module.exports = router;

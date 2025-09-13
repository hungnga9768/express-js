const express = require('express');
const router = express.Router();
const paymentController = require('../../app/controllers/admin/payment.controller');

/**
 * Admin Routes cho MoMo Payment Management
 * Prefix: /admin/payments
 * Middleware: requireSuperAdmin đã được apply ở parent route
 */

// GET /admin/payments - Danh sách đơn hàng
router.get('/', paymentController.index);

// GET /admin/payments/stats - Business Analytics & Intelligence
router.get('/stats', paymentController.stats);

// GET /admin/payments/export - Business Report Export (multiple formats)
router.get('/export', paymentController.export);

// POST /admin/payments/check-status - API để kiểm tra trạng thái từ MoMo
router.post('/check-status', paymentController.checkStatus);

// GET /admin/payments/:id - Chi tiết giao dịch business-focused
router.get('/:id', paymentController.show);

// POST /admin/payments/upgrade-manual/:id - Nâng cấp user thủ công
router.post('/upgrade-manual/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    // TODO: Implement manual user upgrade
    res.json({
      success: true,
      message: 'Đã nâng cấp user thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi nâng cấp user'
    });
  }
});

module.exports = router;

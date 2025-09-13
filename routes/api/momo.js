const express = require('express');
const router = express.Router();
const authenticateTokenUser = require('../../middlewares/authAPI');
const PaymentService = require('../../app/services/paymentService');

const paymentService = new PaymentService();

/**
 * Get subscription plans
 * GET /api/momo/plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await paymentService.getSubscriptionPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách gói subscription',
      error: error.message
    });
  }
});

// Get single plan detail
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const plans = await paymentService.getSubscriptionPlans();
    const idNum = parseInt(planId, 10);
    const plan = plans.find(p => Number(p.id) === idNum);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói subscription' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Error getting subscription plan detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin gói subscription',
      error: error.message
    });
  }
});

/**
 * Create MoMo payment order
 * POST /api/momo/create-payment
 */
router.post('/create-payment', authenticateTokenUser, async (req, res) => {
  try {
    const { plan_id } = req.body;
    
    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin plan_id'
      });
    }

    const result = await paymentService.createPaymentOrder(req.user, plan_id);
    
    if (result.success) {
      const message = result.pending 
        ? 'Đơn hàng đã tạo, đang chờ xử lý thanh toán' 
        : 'Tạo đơn hàng thanh toán thành công';
      
      res.json({ success: true, message, ...result });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Tạo thanh toán thất bại',
        ...result
      });
    }

  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi tạo đơn hàng',
      error: error.message
    });
  }
});

/**
 * Check order status
 * GET /api/momo/order-status/:orderId
 */
router.get('/order-status/:orderId', authenticateTokenUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderData = await paymentService.checkOrderStatus(orderId, req.user.user_id);
    
    res.json({ success: true, data: orderData });
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái đơn hàng',
      error: error.message
    });
  }
});

/**
 * MoMo payment webhook (IPN)
 * POST /api/momo/webhook
 * 
 * Note: Must respond with HTTP 204 according to MoMo specification
 * https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/notification
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 Received MoMo webhook:', req.body);
    
    await paymentService.processWebhook(req.body);
    console.log('✅ Webhook processed successfully');

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    if (error.message.includes('Invalid signature')) {
      console.error('🔍 Signature validation failed:', {
        orderId: req.body.orderId,
        partnerCode: req.body.partnerCode,
        hasSignature: !!req.body.signature
      });
    }
  } finally {
    // Always respond 204 to prevent MoMo retries
    res.status(204).end();
  }
});

module.exports = router;

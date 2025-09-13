const OrderModel = require('../models/order');
const userModel = require('../models/user');
const SubscriptionPlanModel = require('../models/subscriptionPlan');
const MoMoService = require('../../utils/momo');
const pool = require('../../connect-mysql');

/**
 * Payment Service - Optimized business logic for MoMo payments
 * Features: Connection pooling, async optimization, error handling
 */
class PaymentService {
  
  constructor() {
    this.momoService = new MoMoService();
    // Cache for subscription plans (5 minutes)
    this.plansCache = null;
    this.plansCacheExpiry = null;
  }

  /**
   * Lấy danh sách gói subscription (with caching)
   */
  async getSubscriptionPlans() {
    const now = Date.now();
    
    // Check cache validity (5 minutes)
    if (this.plansCache && this.plansCacheExpiry && now < this.plansCacheExpiry) {
      return this.plansCache;
    }
    
    // Fetch fresh data using new model
    this.plansCache = await SubscriptionPlanModel.getActivePlans();
    this.plansCacheExpiry = now + (5 * 60 * 1000); // 5 minutes
    
    return this.plansCache;
  }

  /**
   * Tạo đơn hàng thanh toán MoMo (Optimized)
   */
  async createPaymentOrder(user, planId) {
    try {
      // Parallel validation and cleanup
      const [plan] = await Promise.all([
        SubscriptionPlanModel.getById(planId),
        OrderModel.cancelPendingOrders(user.user_id)
      ]);

      if (!plan) {
        throw new Error('Không tìm thấy gói subscription này');
      }

      // Generate order data
      const orderData = this._generateOrderData(user, plan);
      
      // Create order in database
      const dbOrderId = await OrderModel.createOrder(orderData);

      // Create MoMo payment
      return await this._processMoMoPayment(orderData, dbOrderId, plan);

    } catch (error) {
      console.error(`❌ Error creating payment order for user ${user.user_id}:`, error);
      throw error;
    }
  }

  /**
   * Generate order data (Private helper)
   */
  _generateOrderData(user, plan) {
    const orderId = this.momoService.generateOrderId(user.user_id);
    const requestId = this.momoService.generateRequestId();
    const amount = this.momoService.formatAmount(plan.price);
    const orderInfo = this.momoService.generateOrderInfo(plan.name, user.username);
    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return {
      userId: user.user_id,
      orderId,
      planId: plan.id,
      amount,
      orderInfo,
      requestId,
      expireTime
    };
  }

  /**
   * Process MoMo payment creation (Private helper)
   */
  async _processMoMoPayment(orderData, dbOrderId, plan) {
    const { orderId, amount, orderInfo, expireTime, userId } = orderData;

    // Create payment request with MoMo
    const paymentResult = await this.momoService.createPayment({
      orderId,
      amount,
      orderInfo,
      extraData: JSON.stringify({
        user_id: userId,
        plan_id: plan.id,
        db_order_id: dbOrderId
      })
    });

    if (paymentResult.success) {
      // Update payment info
      await OrderModel.updateOrderPaymentInfo(dbOrderId, {
        payUrl: paymentResult.data.payUrl,
        qrCodeUrl: paymentResult.data.qrCodeUrl,
        deeplink: paymentResult.data.deeplink,
        momoOrderId: paymentResult.data.orderId
      });

      return this._buildSuccessResponse(orderData, dbOrderId, plan, paymentResult);
    } else {
      return this._handlePaymentFailure(orderData, dbOrderId, plan, paymentResult);
    }
  }

  /**
   * Build success response (Private helper)
   */
  _buildSuccessResponse(orderData, dbOrderId, plan, paymentResult) {
    const { orderId, amount, orderInfo, expireTime } = orderData;
    
    const responseData = {
      success: true,
      data: {
        order_id: orderId,
        db_order_id: dbOrderId,
        plan: {
          id: plan.id,
          name: plan.name,
          price: parseFloat(plan.price),
          duration_months: plan.duration_months
        },
        payment: {
          amount,
          order_info: orderInfo,
          pay_url: paymentResult.data.payUrl,
          qr_code_url: paymentResult.data.qrCodeUrl,
          deeplink: paymentResult.data.deeplink,
          deeplink_mini_app: paymentResult.data.deeplinkMiniApp
        },
        expires_at: expireTime,
        expires_in_minutes: 15
      }
    };

    // Add pending info if applicable
    if (paymentResult.pending) {
      responseData.pending = true;
      responseData.message = paymentResult.message || 'Giao dịch đang được xử lý';
    }

    return responseData;
  }

  /**
   * Handle payment failure (Private helper)
   */
  async _handlePaymentFailure(orderData, dbOrderId, plan, paymentResult) {
    const { orderId, expireTime } = orderData;

    if (paymentResult.canRetry === false) {
      // Critical error - mark as failed immediately
      await OrderModel.markOrderAsFailed(dbOrderId, paymentResult.error);
      throw new Error(`Lỗi cấu hình MoMo (${paymentResult.resultCode}): ${paymentResult.error}`);
    }

    // Temporary error - keep pending for retry
    // console.log(`⚠️ MoMo API failed (retryable), order ${orderId} remains pending:`, paymentResult.error);
    
    return {
      success: false,
      message: 'Tạo thanh toán thất bại, vui lòng thử lại sau',
      data: {
        order_id: orderId,
        db_order_id: dbOrderId,
        status: 'pending',
        plan: {
          id: plan.id,
          name: plan.name,
          price: parseFloat(plan.price),
          duration_months: plan.duration_months
        },
        expires_at: expireTime,
        expires_in_minutes: 15,
        retry_available: true
      },
      error: paymentResult.error,
      result_code: paymentResult.resultCode
    };
  }

  /**
   * Kiểm tra trạng thái đơn hàng (Optimized)
   */
  async checkOrderStatus(orderId, userId) {
    const order = await OrderModel.getOrderByIdAndUser(orderId, userId);
    
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Check expiration and auto-update if needed
    const isExpired = this._checkAndUpdateExpiration(order);

    return {
      order_id: order.order_id,
      status: order.status,
      amount: parseFloat(order.amount),
      plan: {
        name: order.plan_name,
        duration_months: order.duration_months,
        price: parseFloat(order.plan_price)
      },
      payment_url: order.payment_url,
      qr_code_url: order.qr_code_url,
      deeplink: order.deeplink,
      created_at: order.created_at,
      expire_time: order.expire_time,
      completed_at: order.completed_at,
      is_expired: isExpired,
      result_code: order.result_code,
      message: order.message
    };
  }

  /**
   * Check and update order expiration (Private helper)
   */
  async _checkAndUpdateExpiration(order) {
    const now = new Date();
    const isExpired = order.expire_time && now > new Date(order.expire_time);

    if (isExpired && order.status === 'pending') {
      // Auto-update status to expired (non-blocking)
      OrderModel.markOrderAsExpired(order.id).catch(error => 
        console.error(`Failed to mark order ${order.id} as expired:`, error)
      );
      order.status = 'expired';
    }

    return isExpired;
  }

  /**
   * Xử lý webhook từ MoMo (Optimized with async processing)
   */
  async processWebhook(webhookData) {
    // Validate webhook first
    const validation = this.momoService.validateWebhookData(webhookData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Save webhook data immediately (non-blocking for MoMo response)
    const savePromise = OrderModel.saveWebhookData(webhookData);
    
    // Process webhook logic in parallel
    const processPromise = this._handleWebhookLogic(webhookData);

    // Wait for both operations
    await Promise.all([savePromise, processPromise]);
  }

  /**
   * Xử lý logic webhook (Optimized private method)
   */
  async _handleWebhookLogic(webhookData) {
    const { orderId, transId } = webhookData;
    const resultCode = parseInt(webhookData.resultCode, 10);

    // console.log(`🔄 Processing webhook for order ${orderId}, result: ${resultCode}`);

    // Find order
    const order = await OrderModel.getOrderByOrderId(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Use connection with timeout for better concurrency
    const connection = await this._getConnectionWithTimeout();
    await connection.beginTransaction();

    try {
      if (resultCode === 0) {
        await this._handleSuccessfulPayment(connection, order, transId, resultCode, webhookData.message);
      } else {
        await this._handleFailedPayment(connection, orderId, resultCode, webhookData.message);
      }

      // Mark webhook as processed
      await OrderModel.markWebhookAsProcessed(connection, orderId, resultCode);
      await connection.commit();

      // console.log(`✅ Webhook processed successfully for order ${orderId}`);

    } catch (error) {
      await connection.rollback();
      console.error(`❌ Error processing webhook for order ${orderId}:`, error);
      
      // Update webhook error (non-blocking)
      OrderModel.updateWebhookError(connection, orderId, resultCode, error.message)
        .catch(updateError => console.error('Failed to update webhook error:', updateError));
      
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get database connection with timeout (Private helper)
   */
  async _getConnectionWithTimeout(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Database connection timeout'));
      }, timeoutMs);

      pool.getConnection()
        .then(connection => {
          clearTimeout(timeout);
          resolve(connection);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Handle successful payment (Private helper)
   */
  async _handleSuccessfulPayment(connection, order, transId, resultCode, message) {
    // console.log(`✅ Payment successful for order ${order.order_id}`);

    // Parallel operations for better performance
    await Promise.all([
      OrderModel.markOrderAsCompleted(connection, order.order_id, transId, resultCode, message),
      userModel.upgradeSubscription(connection, order.user_id, order.plan_id, order.order_id)
    ]);

    // console.log(`🎉 User ${order.user_id} upgraded to Premium successfully`);
  }

  /**
   * Handle failed payment (Private helper)
   */
  async _handleFailedPayment(connection, orderId, resultCode, message) {
    console.log(`❌ Payment failed for order ${orderId}, code: ${resultCode}`);
    
    await OrderModel.markOrderAsFailedWithConnection(connection, orderId, resultCode, message);
  }

}

module.exports = PaymentService;

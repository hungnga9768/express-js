const pool = require("../../connect-mysql");

/**
 * Order Model - Quản lý database operations cho MoMo orders
 */
class OrderModel {
  
  /**
   * Lấy tất cả gói subscription active
   */
  static async getActiveSubscriptionPlans() {
    const [plans] = await pool.query(`
      SELECT 
        id,
        plan_code,
        name,
        duration_months,
        price,
        original_price,
        discount_percent,
        description,
        features,
        sort_order
      FROM subscription_plans 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, duration_months ASC
    `);

    return plans.map(plan => {
      let features = [];
      
      // Thử parse từ database trước
      if (plan.features) {
        try {
          const cleanFeatures = plan.features.toString().trim();
          features = JSON.parse(cleanFeatures);
          
          if (!Array.isArray(features)) {
            features = [];
          }
        } catch (error) {
          console.warn('JSON parse error for features, using fallback');
          features = [];
        }
      }
      
      // Nếu features vẫn rỗng, dùng fallback dựa trên plan_code
      if (features.length === 0) {
        const premiumFeatures = [
          "100 tin nhắn chat/ngày",
          "100 lần dịch/ngày", 
          "Luyện nghe không giới hạn",
          "Tạo flashcard riêng",
          "HSK không giới hạn"
        ];
        
        features = premiumFeatures;
      }

      return {
        id: plan.id,
        plan_code: plan.plan_code,
        name: plan.name,
        duration_months: plan.duration_months,
        price: parseFloat(plan.price),
        original_price: plan.original_price ? parseFloat(plan.original_price) : null,
        discount_percent: parseFloat(plan.discount_percent),
        description: plan.description,
        features: features,
        savings: plan.original_price ? parseFloat(plan.original_price) - parseFloat(plan.price) : 0,
        price_per_month: Math.round(parseFloat(plan.price) / plan.duration_months)
      };
    });
  }

  /**
   * Lấy thông tin gói subscription theo ID
   */
  static async getSubscriptionPlanById(planId) {
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1',
      [planId]
    );

    return plans.length > 0 ? plans[0] : null;
  }

  /**
   * Hủy các đơn hàng pending cũ của user
   */
  static async cancelPendingOrders(userId) {
    await pool.query(
      'UPDATE momo_orders SET status = "cancelled" WHERE user_id = ? AND status IN ("pending", "processing")',
      [userId]
    );
  }

  /**
   * Tạo đơn hàng mới
   */
  static async createOrder(orderData) {
    const {
      userId, orderId, planId, amount, orderInfo, requestId, expireTime
    } = orderData;

    const [result] = await pool.query(`
      INSERT INTO momo_orders 
      (user_id, order_id, plan_id, partner_ref_id, amount, order_info, request_id, status, expire_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [userId, orderId, planId, orderId, amount, orderInfo, requestId, expireTime]);

    return result.insertId;
  }

  /**
   * Cập nhật thông tin payment URL sau khi tạo thanh toán MoMo
   */
  static async updateOrderPaymentInfo(dbOrderId, paymentData) {
    const { payUrl, qrCodeUrl, deeplink, momoOrderId } = paymentData;
    
    await pool.query(`
      UPDATE momo_orders 
      SET payment_url = ?, qr_code_url = ?, deeplink = ?, momo_order_id = ?, status = 'processing'
      WHERE id = ?
    `, [payUrl, qrCodeUrl, deeplink, momoOrderId, dbOrderId]);
  }

  /**
   * Cập nhật trạng thái đơn hàng thành failed
   */
  static async markOrderAsFailed(dbOrderId, errorMessage) {
    await pool.query(
      'UPDATE momo_orders SET status = "failed", message = ? WHERE id = ?',
      [errorMessage, dbOrderId]
    );
  }

  /**
   * Lấy đơn hàng theo orderId và userId
   */
  static async getOrderByIdAndUser(orderId, userId) {
    const [orders] = await pool.query(`
      SELECT 
        mo.*,
        sp.name as plan_name,
        sp.duration_months,
        sp.price as plan_price
      FROM momo_orders mo
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      WHERE mo.order_id = ? AND mo.user_id = ?
    `, [orderId, userId]);

    return orders.length > 0 ? orders[0] : null;
  }

  /**
   * Cập nhật đơn hàng thành expired
   */
  static async markOrderAsExpired(orderId) {
    await pool.query('UPDATE momo_orders SET status = "expired" WHERE id = ?', [orderId]);
  }

  /**
   * Cập nhật đơn hàng thành cancelled với lý do
   */
  static async markOrderAsCancelled(orderId, reason = null) {
    await pool.query(`
      UPDATE momo_orders 
      SET status = "cancelled", 
          updated_at = NOW(),
          cancel_reason = ?
      WHERE id = ?
    `, [reason, orderId]);
  }

  /**
   * Lưu webhook data từ MoMo
   */
  static async saveWebhookData(webhookData) {
    await pool.query(`
      INSERT INTO momo_webhooks 
      (order_id, partner_code, access_key, request_id, amount, order_info, partner_ref_id, 
       momo_trans_id, result_code, message, pay_type, response_time, extra_data, signature, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      webhookData.orderId,
      webhookData.partnerCode,
      webhookData.accessKey,
      webhookData.requestId,
      parseFloat(webhookData.amount) || 0,
      webhookData.orderInfo,
      webhookData.partnerRefId,
      webhookData.transId,
      parseInt(webhookData.resultCode, 10) || 0, // Đảm bảo lưu là integer
      webhookData.message,
      webhookData.payType,
      parseInt(webhookData.responseTime, 10) || 0,
      webhookData.extraData,
      webhookData.signature,
      JSON.stringify(webhookData)
    ]);
  }

  /**
   * Lấy đơn hàng theo orderId để xử lý webhook
   */
  static async getOrderByOrderId(orderId) {
    const [orders] = await pool.query(
      'SELECT * FROM momo_orders WHERE order_id = ?',
      [orderId]
    );

    return orders.length > 0 ? orders[0] : null;
  }

  /**
   * Cập nhật đơn hàng thành công (sử dụng connection cho transaction)
   */
  static async markOrderAsCompleted(connection, orderId, transId, resultCode, message) {
    await connection.query(`
      UPDATE momo_orders 
      SET status = 'completed', momo_trans_id = ?, result_code = ?, 
          message = ?, completed_at = NOW() 
      WHERE order_id = ?
    `, [transId, parseInt(resultCode, 10) || 0, message, orderId]);
  }

  /**
   * Cập nhật đơn hàng thất bại (sử dụng connection cho transaction)
   */
  static async markOrderAsFailedWithConnection(connection, orderId, resultCode, message) {
    await connection.query(`
      UPDATE momo_orders 
      SET status = 'failed', result_code = ?, message = ? 
      WHERE order_id = ?
    `, [parseInt(resultCode, 10) || 0, message, orderId]);
  }

  /**
   * Đánh dấu webhook đã xử lý
   */
  static async markWebhookAsProcessed(connection, orderId, resultCode) {
    await connection.query(
      'UPDATE momo_webhooks SET is_processed = 1, processed_at = NOW() WHERE order_id = ? AND result_code = ?',
      [orderId, parseInt(resultCode, 10) || 0]
    );
  }

  /**
   * Cập nhật lỗi xử lý webhook
   */
  static async updateWebhookError(connection, orderId, resultCode, errorMessage) {
    await connection.query(
      'UPDATE momo_webhooks SET error_message = ? WHERE order_id = ? AND result_code = ?',
      [errorMessage, orderId, parseInt(resultCode, 10) || 0]
    );
  }

}

module.exports = OrderModel;

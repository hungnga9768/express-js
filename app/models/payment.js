const pool = require("../../connect-mysql");

/**
 * Payment Model - ADMIN BUSINESS VIEW cho payment management  
 * Focus: Doanh thu, thống kê, quản lý business operations
 */
class PaymentModel {
  
  /**
   * Lấy danh sách TRANSACTIONS (admin view) với business info
   */
  static async getTransactions(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      search = '',
      date_from = '',
      date_to = ''
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('mo.status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ? OR mo.order_id LIKE ? OR u.full_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (date_from) {
      whereConditions.push('mo.created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('mo.created_at <= ?');
      params.push(date_to + ' 23:59:59');
    }

    const whereClause = whereConditions.length > 0 ? 
      'WHERE ' + whereConditions.join(' AND ') : '';

    // Get transactions with business context
    const [transactions] = await pool.query(`
      SELECT 
        mo.order_id,
        mo.amount,
        mo.status,
        mo.created_at,
        mo.completed_at,
        mo.expire_time,
        u.user_id,
        u.username,
        u.email,
        u.full_name,
        u.subscription_type,
        u.subscription_expiry,
        sp.name as plan_name,
        sp.duration_months,
        sp.price as plan_price,
        mw.momo_trans_id as trans_id,
        mw.pay_type,
        mw.result_code as momo_result_code,
        CASE 
          WHEN mo.status = 'completed' THEN '✅ Thành công'
          WHEN mo.status = 'pending' THEN '⏳ Chờ thanh toán'
          WHEN mo.status = 'processing' THEN '🔄 Đang xử lý'
          WHEN mo.status = 'failed' THEN '❌ Thất bại'
          WHEN mo.status = 'expired' THEN '⏰ Hết hạn'
          WHEN mo.status = 'cancelled' THEN '🚫 Đã hủy'
          ELSE '❓ Không xác định'
        END as status_display,
        CASE 
          WHEN mo.status = 'completed' THEN mo.amount
          ELSE 0
        END as revenue_amount
      FROM momo_orders mo
      JOIN users u ON mo.user_id = u.user_id
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      LEFT JOIN momo_webhooks mw ON mo.order_id = mw.order_id AND mw.result_code = 0 AND mw.is_processed = 1
      ${whereClause}
      ORDER BY mo.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM momo_orders mo
      JOIN users u ON mo.user_id = u.user_id
      ${whereClause}
    `, params);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      transactions,
      total,
      totalPages
    };
  }

  /**
   * Lấy thống kê BUSINESS METRICS (admin dashboard)
   */
  static async getBusinessStats() {
    const [stats] = await pool.query(`
      SELECT 
        -- Tổng quan
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_transactions,
        
        -- Doanh thu
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_transaction_value,
        
        -- Tỷ lệ thành công
        ROUND(
          COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
          2
        ) as success_rate,
        
        -- Hôm nay
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_transactions,
        SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'completed' THEN amount ELSE 0 END) as today_revenue,
        
        -- Tháng này
        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as this_month_transactions,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status = 'completed' THEN amount ELSE 0 END) as this_month_revenue
        
      FROM momo_orders
    `);

    return stats[0];
  }

  /**
   * Lấy chi tiết đơn hàng theo order_id
   */
  static async getOrderByOrderId(orderId) {
    const [orders] = await pool.query(`
      SELECT 
        mo.*,
        u.username,
        u.email,
        u.full_name,
        u.subscription_type,
        u.subscription_expiry,
        u.profile_picture,
        u.registration_date,
        sp.name as plan_name,
        sp.duration_months,
        sp.price as plan_price,
        sp.discount_percent
      FROM momo_orders mo
      JOIN users u ON mo.user_id = u.user_id
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      WHERE mo.order_id = ?
    `, [orderId]);

    return orders.length > 0 ? orders[0] : null;
  }

  /**
   * Lấy webhook logs cho đơn hàng
   */
  static async getWebhookLogs(orderId) {
    const [webhooks] = await pool.query(`
      SELECT 
        id,
        order_id,
        partner_code,
        request_id,
        amount,
        order_info,
        momo_trans_id,
        result_code,
        message,
        pay_type,
        response_time,
        extra_data,
        signature,
        is_processed,
        processed_at,
        error_message,
        received_at as created_at,
        received_at
      FROM momo_webhooks 
      WHERE order_id = ? 
      ORDER BY received_at DESC
    `, [orderId]);
    
    return webhooks;
  }

  /**
   * Lấy lịch sử subscription của user
   */
  static async getSubscriptionHistory(userId, limit = 10) {
    const [history] = await pool.query(`
      SELECT 
        sh.*,
        sp.name as plan_name
      FROM subscription_history sh
      LEFT JOIN subscription_plans sp ON sh.plan_id = sp.id
      WHERE sh.user_id = ?
      ORDER BY sh.created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return history;
  }

  /**
   * Lấy thống kê overview trong khoảng thời gian
   */
  static async getOverviewStats(period = 30) {
    const [overview] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_order_value
      FROM momo_orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [period]);

    return overview[0];
  }

  /**
   * Lấy doanh thu theo ngày (BUSINESS VIEW)
   */
  static async getDailyRevenue(period = 30) {
    const [dailyRevenue] = await pool.query(`
      SELECT 
        DATE(mo.created_at) as date,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) as successful_transactions,
        SUM(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE 0 END) as daily_revenue,
        AVG(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE NULL END) as avg_transaction_value,
        ROUND(
          COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
          1
        ) as success_rate_percent
      FROM momo_orders mo
      WHERE mo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(mo.created_at)
      ORDER BY date DESC
    `, [period]);

    return dailyRevenue;
  }

  /**
   * Lấy top selling plans (business insights)
   */
  static async getTopSellingPlans(period = 30) {
    const [topPlans] = await pool.query(`
      SELECT 
        sp.name as plan_name,
        sp.duration_months,
        sp.price,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) as successful_orders,
        SUM(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE 0 END) as total_revenue,
        ROUND(AVG(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE NULL END), 0) as avg_revenue_per_order,
        ROUND(
          COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
          1
        ) as conversion_rate
      FROM momo_orders mo
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      WHERE mo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY mo.plan_id, sp.name, sp.duration_months, sp.price
      ORDER BY total_revenue DESC
    `, [period]);

    return topPlans;
  }

  /**
   * Lấy thống kê theo gói subscription
   */
  static async getPlanStats(period = 30) {
    const [planStats] = await pool.query(`
      SELECT 
        sp.name as plan_name,
        sp.duration_months,
        COUNT(*) as order_count,
        SUM(mo.amount) as revenue,
        AVG(mo.amount) as avg_amount
      FROM momo_orders mo
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      WHERE mo.status = 'completed'
        AND mo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY mo.plan_id
      ORDER BY revenue DESC
    `, [period]);

    return planStats;
  }

  /**
   * Lấy đơn hàng gần đây
   */
  static async getRecentOrders(limit = 10) {
    const [recentOrders] = await pool.query(`
      SELECT 
        mo.order_id,
        mo.amount,
        mo.status,
        mo.created_at,
        u.username,
        sp.name as plan_name
      FROM momo_orders mo
      JOIN users u ON mo.user_id = u.user_id
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      ORDER BY mo.created_at DESC
      LIMIT ?
    `, [limit]);

    return recentOrders;
  }

  /**
   * Lấy top VIP customers (high-value insights)
   */
  static async getTopCustomers(period = 30, limit = 10) {
    const [topCustomers] = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.full_name,
        u.subscription_type,
        u.subscription_expiry,
        COUNT(*) as total_purchases,
        COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) as successful_purchases,
        SUM(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE 0 END) as total_spent,
        AVG(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE NULL END) as avg_order_value,
        MAX(mo.created_at) as last_purchase_date,
        DATEDIFF(NOW(), MAX(mo.created_at)) as days_since_last_purchase
      FROM momo_orders mo
      JOIN users u ON mo.user_id = u.user_id
      WHERE mo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY mo.user_id
      HAVING successful_purchases > 0
      ORDER BY total_spent DESC, successful_purchases DESC
      LIMIT ?
    `, [period, limit]);

    return topCustomers;
  }

  /**
   * Lấy payment method analytics
   */
  static async getPaymentMethodStats(period = 30) {
    const [methodStats] = await pool.query(`
      SELECT 
        COALESCE(mw.pay_type, 'unknown') as payment_method,
        COUNT(*) as transaction_count,
        COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) as successful_count,
        SUM(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE 0 END) as revenue,
        ROUND(
          COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
          1
        ) as success_rate
      FROM momo_orders mo
      LEFT JOIN momo_webhooks mw ON mo.order_id = mw.order_id
      WHERE mo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY mw.pay_type
      ORDER BY revenue DESC
    `, [period]);

    return methodStats;
  }

  /**
   * Lấy đơn hàng để export với filters
   */
  static async getOrdersForExport(filters = {}) {
    const { start_date, end_date, status } = filters;
    
    let whereConditions = [];
    let params = [];

    if (start_date) {
      whereConditions.push('mo.created_at >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('mo.created_at <= ?');
      params.push(end_date + ' 23:59:59');
    }

    if (status) {
      whereConditions.push('mo.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 
      'WHERE ' + whereConditions.join(' AND ') : '';

    const [orders] = await pool.query(`
      SELECT 
        mo.order_id,
        mo.amount,
        mo.status,
        mo.created_at,
        mo.completed_at,
        u.username,
        u.email,
        u.full_name,
        sp.name as plan_name,
        sp.duration_months
      FROM momo_orders mo
      JOIN users u ON mo.user_id = u.user_id
      JOIN subscription_plans sp ON mo.plan_id = sp.id
      ${whereClause}
      ORDER BY mo.created_at DESC
    `, params);

    return orders;
  }

}

module.exports = PaymentModel;

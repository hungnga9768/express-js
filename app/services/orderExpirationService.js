const pool = require('../../connect-mysql');

/**
 * Service xử lý đơn hàng hết hạn
 */

/**
 * Lấy thống kê đơn hàng
 */
async function getOrderExpirationStats() {
  try {
    const [results] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'pending' AND expire_time < NOW() THEN 1 ELSE 0 END) as expired_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM momo_orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `);

    return results[0] || {
      total_orders: 0,
      total_pending: 0,
      expired_orders: 0,
      processing_orders: 0,
      completed_orders: 0,
      failed_orders: 0,
      cancelled_orders: 0
    };
  } catch (error) {
    console.error('Error getting order expiration stats:', error);
    throw error;
  }
}

/**
 * Hủy các đơn hàng hết hạn (status = pending và expire_time < now)
 */
async function expireOldOrders() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Tìm các đơn hàng hết hạn
    const [expiredOrders] = await connection.query(`
      SELECT id, order_id, user_id, amount, plan_name
      FROM momo_orders 
      WHERE status = 'pending' 
        AND expire_time < NOW()
      ORDER BY expire_time ASC
    `);

    if (expiredOrders.length === 0) {
      await connection.commit();
      return 0;
    }

    console.log(`🔍 Found ${expiredOrders.length} expired orders to cancel:`, 
      expiredOrders.map(order => ({ 
        order_id: order.order_id, 
        user_id: order.user_id,
        plan: order.plan_name,
        amount: order.amount 
      }))
    );

    // Cập nhật status thành 'cancelled'
    const orderIds = expiredOrders.map(order => order.id);
    const [updateResult] = await connection.query(`
      UPDATE momo_orders 
      SET status = 'cancelled', 
          updated_at = NOW(),
          cancel_reason = 'Đơn hàng hết hạn sau 15 phút'
      WHERE id IN (${orderIds.map(() => '?').join(',')})
    `, orderIds);

    await connection.commit();
    
    console.log(`✅ Successfully cancelled ${updateResult.affectedRows} expired orders`);
    return updateResult.affectedRows;

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error expiring old orders:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Kiểm tra và hủy đơn hàng hết hạn cho một user cụ thể
 */
async function checkUserOrderExpiration(userId) {
  try {
    const [expiredOrders] = await pool.query(`
      SELECT id, order_id, amount, plan_name, expire_time
      FROM momo_orders 
      WHERE user_id = ? 
        AND status = 'pending' 
        AND expire_time < NOW()
      ORDER BY expire_time DESC
      LIMIT 10
    `, [userId]);

    if (expiredOrders.length > 0) {
      const orderIds = expiredOrders.map(order => order.id);
      await pool.query(`
        UPDATE momo_orders 
        SET status = 'cancelled', 
            updated_at = NOW(),
            cancel_reason = 'Đơn hàng hết hạn sau 15 phút'
        WHERE id IN (${orderIds.map(() => '?').join(',')})
      `, orderIds);

      console.log(`🔄 Auto-cancelled ${expiredOrders.length} expired orders for user ${userId}`);
    }

    return expiredOrders.length;
  } catch (error) {
    console.error('Error checking user order expiration:', error);
    throw error;
  }
}

/**
 * Lấy danh sách đơn hàng sắp hết hạn (trong 5 phút tới)
 */
async function getOrdersNearExpiration() {
  try {
    const [orders] = await pool.query(`
      SELECT 
        id, order_id, user_id, amount, plan_name, 
        expire_time, 
        TIMESTAMPDIFF(MINUTE, NOW(), expire_time) as minutes_remaining
      FROM momo_orders 
      WHERE status = 'pending' 
        AND expire_time > NOW() 
        AND expire_time <= DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      ORDER BY expire_time ASC
    `);

    return orders;
  } catch (error) {
    console.error('Error getting orders near expiration:', error);
    throw error;
  }
}

module.exports = {
  getOrderExpirationStats,
  expireOldOrders,
  checkUserOrderExpiration,
  getOrdersNearExpiration
};

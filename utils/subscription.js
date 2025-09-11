const db = require('../connect-mysql');

/**
 * Lấy giới hạn subscription cho một feature
 */
async function getSubscriptionLimit(subscriptionType, feature) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM subscription_limits WHERE subscription_type = ? AND feature = ?',
      [subscriptionType, feature]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting subscription limit:', error);
    return null;
  }
}

/**
 * Lấy usage hiện tại của user cho một feature trong ngày
 */
async function getDailyUsage(userId, feature, date) {
  try {
    const [rows] = await db.execute(
      'SELECT usage_count FROM daily_usage WHERE user_id = ? AND feature = ? AND date = ?',
      [userId, feature, date]
    );
    return rows[0]?.usage_count || 0;
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return 0;
  }
}

/**
 * Tăng usage count cho user
 */
async function incrementDailyUsage(userId, feature, date) {
  try {
    await db.execute(
      'INSERT INTO daily_usage (user_id, feature, usage_count, date) VALUES (?, ?, 1, ?) ON DUPLICATE KEY UPDATE usage_count = usage_count + 1',
      [userId, feature, date]
    );
  } catch (error) {
    console.error('Error incrementing daily usage:', error);
    throw error;
  }
}

/**
 * Kiểm tra subscription có hết hạn không
 */
function isSubscriptionExpired(user) {
  if (!user.subscription_expiry) return false;
  return new Date() > new Date(user.subscription_expiry);
}

/**
 * Lấy ngày hiện tại dạng YYYY-MM-DD
 */
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Lấy thông tin usage của user cho tất cả features trong ngày
 */
async function getUserDailyUsage(userId, date) {
  try {
    const [rows] = await db.execute(
      'SELECT feature, usage_count FROM daily_usage WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    
    const usage = {};
    rows.forEach(row => {
      usage[row.feature] = row.usage_count;
    });
    
    return usage;
  } catch (error) {
    console.error('Error getting user daily usage:', error);
    return {};
  }
}

/**
 * Reset usage cho user
 */
async function resetUserUsage(userId, feature = null, date = null) {
  try {
    let query = 'DELETE FROM daily_usage WHERE user_id = ?';
    const params = [userId];
    
    if (feature) {
      query += ' AND feature = ?';
      params.push(feature);
    }
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    await db.execute(query, params);
  } catch (error) {
    console.error('Error resetting user usage:', error);
    throw error;
  }
}

module.exports = {
  getSubscriptionLimit,
  getDailyUsage,
  incrementDailyUsage,
  isSubscriptionExpired,
  getCurrentDate,
  getUserDailyUsage,
  resetUserUsage
};

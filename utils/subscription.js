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
 * 🔄 TỰ ĐỘNG xử lý Premium hết hạn → chuyển về Free
 */
async function autoHandleExpiredSubscription(userId) {
  try {
    const db = require('../connect-mysql');
    
    // Lấy thông tin user từ database
    const [users] = await db.execute(
      'SELECT user_id, subscription_type, subscription_expiry FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      console.log(`❌ User ${userId} not found for expiry check`);
      return null;
    }
    
    const user = users[0];
    
    // Kiểm tra nếu premium và đã hết hạn
    if (user.subscription_type === 'premium' && isSubscriptionExpired(user)) {
      console.log(`🔄 Auto-expiring premium user ${userId}: ${user.subscription_expiry}`);
      
      // Cập nhật về Free
      await db.execute(
        'UPDATE users SET subscription_type = ?, subscription_expiry = NULL WHERE user_id = ?',
        ['free', userId]
      );
      
      // Reset usage về 0 để user dùng quota Free
      await resetUserUsageOnSubscriptionChange(userId, 'premium', 'free');
      
      // Clear cache để áp dụng ngay
      const { clearUserCache } = require('../middlewares/subscription');
      clearUserCache(userId);
      
      console.log(`✅ User ${userId} auto-expired: premium → free`);
      
      return {
        userId,
        oldSubscription: 'premium',
        newSubscription: 'free',
        expiredDate: user.subscription_expiry,
        processedAt: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error auto-handling expired subscription for user ${userId}:`, error.message);
    throw error;
  }
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

/**
 * Reset usage cho user khi thay đổi subscription
 */
async function resetUserUsageOnSubscriptionChange(userId, oldSubscriptionType, newSubscriptionType, date = null) {
  try {
    const today = date || getCurrentDate();
    
    // Lấy limits của cả old và new subscription
    const oldLimits = await getSubscriptionLimitsByType(oldSubscriptionType);
    const newLimits = await getSubscriptionLimitsByType(newSubscriptionType);
    
    // Tìm các features cần reset
    const featuresToReset = [];
    
    for (const feature of ['chat', 'translate', 'speech_practice', 'hsk_tests', 'flashcard']) {
      const oldLimit = oldLimits[feature] || 0;
      const newLimit = newLimits[feature] || 0;
      const currentUsage = await getDailyUsage(userId, feature, today);
      
      // 🔒 LOGIC MỚI: Reset trong các trường hợp sau:
      
      // 1. Premium → Free: Reset về 0 (để user dùng quota Free)
      if (oldSubscriptionType === 'premium' && newSubscriptionType === 'free') {
        if (currentUsage > 0) {
          featuresToReset.push(feature);
          console.log(`🔄 Premium→Free: Reset ${feature} (${currentUsage} → 0) - Để user dùng quota Free`);
        }
      }
      
      // 2. Free → Premium: Không reset (giữ nguyên usage)
      else if (oldSubscriptionType === 'free' && newSubscriptionType === 'premium') {
        console.log(`✅ Free→Premium: Keep ${feature} usage (${currentUsage})`);
      }
      
      // 3. Free → Free: Không reset (giữ nguyên usage)
      else if (oldSubscriptionType === 'free' && newSubscriptionType === 'free') {
        console.log(`✅ Free→Free: Keep ${feature} usage (${currentUsage})`);
      }
      
      // 4. Các trường hợp khác: Reset nếu usage > limit mới
      else if (newLimit > 0 && currentUsage > newLimit) {
        featuresToReset.push(feature);
        console.log(`🔄 Other: Reset ${feature} (${currentUsage} > ${newLimit})`);
      }
    }
    
    // Reset usage cho các features cần thiết
    for (const feature of featuresToReset) {
      await resetUserUsage(userId, feature, today);
      console.log(`🔄 Reset usage for user ${userId}, feature: ${feature}, date: ${today}`);
    }
    
    return {
      resetFeatures: featuresToReset,
      message: `Reset usage for ${featuresToReset.length} features`
    };
    
  } catch (error) {
    console.error('Error resetting user usage on subscription change:', error);
    throw error;
  }
}

/**
 * Lấy tất cả limits của một subscription type
 */
async function getSubscriptionLimitsByType(subscriptionType) {
  try {
    const [rows] = await db.execute(
      'SELECT feature, daily_limit FROM subscription_limits WHERE subscription_type = ?',
      [subscriptionType]
    );
    
    const limits = {};
    rows.forEach(row => {
      limits[row.feature] = row.daily_limit;
    });
    
    // Fallback limits nếu DB chưa có
    if (Object.keys(limits).length === 0) {
      const defaultLimits = {
        free: { chat: 10, translate: 20, speech_practice: 20, hsk_tests: 5, flashcard: 0 },
        premium: { chat: 100, translate: 100, speech_practice: -1, hsk_tests: -1, flashcard: -1 }
      };
      return defaultLimits[subscriptionType] || {};
    }
    
    return limits;
  } catch (error) {
    console.error('Error getting subscription limits by type:', error);
    return {};
  }
}

module.exports = {
  getSubscriptionLimit,
  getDailyUsage,
  incrementDailyUsage,
  isSubscriptionExpired,
  autoHandleExpiredSubscription,
  getCurrentDate,
  getUserDailyUsage,
  resetUserUsage,
  resetUserUsageOnSubscriptionChange,
  getSubscriptionLimitsByType
};

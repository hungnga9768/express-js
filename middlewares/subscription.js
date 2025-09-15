const db = require('../connect-mysql');
const { 
  getSubscriptionLimit, 
  getDailyUsage, 
  incrementDailyUsage, 
  isSubscriptionExpired,
  getCurrentDate,
  resetUserUsage,
  resetUserUsageOnSubscriptionChange,
  getSubscriptionLimitsByType
} = require('../utils/subscription');

// Cache cho user data
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Lấy thông tin user từ database với cache
 */
async function getUserFromDatabase(userId) {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const [rows] = await db.execute(
      'SELECT user_id, username, email, subscription_type, subscription_expiry, account_status FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const userData = rows[0];
    
    userCache.set(cacheKey, {
      data: userData,
      timestamp: Date.now()
    });
    
    return userData;
  } catch (error) {
    console.error('Database error in getUserFromDatabase:', error);
    return null;
  }
}

/**
 * Clear cache của một user cụ thể
 */
function clearUserCache(userId) {
  const cacheKey = `user_${userId}`;
  userCache.delete(cacheKey);
  console.log(`Cache cleared for user ${userId}`);
}

/**
 * Clear tất cả cache
 */
function clearAllCache() {
  userCache.clear();
  console.log('All user cache cleared');
}

/**
 * Lấy thống kê cache
 */
function getCacheStats() {
  return {
    totalCached: userCache.size,
    cacheKeys: Array.from(userCache.keys()),
    timestamp: new Date().toISOString()
  };
}

/**
 * Middleware kiểm tra subscription có quyền truy cập feature không
 */
function checkSubscription(requiredFeature) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || !user.user_id) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Vui lòng đăng nhập để sử dụng tính năng này'
        });
      }

      // 🔒 SECURITY: Validate user từ database (KHÔNG tin tưởng JWT)
      const dbUser = await getUserFromDatabase(user.user_id);
      
      if (!dbUser) {
        return res.status(401).json({
          error: 'User not found',
          message: 'Người dùng không tồn tại trong hệ thống'
        });
      }

      // Kiểm tra account status
      if (dbUser.account_status !== 'active') {
        return res.status(403).json({
          error: 'Account suspended',
          message: 'Tài khoản đã bị khóa'
        });
      }

      // 🔒 SECURITY: Kiểm tra subscription expiry từ database
      if (isSubscriptionExpired(dbUser)) {
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Gói đăng ký đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
          subscription_type: dbUser.subscription_type,
          subscription_expiry: dbUser.subscription_expiry
        });
      }

      // 🔒 SECURITY: Sử dụng subscription_type từ database
      const subscriptionType = dbUser.subscription_type || 'free';
      let limit = await getSubscriptionLimit(subscriptionType, requiredFeature);

      // Kiểm tra nếu có limit từ DB và daily_limit = 0 (không được truy cập)
      if (limit && limit.daily_limit === 0) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `Tính năng ${requiredFeature} không có sẵn cho gói đăng ký ${subscriptionType} của bạn.`
        });
      }

      // Fallback nếu DB chưa có cấu hình subscription_limits
      if (!limit) {
        const defaultLimits = {
          free: { chat: 10, translate: 20, speech_practice: 20, hsk_tests: 5, flashcard: 0 },
          premium: { chat: 100, translate: 100, speech_practice: -1, hsk_tests: -1, flashcard: -1 }
        };
        const fallback = defaultLimits[subscriptionType]?.[requiredFeature];
        if (typeof fallback === 'number') {
          // Nếu limit = 0, nghĩa là không được truy cập feature này
          if (fallback === 0) {
            return res.status(403).json({
              error: 'Feature not available',
              message: `Tính năng ${requiredFeature} không có sẵn cho gói đăng ký ${subscriptionType} của bạn.`
            });
          }
          limit = { daily_limit: fallback, description: 'fallback-default' };
        } else {
          return res.status(403).json({
            error: 'Feature not available',
            message: `Tính năng ${requiredFeature} không có sẵn cho gói đăng ký ${subscriptionType} của bạn.`
          });
        }
      }

      // Lưu thông tin limit vào request để middleware tiếp theo sử dụng
      req.subscriptionLimit = limit;
      req.dbUser = dbUser;
      
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Lỗi hệ thống khi kiểm tra quyền truy cập'
      });
    }
  };
}

/**
 * Middleware kiểm tra daily limit
 */
function checkDailyLimit() {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const today = getCurrentDate();
      
      if (!req.subscriptionLimit) {
        return res.status(500).json({
          error: 'Subscription limit not set',
          message: 'Giới hạn subscription chưa được thiết lập'
        });
      }

      // Lấy tên feature từ request
      let featureName = req.subscriptionLimit.feature;
      
      if (!featureName) {
        return res.status(500).json({
          error: 'Feature not specified',
          message: 'Không xác định được tính năng cần kiểm tra'
        });
      }

      // Lấy usage hiện tại
      const currentUsage = await getDailyUsage(user.user_id, featureName, today);
      const limit = req.subscriptionLimit?.daily_limit || 0;
      
      // Kiểm tra limit (-1 = unlimited)
      if (limit !== -1 && currentUsage >= limit) {
        return res.status(429).json({
          error: 'Daily limit exceeded',
          message: `Bạn đã sử dụng hết ${limit} ${featureName} hôm nay. Vui lòng thử lại vào ngày mai hoặc nâng cấp lên Premium.`,
          limit: limit,
          current: currentUsage,
          feature: featureName,
          resetTime: 'tomorrow',
          upgrade_url: '/upgrade'
        });
      }
      
      // Lưu thông tin usage vào request
      req.currentUsage = currentUsage;
      req.featureName = featureName;
      req.today = today;
      
      next();
    } catch (error) {
      console.error('Daily limit check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Lỗi hệ thống khi kiểm tra giới hạn sử dụng'
      });
    }
  };
}

/**
 * Middleware tăng usage count sau khi xử lý thành công
 */
async function incrementUsage(req, res, next) {
  try {
    if (req.currentUsage !== undefined && req.featureName && req.today) {
      await incrementDailyUsage(req.user.user_id, req.featureName, req.today);
    }
    next();
  } catch (error) {
    console.error('Error incrementing usage:', error);
    next(); // Không block request nếu lỗi increment
  }
}

// Middleware functions cho từng feature
const checkChatPermission = checkSubscription('chat');
const checkTranslatePermission = checkSubscription('translate');
const checkSpeechPermission = checkSubscription('speech_practice');
const checkHSKPermission = checkSubscription('hsk_tests');
const checkFlashcardPermission = checkSubscription('flashcard');

module.exports = {
  checkSubscription,
  checkDailyLimit,
  incrementUsage,
  checkFlashcardPermission,
  checkHSKPermission,
  checkSpeechPermission,
  checkChatPermission,
  checkTranslatePermission,
  clearUserCache,
  clearAllCache,
  getCacheStats,
  getUserFromDatabase
};

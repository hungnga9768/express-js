const { 
  getSubscriptionLimit, 
  getDailyUsage, 
  incrementDailyUsage, 
  isSubscriptionExpired,
  getCurrentDate 
} = require('../utils/subscription');

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

      // Kiểm tra subscription có hết hạn không
      if (isSubscriptionExpired(user)) {
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Gói đăng ký đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
          subscription_type: user.subscription_type,
          subscription_expiry: user.subscription_expiry
        });
      }

      // Lấy giới hạn subscription (fallback 'free' nếu thiếu)
      const subscriptionType = user?.subscription_type || 'free';
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
      req.requiredFeature = requiredFeature;
      
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
function checkDailyLimit(feature = null) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const featureName = feature || req.requiredFeature;
      const today = getCurrentDate();
      
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
function incrementUsage(feature = null) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const featureName = feature || req.featureName;
      const today = req.today || getCurrentDate();
      
      if (!featureName) {
        console.warn('Feature name not specified for usage increment');
        return next();
      }

      // Tăng usage count
      await incrementDailyUsage(user.user_id, featureName, today);
      
      // Log để debug
      console.log(`Incremented usage for user ${user.user_id}, feature: ${featureName}, date: ${today}`);
      
      next();
    } catch (error) {
      console.error('Failed to increment usage:', error);
      // Không block request nếu không tăng được usage
      next();
    }
  };
}

/**
 * Middleware kiểm tra quyền tạo flashcard (chỉ Premium)
 */
function checkFlashcardPermission() {
  return checkSubscription('flashcard');
}

/**
 * Middleware kiểm tra quyền HSK tests
 */
function checkHSKPermission() {
  return checkSubscription('hsk_tests');
}

/**
 * Middleware kiểm tra quyền speech practice
 */
function checkSpeechPermission() {
  return checkSubscription('speech_practice');
}

/**
 * Middleware kiểm tra quyền chat
 */
function checkChatPermission() {
  return checkSubscription('chat');
}

/**
 * Middleware kiểm tra quyền translate
 */
function checkTranslatePermission() {
  return checkSubscription('translate');
}

module.exports = {
  checkSubscription,
  checkDailyLimit,
  incrementUsage,
  checkFlashcardPermission,
  checkHSKPermission,
  checkSpeechPermission,
  checkChatPermission,
  checkTranslatePermission
};

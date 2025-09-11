const express = require("express");
const router = express.Router();
const authenticateTokenUser = require("../../middlewares/authAPI");
const { getUserDailyUsage, getCurrentDate } = require("../../utils/subscription");

/**
 * API lấy thông tin usage của user trong ngày
 * GET /api/usage/daily
 */
router.get("/daily", authenticateTokenUser, async (req, res) => {
  try {
    const user = req.user;
    const today = getCurrentDate();
    
    // Lấy usage của tất cả features trong ngày
    const usage = await getUserDailyUsage(user.user_id, today);
    
    // Lấy limits từ subscription
    const db = require("../../connect-mysql");
    const [limits] = await db.execute(
      'SELECT feature, daily_limit FROM subscription_limits WHERE subscription_type = ?',
      [user.subscription_type]
    );
    
    // Tạo response với thông tin đầy đủ
    const features = ['chat', 'translate', 'speech_practice', 'hsk_tests', 'flashcard'];
    const usageInfo = {};
    
    features.forEach(feature => {
      const limit = limits.find(l => l.feature === feature);
      usageInfo[feature] = {
        used: usage[feature] || 0,
        limit: limit?.daily_limit || 0,
        unlimited: limit?.daily_limit === -1,
        remaining: limit?.daily_limit === -1 ? 'unlimited' : Math.max(0, (limit?.daily_limit || 0) - (usage[feature] || 0))
      };
    });
    
    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        subscription_type: user.subscription_type,
        date: today,
        usage: usageInfo,
        summary: {
          total_features_used: Object.keys(usage).length,
          features_with_limits: features.filter(f => !usageInfo[f].unlimited).length,
          features_unlimited: features.filter(f => usageInfo[f].unlimited).length
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting daily usage:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sử dụng',
      error: error.message
    });
  }
});

/**
 * API lấy thông tin subscription của user
 * GET /api/usage/subscription
 */
router.get("/subscription", authenticateTokenUser, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        subscription_type: user.subscription_type,
        subscription_expiry: user.subscription_expiry,
        is_expired: user.subscription_expiry ? new Date() > new Date(user.subscription_expiry) : false,
        features: {
          chat: user.subscription_type === 'premium' ? '100 tin nhắn/ngày' : '10 tin nhắn/ngày',
          translate: user.subscription_type === 'premium' ? '100 lần/ngày' : '20 lần/ngày',
          speech_practice: user.subscription_type === 'premium' ? 'Không giới hạn' : '20 lần/ngày',
          hsk_tests: user.subscription_type === 'premium' ? 'Không giới hạn' : '5 bài/level',
          flashcard: user.subscription_type === 'premium' ? 'Tạo flashcard riêng' : 'Không có'
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting subscription info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin subscription',
      error: error.message
    });
  }
});

module.exports = router;

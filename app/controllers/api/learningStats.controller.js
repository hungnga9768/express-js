// =====================================================
// LEARNING STATS CONTROLLER - OPTIMIZED VERSION
// =====================================================
// Tối ưu hóa API controller với better error handling và validation
// =====================================================

const { 
  getLearningStats, 
  getStreakLeaderboard, 
  syncDailyStats,
  getDetailedStats
} = require('../../../utils/learningStats');

/**
 * 📊 API: Lấy learning statistics của user
 * GET /api/user/learning-stats
 */
async function getUserLearningStats(req, res) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để xem thống kê học tập'
      });
    }

    const result = await getLearningStats(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: result.error || 'Không thể lấy thống kê học tập',
        data: result.data
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
      user_id: userId
    });

  } catch (error) {
    console.error('Error in getUserLearningStats:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Lỗi hệ thống khi lấy thống kê học tập',
      data: {
        streak_days: 0,
        today_lessons: 0,
        overall_progress: 0,
        today_activities: 0,
        today_study_minutes: 0,
        last_activity: null
      }
    });
  }
}

/**
 * 🏆 API: Lấy leaderboard streak
 * GET /api/user/streak-leaderboard?limit=10
 */
async function getStreakLeaderboardAPI(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_LIMIT',
        message: 'Limit phải từ 1 đến 50'
      });
    }

    const leaderboard = await getStreakLeaderboard(limit);
    
    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        total_users: leaderboard.length,
        limit,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getStreakLeaderboardAPI:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể lấy bảng xếp hạng streak'
    });
  }
}

/**
 * 🔄 API: Sync daily stats (Admin only)
 * POST /api/admin/sync-daily-stats
 * Body: { user_id?: number }
 */
async function syncDailyStatsAPI(req, res) {
  try {
    const { user_id } = req.body;
    
    // Validate user_id if provided
    if (user_id !== undefined) {
      if (!Number.isInteger(user_id) || user_id <= 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_USER_ID',
          message: 'user_id phải là số nguyên dương'
        });
      }
    }
    
    const result = await syncDailyStats(user_id);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'SYNC_FAILED',
        message: 'Không thể sync daily stats'
      });
    }

    res.status(200).json({
      success: true,
      message: user_id 
        ? `Đã sync daily stats cho user ${user_id}` 
        : 'Đã sync daily stats cho tất cả users có hoạt động',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in syncDailyStatsAPI:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Lỗi hệ thống khi sync daily stats'
    });
  }
}

/**
 * 📈 API: Lấy detailed stats (7 ngày gần nhất)
 * GET /api/user/detailed-stats
 */
async function getUserDetailedStats(req, res) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Vui lòng đăng nhập'
      });
    }

    // Get both detailed stats and overview
    const [dailyStats, overviewResult] = await Promise.all([
      getDetailedStats(userId),
      getLearningStats(userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        // Summary overview
        summary: {
          streak_days: overviewResult.data?.streak_days || 0,
          today_lessons: overviewResult.data?.today_lessons || 0,
          overall_progress: overviewResult.data?.overall_progress || 0,
          today_activities: overviewResult.data?.today_activities || 0,
          today_study_minutes: overviewResult.data?.today_study_minutes || 0
        },
        // Detailed daily breakdown
        daily_stats: dailyStats,
        period: 'last_7_days',
        total_days: dailyStats.length,
        user_id: userId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getUserDetailedStats:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể lấy thống kê chi tiết'
    });
  }
}

/**
 * 🎯 API: Health check cho learning stats system
 * GET /api/user/learning-stats/health
 */
async function getStatsHealthCheck(req, res) {
  try {
    const db = require('../../../connect-mysql');
    
    // Test database connection
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM user_daily_stats');
    
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        total_records: rows[0].total,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getStatsHealthCheck:', error);
    res.status(503).json({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Learning stats service is not available'
    });
  }
}

module.exports = {
  getUserLearningStats,
  getStreakLeaderboardAPI,
  syncDailyStatsAPI,
  getUserDetailedStats,
  getStatsHealthCheck
};
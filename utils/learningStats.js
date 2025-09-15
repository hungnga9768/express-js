// =====================================================
// LEARNING STATS UTILITIES - OPTIMIZED VERSION
// =====================================================
// Tối ưu hóa performance và error handling cho learning statistics
// =====================================================

const db = require('../connect-mysql');
const UserDailyStats = require('../app/models/userDailyStats');

// Constants
const ACTIVITY_MINUTES = {
  lesson: 15,
  chat: 5,
  translate: 2,
  speech_practice: 3,
  hsk_test: 30,
  flashcard: 1
};

const VALID_ACTIVITIES = Object.keys(ACTIVITY_MINUTES);

/**
 * 📅 Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * ✅ Validate input parameters
 */
function validateUserId(userId) {
  if (!userId || !Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user ID');
  }
}

function validateActivityType(activityType) {
  if (!activityType || !VALID_ACTIVITIES.includes(activityType)) {
    throw new Error(`Invalid activity type. Must be one of: ${VALID_ACTIVITIES.join(', ')}`);
  }
}

/**
 * 📈 Update daily stats khi user hoàn thành activity
 * @param {number} userId - ID của user
 * @param {string} activityType - Loại hoạt động
 * @param {number} studyMinutes - Số phút học (optional)
 * @returns {Promise<boolean>} Success status
 */
async function updateDailyStats(userId, activityType, studyMinutes = null) {
  try {
    validateUserId(userId);
    validateActivityType(activityType);
    
    const today = getTodayDate();
    const minutes = studyMinutes ?? ACTIVITY_MINUTES[activityType];
    
    // Validate study minutes
    if (typeof minutes !== 'number' || minutes < 0 || minutes > 480) { // Max 8 hours
      throw new Error('Invalid study minutes');
    }

    // Batch update - single transaction for better performance
    await db.execute('START TRANSACTION');
    
    try {
      // Ensure record exists
      await UserDailyStats.getDailyStats(userId, today);
      
      // Update activities and study minutes
      await UserDailyStats.incrementField(userId, today, 'activities_count', 1);
      await UserDailyStats.incrementField(userId, today, 'study_minutes', minutes);
      
      // Update lessons if it's a lesson completion
      if (activityType === 'lesson') {
        await UserDailyStats.incrementField(userId, today, 'lessons_completed', 1);
      }
      
      await db.execute('COMMIT');
      return true;
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating daily stats:', error.message);
    return false;
  }
}

/**
 * 🔥 Tính streak days cho user (optimized)
 * @param {number} userId - ID của user
 * @returns {Promise<number>} Số ngày học liên tiếp
 */
async function getStreakDays(userId) {
  try {
    validateUserId(userId);
    const today = getTodayDate();
    return await UserDailyStats.calculateStreakDays(userId, today);
  } catch (error) {
    console.error('Error getting streak days:', error.message);
    return 0;
  }
}

/**
 * 📚 Tính overall progress từ course enrollments (cached)
 * @param {number} userId - ID của user  
 * @returns {Promise<number>} Phần trăm tiến độ tổng thể (0-100)
 */
async function calculateOverallProgress(userId) {
  try {
    validateUserId(userId);
    
    const [rows] = await db.execute(`
      SELECT 
        COALESCE(ROUND(AVG(COALESCE(completion_percentage, 0))), 0) as avg_progress,
        COUNT(*) as total_courses
      FROM courseenrollments 
      WHERE user_id = ?
    `, [userId]);

    const result = rows[0];
    return result?.total_courses > 0 ? result.avg_progress : 0;
  } catch (error) {
    console.error('Error calculating overall progress:', error.message);
    return 0;
  }
}

/**
 * 📖 Tính số lessons completed hôm nay từ learningprogress (optimized)
 * @param {number} userId - ID của user
 * @returns {Promise<number>} Số bài học hoàn thành hôm nay
 */
async function getTodayLessonsFromProgress(userId) {
  try {
    validateUserId(userId);
    const today = getTodayDate();
    
    const [rows] = await db.execute(`
      SELECT COUNT(*) as lessons_today
      FROM learningprogress 
      WHERE user_id = ? 
        AND completion_status = 'completed' 
        AND DATE(completion_date) = ?
    `, [userId, today]);

    return rows[0]?.lessons_today || 0;
  } catch (error) {
    console.error('Error getting today lessons:', error.message);
    return 0;
  }
}

/**
 * 🎯 Lấy learning stats đầy đủ cho API response (OPTIMIZED)
 * @param {number} userId - ID của user
 * @returns {Promise<Object>} Complete learning stats object
 */
async function getLearningStats(userId) {
  try {
    validateUserId(userId);
    const today = getTodayDate();
    
    // 🚀 OPTIMIZATION: Parallel execution for better performance
    const [dailyStats, lessonsFromProgress, overallProgress] = await Promise.all([
      UserDailyStats.getDailyStats(userId, today),
      getTodayLessonsFromProgress(userId),
      calculateOverallProgress(userId)
    ]);
    
    // Sync lesson count if needed
    const todayLessons = Math.max(dailyStats.lessons_completed || 0, lessonsFromProgress);
    
    let streakDays = dailyStats.streak_count || 0;
    let shouldUpdateStats = false;
    
    // Only update if there's a discrepancy
    if (todayLessons > (dailyStats.lessons_completed || 0)) {
      shouldUpdateStats = true;
    }
    
    // Recalculate streak if it's not set or if there's new activity
    if (!streakDays || shouldUpdateStats) {
      streakDays = await getStreakDays(userId);
      shouldUpdateStats = true;
    }
    
    // 🚀 OPTIMIZATION: Only update DB if necessary
    if (shouldUpdateStats) {
      const updates = { streak_count: streakDays };
      if (todayLessons > (dailyStats.lessons_completed || 0)) {
        updates.lessons_completed = todayLessons;
      }
      await UserDailyStats.updateDailyStats(userId, today, updates);
    }

    return {
      success: true,
      data: {
        streak_days: streakDays,
        today_lessons: todayLessons,
        overall_progress: overallProgress,
        today_activities: dailyStats.activities_count || 0,
        today_study_minutes: dailyStats.study_minutes || 0,
        last_activity: dailyStats.last_activity_time
      }
    };
  } catch (error) {
    console.error('Error getting learning stats:', error.message);
    return {
      success: false,
      error: error.message || 'Unable to fetch learning statistics',
      data: {
        streak_days: 0,
        today_lessons: 0,
        overall_progress: 0,
        today_activities: 0,
        today_study_minutes: 0,
        last_activity: null
      }
    };
  }
}

/**
 * 📊 Lấy leaderboard streak (OPTIMIZED)
 * @param {number} limit - Số lượng users (1-50)
 * @returns {Promise<Array>} Array of top streak users
 */
async function getStreakLeaderboard(limit = 10) {
  try {
    // Validate limit
    const validLimit = Math.max(1, Math.min(50, parseInt(limit) || 10));
    const today = getTodayDate();
    
    const [rows] = await db.execute(`
      SELECT 
        uds.user_id,
        u.username,
        u.full_name,
        u.profile_picture,
        uds.streak_count,
        uds.last_activity_time
      FROM user_daily_stats uds
      INNER JOIN users u ON uds.user_id = u.user_id
      WHERE uds.date = ? 
        AND uds.streak_count > 0
        AND u.account_status = 'active'
      ORDER BY uds.streak_count DESC, uds.last_activity_time DESC
      LIMIT ?
    `, [today, validLimit]);

    return rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      profile_picture: row.profile_picture,
      streak_days: row.streak_count,
      last_active: row.last_activity_time
    }));
  } catch (error) {
    console.error('Error getting streak leaderboard:', error.message);
    return [];
  }
}

/**
 * 🔄 Sync daily stats (OPTIMIZED - batch processing)
 * @param {number} userId - ID của user (optional)
 * @returns {Promise<boolean>} Success status
 */
async function syncDailyStats(userId = null) {
  try {
    const today = getTodayDate();
    let usersToSync = [];
    
    if (userId) {
      validateUserId(userId);
      usersToSync = [{ user_id: userId }];
    } else {
      // Get users with activity today (optimized query)
      const [users] = await db.execute(`
        SELECT DISTINCT user_id 
        FROM learningprogress 
        WHERE DATE(completion_date) = ? OR DATE(last_accessed) = ?
        LIMIT 1000
      `, [today, today]);
      usersToSync = users;
    }

    if (usersToSync.length === 0) {
      return true;
    }

    // 🚀 OPTIMIZATION: Batch processing for better performance
    const batchSize = 100;
    let syncCount = 0;
    
    for (let i = 0; i < usersToSync.length; i += batchSize) {
      const batch = usersToSync.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          const lessonsToday = await getTodayLessonsFromProgress(user.user_id);
          
          if (lessonsToday > 0) {
            await UserDailyStats.updateDailyStats(user.user_id, today, {
              lessons_completed: lessonsToday
            });
            syncCount++;
          }
        } catch (error) {
          console.error(`Error syncing user ${user.user_id}:`, error.message);
        }
      }));
    }

    return true;
  } catch (error) {
    console.error('Error syncing daily stats:', error.message);
    return false;
  }
}

/**
 * 📈 Get user detailed stats (7 days) - OPTIMIZED
 * @param {number} userId - ID của user
 * @returns {Promise<Array>} Array of daily stats
 */
async function getDetailedStats(userId) {
  try {
    validateUserId(userId);
    
    const [rows] = await db.execute(`
      SELECT 
        date,
        lessons_completed,
        activities_count,
        study_minutes,
        streak_count,
        last_activity_time
      FROM user_daily_stats 
      WHERE user_id = ? 
        AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY date DESC
    `, [userId]);

    return rows;
  } catch (error) {
    console.error('Error getting detailed stats:', error.message);
    return [];
  }
}

module.exports = {
  updateDailyStats,
  getStreakDays,
  calculateOverallProgress,
  getTodayLessonsFromProgress,
  getLearningStats,
  syncDailyStats,
  getStreakLeaderboard,
  getDetailedStats,
  
  // Export utilities for testing
  getTodayDate,
  validateUserId,
  validateActivityType,
  ACTIVITY_MINUTES,
  VALID_ACTIVITIES
};
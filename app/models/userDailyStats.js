// =====================================================
// USER DAILY STATS MODEL
// =====================================================
// Model để quản lý thống kê học tập hàng ngày của user
// Bao gồm: lessons completed, activities, study time, streak
// =====================================================

const db = require('../../connect-mysql');

class UserDailyStats {

  /**
   * 📈 Lấy hoặc tạo stats cho user trong ngày cụ thể
   * @param {number} userId - ID của user
   * @param {string} date - Ngày (YYYY-MM-DD format)
   * @returns {Object} Daily stats object
   */
  static async getDailyStats(userId, date) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user_daily_stats WHERE user_id = ? AND date = ?',
        [userId, date]
      );

      if (rows.length > 0) {
        return rows[0];
      }

      // Tạo record mới nếu chưa có
      await db.execute(
        `INSERT INTO user_daily_stats (user_id, date, lessons_completed, activities_count, study_minutes, streak_count) 
         VALUES (?, ?, 0, 0, 0, 0)`,
        [userId, date]
      );

      return {
        user_id: userId,
        date: date,
        lessons_completed: 0,
        activities_count: 0,
        study_minutes: 0,
        streak_count: 0,
        last_activity_time: null
      };
    } catch (error) {
      console.error('Error getting daily stats:', error);
      throw error;
    }
  }

  /**
   * 🔄 Cập nhật daily stats
   * @param {number} userId - ID của user
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @param {Object} updates - Object chứa các field cần update
   */
  static async updateDailyStats(userId, date, updates) {
    try {
      // Đảm bảo record tồn tại
      await this.getDailyStats(userId, date);

      const setClause = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          setClause.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (setClause.length === 0) return;

      values.push(userId, date);
      const sql = `UPDATE user_daily_stats SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date = ?`;
      
      await db.execute(sql, values);
    } catch (error) {
      console.error('Error updating daily stats:', error);
      throw error;
    }
  }

  /**
   * ⚡ Increment một field cụ thể
   * @param {number} userId - ID của user
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @param {string} field - Field cần increment (lessons_completed, activities_count, study_minutes)
   * @param {number} amount - Số lượng cần tăng (default: 1)
   */
  static async incrementField(userId, date, field, amount = 1) {
    try {
      // Đảm bảo record tồn tại
      await this.getDailyStats(userId, date);

      const sql = `UPDATE user_daily_stats 
                   SET ${field} = ${field} + ?, 
                       last_activity_time = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP 
                   WHERE user_id = ? AND date = ?`;
      
      await db.execute(sql, [amount, userId, date]);
    } catch (error) {
      console.error(`Error incrementing ${field}:`, error);
      throw error;
    }
  }

  /**
   * 🔥 Tính streak days (số ngày học liên tiếp)
   * @param {number} userId - ID của user
   * @param {string} currentDate - Ngày hiện tại (YYYY-MM-DD)
   * @returns {number} Số ngày streak
   */
  static async calculateStreakDays(userId, currentDate) {
    try {
      const sql = `
        SELECT date, lessons_completed, activities_count 
        FROM user_daily_stats 
        WHERE user_id = ? AND date <= ? 
        ORDER BY date DESC 
        LIMIT 365
      `;
      
      const [rows] = await db.execute(sql, [userId, currentDate]);
      
      if (rows.length === 0) return 0;

      let streakCount = 0;
      let currentDateObj = new Date(currentDate);

      for (const row of rows) {
        const rowDateObj = new Date(row.date);
        const diffTime = currentDateObj.getTime() - rowDateObj.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Nếu không phải ngày liên tiếp, break
        if (diffDays !== streakCount) {
          break;
        }

        // Kiểm tra có hoạt động học tập không (ít nhất 1 lesson hoặc 1 activity)
        if (row.lessons_completed > 0 || row.activities_count > 0) {
          streakCount++;
        } else {
          break;
        }
      }

      return streakCount;
    } catch (error) {
      console.error('Error calculating streak days:', error);
      return 0;
    }
  }

}

module.exports = UserDailyStats;

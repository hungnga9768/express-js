const pool = require("../../connect-mysql");

module.exports = {
  // Lấy danh sách tất cả games
  async getAllGames(filters = {}) {
    try {
      let sqlQuery = `
        SELECT * FROM games
        WHERE 1=1
      `;
      
      const params = [];
      
      // Lọc theo trạng thái
      if (filters.is_active !== undefined) {
        sqlQuery += ` AND is_active = ?`;
        params.push(filters.is_active);
      } else {
        sqlQuery += ` AND is_active = TRUE`;
      }
      
      // Tìm kiếm theo tên
      if (filters.search) {
        sqlQuery += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      // Lọc theo loại game
      if (filters.gameType) {
        sqlQuery += ` AND game_type = ?`;
        params.push(filters.gameType);
      }
      
      // Lọc theo độ khó
      if (filters.difficulty) {
        sqlQuery += ` AND difficulty_level = ?`;
        params.push(filters.difficulty);
      }
      
      sqlQuery += ` ORDER BY name ASC`;
      
      const [rows] = await pool.query(sqlQuery, params);
      return rows;
    } catch (error) {
      console.error("Error getting games:", error);
      throw error;
    }
  },

  // Lấy thông tin game theo ID
  async getGameById(gameId) {
    try {
      const sqlQuery = `
        SELECT * FROM games
        WHERE game_id = ? AND is_active = TRUE
      `;
      
      const [rows] = await pool.query(sqlQuery, [gameId]);
      return rows[0];
    } catch (error) {
      console.error("Error getting game by ID:", error);
      throw error;
    }
  },

  // Tạo game mới
  async createGame(gameData) {
    try {
      const { name, description, game_type, difficulty_level, thumbnail_url, is_active, created_at } = gameData;
      
      const sqlQuery = `
        INSERT INTO games (name, description, game_type, difficulty_level, thumbnail_url, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.query(sqlQuery, [
        name, description, game_type, difficulty_level, thumbnail_url, is_active, created_at
      ]);
      return result.insertId;
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  },

  // Cập nhật game
  async updateGame(gameId, gameData) {
    try {
      const { name, description, game_type, difficulty_level, thumbnail_url, is_active, updated_at } = gameData;
      
      let sqlQuery = `
        UPDATE games 
        SET name = ?, description = ?, game_type = ?, difficulty_level = ?, is_active = ?
      `;
      
      const params = [name, description, game_type, difficulty_level, is_active];
      
      if (thumbnail_url) {
        sqlQuery = sqlQuery.replace('is_active = ?', 'thumbnail_url = ?, is_active = ?');
        params.splice(-1, 0, thumbnail_url);
      }
      
      sqlQuery += ' WHERE game_id = ?';
      params.push(gameId);
      
      await pool.query(sqlQuery, params);
    } catch (error) {
      console.error("Error updating game:", error);
      throw error;
    }
  },

  // Xóa game
  async deleteGame(gameId) {
    try {
      // Xóa các dữ liệu liên quan trước
      await pool.query('DELETE FROM gamesessions WHERE game_id = ?', [gameId]);
      await pool.query('DELETE FROM gameleaderboard WHERE game_id = ?', [gameId]);
      await pool.query('DELETE FROM usergameprogress WHERE game_id = ?', [gameId]);
      
      // Xóa game
      await pool.query('DELETE FROM games WHERE game_id = ?', [gameId]);
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  },

  // Lấy dữ liệu game (phân biệt theo loại game)
  async getGameData(gameId, filters = {}) {
    try {
      // Game 3 (Sentence Builder) - lấy từ bảng Grammar
      if (gameId === "3") {
        let sqlQuery = `
          SELECT g.* FROM grammar g
          INNER JOIN gamegrammar gg ON g.grammar_id = gg.grammar_id
          WHERE gg.game_id = ?
        `;
        
        const params = [gameId];
        
        // Filter theo HSK level
        if (filters.hsk_level) {
          sqlQuery += ` AND g.hsk_level = ?`;
          params.push(filters.hsk_level);
        }
        
        // Filter theo limit
        if (filters.limit) {
          sqlQuery += ` ORDER BY RAND() LIMIT ?`;
          params.push(filters.limit);
        } else {
          sqlQuery += ` ORDER BY RAND() LIMIT 20`;
        }
        
        const [rows] = await pool.query(sqlQuery, params);
        return rows;
      }
      
      // Game 1 & 2 (Flashcard, Pinyin) - lấy từ bảng Vocabulary
      else {
        let sqlQuery = `
          SELECT v.* FROM vocabulary v
          INNER JOIN gamevocabulary gv ON v.word_id = gv.word_id
          WHERE gv.game_id = ?
        `;
        
        const params = [gameId];
        
        // Filter theo HSK level
        if (filters.hsk_level) {
          sqlQuery += ` AND v.hsk_level = ?`;
          params.push(filters.hsk_level);
        }
        
        // Filter theo limit
        if (filters.limit) {
          sqlQuery += ` ORDER BY RAND() LIMIT ?`;
          params.push(filters.limit);
        } else {
          sqlQuery += ` ORDER BY RAND() LIMIT 20`;
        }
        
        const [rows] = await pool.query(sqlQuery, params);
        return rows;
      }
    } catch (error) {
      console.error("Error getting game data:", error);
      throw error;
    }
  },

  // Lấy dữ liệu game theo ID
  async getGameDataById(dataId) {
    try {
      const sqlQuery = `
        SELECT * FROM hskquestions
        WHERE question_id = ?
      `;
      
      const [rows] = await pool.query(sqlQuery, [dataId]);
      return rows[0];
    } catch (error) {
      console.error("Error getting game data by ID:", error);
      throw error;
    }
  },

  // Tạo dữ liệu game mới (sử dụng bảng HSKQuestions)
  async createGameData(gameData) {
    try {
      const { game_id, question, answer, options, explanation, image_url, created_at } = gameData;
      
      const sqlQuery = `
        INSERT INTO hskquestions (test_id, question_text, correct_answer, options, explanation, image_url, question_type, points, order_in_test)
        VALUES (?, ?, ?, ?, ?, ?, 'multiple_choice', 1, 0)
      `;
      
      const [result] = await pool.query(sqlQuery, [
        game_id, question, answer, options, explanation, image_url
      ]);
      return result.insertId;
    } catch (error) {
      console.error("Error creating game data:", error);
      throw error;
    }
  },

  // Cập nhật dữ liệu game
  async updateGameData(dataId, gameData) {
    try {
      const { question, answer, options, explanation, image_url, updated_at } = gameData;
      
      let sqlQuery = `
        UPDATE hskquestions 
        SET question_text = ?, correct_answer = ?, options = ?, explanation = ?
      `;
      
      const params = [question, answer, options, explanation];
      
      if (image_url) {
        sqlQuery = sqlQuery.replace('explanation = ?', 'explanation = ?, image_url = ?');
        params.splice(-1, 0, image_url);
      }
      
      sqlQuery += ' WHERE question_id = ?';
      params.push(dataId);
      
      await pool.query(sqlQuery, params);
    } catch (error) {
      console.error("Error updating game data:", error);
      throw error;
    }
  },

  // Xóa dữ liệu game
  async deleteGameData(dataId) {
    try {
      await pool.query('DELETE FROM hskquestions WHERE question_id = ?', [dataId]);
    } catch (error) {
      console.error("Error deleting game data:", error);
      throw error;
    }
  },

  // ==================== GAME SESSIONS ====================
  
  // Tạo session mới
  async createSession(sessionData) {
    try {
      const { game_id, user_id, score, duration_seconds } = sessionData;
      
      const sqlQuery = `
        INSERT INTO gamesessions (game_id, user_id, score, duration_seconds, start_time)
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      const [result] = await pool.query(sqlQuery, [game_id, user_id, score, duration_seconds]);
      return result.insertId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  // Cập nhật session
  async updateSession(sessionId, sessionData) {
    try {
      const { score, duration_seconds, end_time } = sessionData;
      
      const sqlQuery = `
        UPDATE gamesessions 
        SET score = ?, duration_seconds = ?, end_time = ?
        WHERE session_id = ?
      `;
      
      await pool.query(sqlQuery, [score, duration_seconds, end_time, sessionId]);
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  },

  // Lấy game_id từ session
  async getGameIdFromSession(sessionId) {
    try {
      const sqlQuery = `
        SELECT game_id FROM gamesessions
        WHERE session_id = ?
      `;
      
      const [rows] = await pool.query(sqlQuery, [sessionId]);
      return rows[0]?.game_id;
    } catch (error) {
      console.error("Error getting game ID from session:", error);
      throw error;
    }
  },

  // ==================== LEADERBOARD ====================
  
  // Cập nhật leaderboard
  async updateLeaderboard(gameId, userId, score) {
    try {
      const sqlQuery = `
        INSERT INTO gameleaderboard (game_id, user_id, score, date_achieved)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        score = GREATEST(score, VALUES(score)),
        date_achieved = NOW()
      `;
      
      await pool.query(sqlQuery, [gameId, userId, score]);
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      throw error;
    }
  },

  // Lấy leaderboard
  async getLeaderboard(gameId, limit = 10) {
    try {
      const sqlQuery = `
        SELECT gl.*, u.username, u.full_name, u.profile_picture
        FROM gameleaderboard gl
        JOIN users u ON gl.user_id = u.user_id
        WHERE gl.game_id = ?
        ORDER BY gl.score DESC, gl.date_achieved ASC
        LIMIT ?
      `;
      
      const [rows] = await pool.query(sqlQuery, [gameId, limit]);
      return rows;
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  },

  // Lấy rank của user
  async getUserRank(gameId, userId) {
    try {
      const sqlQuery = `
        SELECT COUNT(*) + 1 as user_rank
        FROM gameleaderboard
        WHERE game_id = ? AND score > (
          SELECT MAX(score) FROM gameleaderboard 
          WHERE game_id = ? AND user_id = ?
        )
      `;
      
      const [rows] = await pool.query(sqlQuery, [gameId, gameId, userId]);
      return rows[0]?.user_rank || 0;
    } catch (error) {
      console.error("Error getting user rank:", error);
      throw error;
    }
  },

  // ==================== USER PROGRESS ====================
  
  // Lấy tiến độ user
  async getUserProgress(userId) {
    try {
      const sqlQuery = `
        SELECT ugp.*, g.name as game_name, g.thumbnail_url
        FROM usergameprogress ugp
        JOIN games g ON ugp.game_id = g.game_id
        WHERE ugp.user_id = ?
        ORDER BY ugp.last_played DESC
      `;
      
      const [rows] = await pool.query(sqlQuery, [userId]);
      return rows;
    } catch (error) {
      console.error("Error getting user progress:", error);
      throw error;
    }
  },

  // Cập nhật tiến độ user
  async updateUserProgress(userId, gameId, progressData) {
    try {
      const { level, current_xp, unlocked_rewards } = progressData;
      
      const sqlQuery = `
        INSERT INTO usergameprogress (user_id, game_id, level, current_xp, unlocked_rewards, last_played)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        level = VALUES(level),
        current_xp = VALUES(current_xp),
        unlocked_rewards = VALUES(unlocked_rewards),
        last_played = NOW()
      `;
      
      await pool.query(sqlQuery, [userId, gameId, level, current_xp, JSON.stringify(unlocked_rewards)]);
    } catch (error) {
      console.error("Error updating user progress:", error);
      throw error;
    }
  },

  // Lấy thống kê game của user
  async getUserGameStats(userId) {
    try {
      const sqlQuery = `
        SELECT 
          COUNT(DISTINCT gs.game_id) as games_played,
          SUM(gs.score) as total_score,
          AVG(gs.score) as average_score,
          MAX(gs.score) as best_score,
          SUM(gs.duration_seconds) as total_time,
          COUNT(gs.session_id) as total_sessions
        FROM gamesessions gs
        WHERE gs.user_id = ?
      `;
      
      const [rows] = await pool.query(sqlQuery, [userId]);
      return rows[0];
    } catch (error) {
      console.error("Error getting user game stats:", error);
      throw error;
    }
  },

  // ==================== ACHIEVEMENTS & BADGES ====================
  
  // Lấy badges của user
  async getUserBadges(userId) {
    try {
      const sqlQuery = `        SELECT a.*, ua.unlocked_at
        FROM userachievements ua
        JOIN achievements a ON ua.achievement_id = a.achievement_id
        WHERE ua.user_id = ?
        ORDER BY ua.unlocked_at DESC
      `;
      
      const [rows] = await pool.query(sqlQuery, [userId]);
      return rows;
    } catch (error) {
      console.error("Error getting user badges:", error);
      throw error;
    }
  },

  // Lấy tất cả achievements
  async getAllAchievements() {
    try {
      const sqlQuery = `
        SELECT * FROM achievements
        ORDER BY achievement_id ASC
      `;
      
      const [rows] = await pool.query(sqlQuery);
      return rows;
    } catch (error) {
      console.error("Error getting achievements:", error);
      throw error;
    }
  },

  // Lấy rewards của game
  async getGameRewards(gameId) {
    try {
      const sqlQuery = `
        SELECT * FROM gamerewards
        WHERE game_id = ?
        ORDER BY reward_id ASC
      `;
      
      const [rows] = await pool.query(sqlQuery, [gameId]);
      return rows;
    } catch (error) {
      console.error("Error getting game rewards:", error);
      throw error;
    }
  },

  // ==================== STATISTICS ====================
  
  // Lấy thống kê tổng quan
  async getGlobalStats() {
    try {
      const sqlQuery = `
        SELECT 
          COUNT(DISTINCT gs.user_id) as total_players,
          COUNT(gs.session_id) as total_sessions,
          AVG(gs.score) as average_score,
          SUM(gs.duration_seconds) as total_playtime
        FROM gamesessions gs
      `;
      
      const [rows] = await pool.query(sqlQuery);
      return rows[0];
    } catch (error) {
      console.error("Error getting global stats:", error);
      throw error;
    }
  }
};


const GameModel = require('../../models/game');
module.exports = {
  // ==================== GAME LISTING ====================
  
  // Lấy danh sách tất cả games
  async getAllGames(req, res) {
    try {
      const games = await GameModel.getAllGames();
      
      res.json({
        success: true,
        data: games,
        message: 'Lấy danh sách game thành công'
      });
    } catch (error) {
      console.error('Error getting games:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách game'
      });
    }
  },

  // Lấy thông tin game theo ID
  async getGameById(req, res) {
    try {
      const { id } = req.params;
      const game = await GameModel.getGameById(id);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy game'
        });
      }

      // Lấy dữ liệu game
      const gameData = await GameModel.getGameData(id);
      const rewards = await GameModel.getGameRewards(id);
      
      res.json({
        success: true,
        data: {
          ...game,
          gameData: gameData,
          rewards: rewards
        },
        message: 'Lấy thông tin game thành công'
      });
    } catch (error) {
      console.error('Error getting game:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin game'
      });
    }
  },

  // Lấy games theo loại
  async getGamesByType(req, res) {
    try {
      const { type } = req.params;
      const games = await GameModel.getGamesByType(type);
      
      res.json({
        success: true,
        data: games,
        message: 'Lấy danh sách game theo loại thành công'
      });
    } catch (error) {
      console.error('Error getting games by type:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách game'
      });
    }
  },

  // ==================== GAME SESSIONS ====================
  
  // Bắt đầu session game mới
  async startGameSession(req, res) {
    try {
      const { game_id } = req.params;
      const user_id = req.user.user_id;
      
      // Kiểm tra game có tồn tại không
      const game = await GameModel.getGameById(game_id);
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy game'
        });
      }

      // Tạo session mới
      const sessionData = {
        game_id,
        user_id,
        score: 0,
        duration_seconds: 0
      };

      const sessionId = await GameModel.createSession(sessionData);
      
      res.json({
        success: true,
        data: {
          session_id: sessionId,
          game: game
        },
        message: 'Bắt đầu game thành công'
      });
    } catch (error) {
      console.error('Error starting game session:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi bắt đầu game'
      });
    }
  },

  // Kết thúc session game
  async endGameSession(req, res) {
    try {
      const { session_id } = req.params;
      const { score, duration_seconds } = req.body;
      const user_id = req.user.user_id;
      
      // Cập nhật session
      await GameModel.updateSession(session_id, {
        score,
        duration_seconds,
        end_time: new Date()
      });

      // Cập nhật leaderboard
      const game_id = await GameModel.getGameIdFromSession(session_id);
      await GameModel.updateLeaderboard(game_id, user_id, score);

      // Cập nhật tiến độ user
      await GameModel.updateUserProgress(user_id, game_id, {
        level: Math.floor(score / 100) + 1,
        current_xp: score,
        unlocked_rewards: []
      });

      res.json({
        success: true,
        message: 'Kết thúc game thành công'
      });
    } catch (error) {
      console.error('Error ending game session:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi kết thúc game'
      });
    }
  },

  // ==================== LEADERBOARD ====================
  
  // Lấy leaderboard của game
  async getLeaderboard(req, res) {
    try {
      const { game_id } = req.params;
      const { limit = 10 } = req.query;
      
      const leaderboard = await GameModel.getLeaderboard(game_id, parseInt(limit));
      
      res.json({
        success: true,
        data: leaderboard,
        message: 'Lấy leaderboard thành công'
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy leaderboard'
      });
    }
  },

  // Lấy rank của user trong game
  async getUserRank(req, res) {
    try {
      const { game_id } = req.params;
      const user_id = req.user.user_id;
      
      const rank = await GameModel.getUserRank(game_id, user_id);
      
      res.json({
        success: true,
        data: { rank },
        message: 'Lấy rank thành công'
      });
    } catch (error) {
      console.error('Error getting user rank:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy rank'
      });
    }
  },

  // ==================== USER PROGRESS ====================
  
  // Lấy tiến độ game của user
  async getUserProgress(req, res) {
    try {
      const user_id = req.user.user_id;
      const progress = await GameModel.getUserProgress(user_id);
      
      res.json({
        success: true,
        data: progress,
        message: 'Lấy tiến độ game thành công'
      });
    } catch (error) {
      console.error('Error getting user progress:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy tiến độ game'
      });
    }
  },

  // Lấy thống kê game của user
  async getUserGameStats(req, res) {
    try {
      const user_id = req.user.user_id;
      const stats = await GameModel.getUserGameStats(user_id);
      
      res.json({
        success: true,
        data: stats,
        message: 'Lấy thống kê game thành công'
      });
    } catch (error) {
      console.error('Error getting user game stats:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thống kê game'
      });
    }
  },

  // ==================== ACHIEVEMENTS & BADGES ====================
  
  // Lấy badges của user
  async getUserBadges(req, res) {
    try {
      const user_id = req.user.user_id;
      const badges = await GameModel.getUserBadges(user_id);
      
      res.json({
        success: true,
        data: badges,
        message: 'Lấy badges thành công'
      });
    } catch (error) {
      console.error('Error getting user badges:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy badges'
      });
    }
  },

  // Lấy danh sách tất cả achievements
  async getAllAchievements(req, res) {
    try {
      const achievements = await GameModel.getAllAchievements();
      
      res.json({
        success: true,
        data: achievements,
        message: 'Lấy danh sách achievements thành công'
      });
    } catch (error) {
      console.error('Error getting achievements:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy achievements'
      });
    }
  },

  // ==================== GAME DATA ====================
  
  // Lấy dữ liệu game cho gameplay
  async getGameData(req, res) {
    try {
      const { game_id } = req.params;
      const { limit = 10 } = req.query;
      
      const gameData = await GameModel.getGameData(game_id);
      
      // Giới hạn số lượng câu hỏi
      const limitedData = gameData.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: limitedData,
        message: 'Lấy dữ liệu game thành công'
      });
    } catch (error) {
      console.error('Error getting game data:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy dữ liệu game'
      });
    }
  },

  // ==================== SEARCH & FILTER ====================
  
  // Tìm kiếm game
  async searchGames(req, res) {
    try {
      const { q, type, difficulty } = req.query;
      
      let games = await GameModel.getAllGames();
      
      // Lọc theo từ khóa
      if (q) {
        games = games.filter(game => 
          game.name.toLowerCase().includes(q.toLowerCase()) ||
          game.description.toLowerCase().includes(q.toLowerCase())
        );
      }
      
      // Lọc theo loại
      if (type) {
        games = games.filter(game => game.game_type === type);
      }
      
      // Lọc theo độ khó
      if (difficulty) {
        games = games.filter(game => game.difficulty === difficulty);
      }
      
      res.json({
        success: true,
        data: games,
        message: 'Tìm kiếm game thành công'
      });
    } catch (error) {
      console.error('Error searching games:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm game'
      });
    }
  },

  // ==================== RECOMMENDATIONS ====================
  
  // Lấy game đề xuất cho user
  async getRecommendedGames(req, res) {
    try {
      const user_id = req.user.user_id;
      const { limit = 5 } = req.query;
      
      // Lấy games mà user chưa chơi hoặc chơi ít
      const userProgress = await GameModel.getUserProgress(user_id);
      const allGames = await GameModel.getAllGames();
      
      const playedGameIds = userProgress.map(p => p.game_id);
      const recommendedGames = allGames
        .filter(game => !playedGameIds.includes(game.game_id))
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: recommendedGames,
        message: 'Lấy game đề xuất thành công'
      });
    } catch (error) {
      console.error('Error getting recommended games:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy game đề xuất'
      });
    }
  },

  // ==================== STATISTICS ====================
  
  // Lấy thống kê tổng quan
  async getGlobalStats(req, res) {
    try {
      const stats = await GameModel.getGlobalStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Lấy thống kê tổng quan thành công'
      });
    } catch (error) {
      console.error('Error getting global stats:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thống kê'
      });
    }
  }
};

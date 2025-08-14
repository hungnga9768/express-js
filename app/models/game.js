const db = require("../../connect-mysql");

module.exports = {

  





  







  







  
  // Lấy danh sách tất cả games
  async getAllGames() {
    try {
      const query = `
        SELECT * FROM Games
        WHERE is_active = TRUE
        ORDER BY name ASC
      `;
      
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error("Error getting games:", error);
      throw error;
    }
  },

  // Lấy thông tin game theo ID
  async getGameById(gameId) {
    try {
      const query = `
        SELECT * FROM Games
        WHERE game_id = ? AND is_active = TRUE
      `;
      
      const [rows] = await db.execute(query, [gameId]);
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
      
      const query = `
        INSERT INTO Games (name, description, game_type, difficulty_level, thumbnail_url, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
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
      
      let query = `
        UPDATE Games 
        SET name = ?, description = ?, game_type = ?, difficulty_level = ?, is_active = ?
      `;
      
      const params = [name, description, game_type, difficulty_level, is_active];
      
      if (thumbnail_url) {
        query = query.replace('is_active = ?', 'thumbnail_url = ?, is_active = ?');
        params.splice(-1, 0, thumbnail_url);
      }
      
      query += ' WHERE game_id = ?';
      params.push(gameId);
      
      await db.execute(query, params);
    } catch (error) {
      console.error("Error updating game:", error);
      throw error;
    }
  },

  // Xóa game
  async deleteGame(gameId) {
    try {
      // Xóa các dữ liệu liên quan trước
      await db.execute('DELETE FROM GameSessions WHERE game_id = ?', [gameId]);
      await db.execute('DELETE FROM GameLeaderboard WHERE game_id = ?', [gameId]);
      await db.execute('DELETE FROM UserGameProgress WHERE game_id = ?', [gameId]);
      
      // Xóa game
      await db.execute('DELETE FROM Games WHERE game_id = ?', [gameId]);
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  },




  
  // Lấy dữ liệu game (sử dụng bảng HSKQuestions thay vì GameData)
  async getGameData(gameId) {
    try {
      const query = `
        SELECT * FROM HSKQuestions
        WHERE test_id = ?
        ORDER BY order_in_test ASC
      `;
      
      const [rows] = await db.execute(query, [gameId]);
      return rows;
    } catch (error) {
      console.error("Error getting game data:", error);
      throw error;
    }
  },

  // Lấy dữ liệu game theo ID
  async getGameDataById(dataId) {
    try {
      const query = `
        SELECT * FROM HSKQuestions
        WHERE question_id = ?
      `;
      
      const [rows] = await db.execute(query, [dataId]);
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
      
      const query = `
        INSERT INTO HSKQuestions (test_id, question_text, correct_answer, options, explanation, image_url, question_type, points, order_in_test)
        VALUES (?, ?, ?, ?, ?, ?, 'multiple_choice', 1, 0)
      `;
      
      const [result] = await db.execute(query, [
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
      
      let query = `
        UPDATE HSKQuestions 
        SET question_text = ?, correct_answer = ?, options = ?, explanation = ?
      `;
      
      const params = [question, answer, options, explanation];
      
      if (image_url) {
        query = query.replace('explanation = ?', 'explanation = ?, image_url = ?');
        params.splice(-1, 0, image_url);
      }
      
      query += ' WHERE question_id = ?';
      params.push(dataId);
      
      await db.execute(query, params);
    } catch (error) {
      console.error("Error updating game data:", error);
      throw error;
    }
  },

  // Xóa dữ liệu game
  async deleteGameData(dataId) {
    try {
      await db.execute('DELETE FROM HSKQuestions WHERE question_id = ?', [dataId]);
    } catch (error) {
      console.error("Error deleting game data:", error);
      throw error;
    }
  },




};

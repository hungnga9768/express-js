const GameModel = require('../../models/game');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/images/games';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'game-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif)'));
    }
  }
});

module.exports = {
  // ==================== GAME MANAGEMENT ====================
  
  // Hiển thị trang quản lý game
  async index(req, res) {
    try {
      const games = await GameModel.getAllGames();
      res.render('ds-games', { 
        title: 'Quản lý Game',
        games: games,
        user: req.user
      });
    } catch (error) {
      console.error('Error loading games:', error);
      res.redirect('/admin/dashboard');
    }
  },

  // Hiển thị form thêm game
  async createForm(req, res) {
    try {
      res.render('add-game', {
        title: 'Thêm Game Mới',
        user: req.user
      });
    } catch (error) {
      console.error('Error loading create form:', error);
      
      res.redirect('/admin/games');
    }
  },

  // Tạo game mới
  async create(req, res) {
    try {
      const { name, description, game_type, difficulty, is_active } = req.body;
      
      // Xử lý upload ảnh
      let thumbnail_url = null;
      if (req.file) {
        thumbnail_url = `/images/games/${req.file.filename}`;
      }

      const gameData = {
        name,
        description,
        game_type,
        difficulty_level: difficulty,
        thumbnail_url,
        is_active: is_active === 'on' ? 1 : 0,
        created_at: new Date()
      };

      const gameId = await GameModel.createGame(gameData);
      
      
      res.redirect(`/admin/games/edit-game/${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      
      res.redirect('/admin/games/add-game');
    }
  },

  // Hiển thị form chỉnh sửa game
  async editForm(req, res) {
    try {
      const { id } = req.params;
      const game = await GameModel.getGameById(id);
      
      if (!game) {
        return res.redirect('/admin/games');
      }

      res.render('edit-game', {
        title: 'Chỉnh sửa Game',
        game: game,
        user: req.user
      });
    } catch (error) {
      console.error('Error loading edit form:', error);
      
      res.redirect('/admin/games');
    }
  },

  // Cập nhật game
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, game_type, difficulty, is_active } = req.body;
      
      // Xử lý upload ảnh mới
      let thumbnail_url = null;
      if (req.file) {
        thumbnail_url = `/images/games/${req.file.filename}`;
        
        // Xóa ảnh cũ nếu có
        const oldGame = await GameModel.getGameById(id);
        if (oldGame && oldGame.thumbnail_url) {
          const oldImagePath = path.join('public', oldGame.thumbnail_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }

      const gameData = {
        name,
        description,
        game_type,
        difficulty_level: difficulty,
        is_active: is_active === 'on' ? 1 : 0,
        updated_at: new Date()
      };

      if (thumbnail_url) {
        gameData.thumbnail_url = thumbnail_url;
      }

      await GameModel.updateGame(id, gameData);
      
      
      res.redirect(`/admin/games/edit-game/${id}`);
    } catch (error) {
      console.error('Error updating game:', error);
      
      res.redirect(`/admin/games/edit-game/${req.params.id}`);
    }
  },

  // Xóa game
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Xóa ảnh thumbnail nếu có
      const game = await GameModel.getGameById(id);
      if (game && game.thumbnail_url) {
        const imagePath = path.join('public', game.thumbnail_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await GameModel.deleteGame(id);
      
      
      res.redirect('/admin/games');
    } catch (error) {
      console.error('Error deleting game:', error);
      
      res.redirect('/admin/games');
    }
  },





  // Upload middleware
  upload: upload
};

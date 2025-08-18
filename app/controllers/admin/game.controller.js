const GameModel = require('../../models/game');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../../services/cloudinaryService');
const cloudinaryHelper = require('../../utils/cloudinaryHelper');

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
      const { search, gameType, difficulty } = req.query;
      
      const filters = {};
      if (search) filters.search = search;
      if (gameType) filters.gameType = gameType;
      if (difficulty) filters.difficulty = difficulty;
      
      const games = await GameModel.getAllGames(filters);
      
      res.render('ds-games', { 
        title: 'Quản lý Game',
        games: games,
        user: req.user,
        search: search,
        gameType: gameType,
        difficulty: difficulty
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
        // Upload lên Cloudinary - CHỈ LƯU TRÊN CLOUDINARY
        const result = await cloudinaryService.uploadImage(req.file.path, 'game-thumbnails');
        if (result.success) {
          // Lưu public_id thay vì URL đầy đủ để dễ xóa file cũ
          thumbnail_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
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
      
      // Lấy thông tin game cũ để xóa file
      const oldGame = await GameModel.getGameById(id);
      
      // Xử lý upload ảnh mới
      let thumbnail_url = null;
      const { selected_image } = req.body;
      
      if (req.file) {
        // Upload lên Cloudinary - CHỈ LƯU TRÊN CLOUDINARY
        const result = await cloudinaryService.uploadImage(req.file.path, 'game-thumbnails');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có
          if (oldGame && oldGame.thumbnail_url) {
            try {
              // Sử dụng helper để trích xuất public_id
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldGame.thumbnail_url);
              
              const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
              if (!deleteResult.success) {
                console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
              }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa file cũ:', deleteError);
            }
          }
          // Lưu public_id thay vì URL đầy đủ để dễ xóa file cũ
          thumbnail_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (oldGame && oldGame.thumbnail_url && oldGame.thumbnail_url !== selected_image && selected_image) {
          try {
            // Sử dụng helper để trích xuất public_id
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldGame.thumbnail_url);
            
            const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
            if (!deleteResult.success) {
              console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
            }
          } catch (deleteError) {
            console.error('❌ Exception khi xóa file cũ:', deleteError);
          }
        }
        thumbnail_url = selected_image;
      } else {
        // Giữ nguyên file cũ
        thumbnail_url = oldGame.thumbnail_url;
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
        // Xóa file trên Cloudinary nếu có
        if (game.thumbnail_url) {
          try {
            // Sử dụng helper để trích xuất public_id
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const publicId = cloudinaryHelper.extractPublicId(game.thumbnail_url);
            
            console.log('🔍 Thông tin xóa file khi delete:');
            console.log('   Thumbnail:', game.thumbnail_url);
            console.log('   Public ID để xóa:', publicId);
            
            const deleteResult = await cloudinaryService.deleteFile(publicId);
            if (deleteResult.success) {
              console.log('✅ Đã xóa file trên Cloudinary:', publicId);
              console.log('   Kết quả:', deleteResult.result);
            } else {
              console.error('❌ Lỗi khi xóa file trên Cloudinary:', deleteResult.error);
            }
          } catch (deleteError) {
            console.error('❌ Exception khi xóa file trên Cloudinary:', deleteError);
          }
        } else {
          console.log('ℹ️  Không có thumbnail để xóa');
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

const express = require('express');
const router = express.Router();
const gameController = require('../../app/controllers/admin/game.controller');
const  authenticateToken  = require('../../middlewares/authenticateToken');

// Áp dụng middleware xác thực cho tất cả routes
router.use(authenticateToken);

// Routes quản lý game
router.get('/', gameController.index);
router.get('/add-game', gameController.createForm);
router.post('/add-game', gameController.upload.single('thumbnail'), gameController.create);
router.get('/edit-game/:id', gameController.editForm);
router.post('/edit-game/:id', gameController.upload.single('thumbnail'), gameController.update);
router.post('/delete/:id', gameController.delete);

module.exports = router;

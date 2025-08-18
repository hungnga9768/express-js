const express = require('express');
const router = express.Router();
const cloudinaryController = require('../../app/controllers/admin/cloudinary.controller');
const authenticateToken = require('../../middlewares/authenticateToken');

// Tất cả routes đều yêu cầu xác thực
router.use(authenticateToken);

// Lấy danh sách ảnh từ Cloudinary
router.post('/images', cloudinaryController.getImages);

// Lấy thông tin ảnh cụ thể
router.get('/images/:publicId', cloudinaryController.getImageInfo);

// Xóa ảnh từ Cloudinary
router.delete('/images/:publicId', cloudinaryController.deleteImage);

module.exports = router;

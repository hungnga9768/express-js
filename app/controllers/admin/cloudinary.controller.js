const cloudinaryService = require('../../services/cloudinaryService');

module.exports = {
  // Lấy danh sách ảnh từ Cloudinary
  async getImages(req, res) {
    try {
      const { folder = '', search = '', page = 1 } = req.body;
      
      // Lấy ảnh từ Cloudinary
      const result = await cloudinaryService.getImageList(folder, 20);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
      // Lọc ảnh theo search term nếu có
      let filteredImages = result.images;
      if (search) {
        filteredImages = result.images.filter(image => 
          image.public_id.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Phân trang
      const itemsPerPage = 20;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedImages = filteredImages.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        images: paginatedImages,
        total: filteredImages.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredImages.length / itemsPerPage)
      });
      
    } catch (error) {
      console.error('Lỗi khi lấy ảnh từ Cloudinary:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server khi lấy ảnh từ Cloudinary'
      });
    }
  },

  // Lấy thông tin ảnh cụ thể
  async getImageInfo(req, res) {
    try {
      const { publicId } = req.params;
      
      // Lấy thông tin ảnh từ Cloudinary
      const result = await cloudinaryService.getImageInfo(publicId);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error
        });
      }
      
      res.json({
        success: true,
        image: result.image
      });
      
    } catch (error) {
      console.error('Lỗi khi lấy thông tin ảnh:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server khi lấy thông tin ảnh'
      });
    }
  },

  // Xóa ảnh từ Cloudinary
  async deleteImage(req, res) {
    try {
      const { publicId } = req.params;
      
      // Xóa ảnh từ Cloudinary
      const result = await cloudinaryService.deleteFile(publicId);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
      res.json({
        success: true,
        message: 'Đã xóa ảnh thành công'
      });
      
    } catch (error) {
      console.error('Lỗi khi xóa ảnh:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server khi xóa ảnh'
      });
    }
  }
};

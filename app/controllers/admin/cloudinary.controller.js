const cloudinaryService = require('../../services/cloudinaryService');

module.exports = {
  // Test route để kiểm tra Cloudinary service
  async test(req, res) {
    try {
      console.log('Testing Cloudinary service...');
      
      // Kiểm tra cấu hình Cloudinary
      const cloudinary = require('../../../config/cloudinary');
      console.log('Cloudinary config:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dviufwqfi',
        api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'NOT_SET',
        api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'NOT_SET'
      });
      
      res.json({
        success: true,
        message: 'Cloudinary service is working',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dviufwqfi',
          api_key_set: !!process.env.CLOUDINARY_API_KEY,
          api_secret_set: !!process.env.CLOUDINARY_API_SECRET
        }
      });
      
    } catch (error) {
      console.error('Lỗi khi test Cloudinary:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server khi test Cloudinary: ' + error.message
      });
    }
  },

  // Lấy danh sách ảnh từ Cloudinary
  async getImages(req, res) {
    try {
      console.log('getImages được gọi với body:', req.body);
      
      const { folder = '', search = '', page = 1 } = req.body;
      
      // Kiểm tra xem có biến môi trường Cloudinary không
      if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.log('Không có biến môi trường Cloudinary, trả về mock data');
        
        // Trả về mock data để test modal
        const mockImages = [
          {
            public_id: 'sample1',
            url: 'https://res.cloudinary.com/dviufwqfi/image/upload/v1234567890/sample1.jpg',
            width: 800,
            height: 600,
            format: 'jpg',
            created_at: new Date().toISOString()
          },
          {
            public_id: 'sample2', 
            url: 'https://res.cloudinary.com/dviufwqfi/image/upload/v1234567891/sample2.png',
            width: 1024,
            height: 768,
            format: 'png',
            created_at: new Date().toISOString()
          },
          {
            public_id: 'sample3',
            url: 'https://res.cloudinary.com/dviufwqfi/image/upload/v1234567892/sample3.jpg',
            width: 640,
            height: 480,
            format: 'jpg',
            created_at: new Date().toISOString()
          }
        ];
        
        return res.json({
          success: true,
          images: mockImages,
          total: mockImages.length,
          page: parseInt(page),
          totalPages: 1,
          message: 'Mock data - Cần cấu hình Cloudinary API keys'
        });
      }
      
      // Lấy ảnh từ Cloudinary
      const result = await cloudinaryService.getImageList(folder, 20);
      
      console.log('Kết quả từ cloudinaryService:', result);
      
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
        error: 'Lỗi server khi lấy ảnh từ Cloudinary: ' + error.message
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

const cloudinary = require('../../config/cloudinary');
const fs = require('fs');
const path = require('path');

class CloudinaryService {
  /**
   * Upload ảnh lên Cloudinary
   * @param {string} filePath - Đường dẫn file ảnh
   * @param {string} folder - Thư mục lưu trữ trên Cloudinary
   * @returns {Promise<Object>} - Kết quả upload
   */
  async uploadImage(filePath, folder = 'hsk-questions') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' }, // Tối ưu chất lượng
          { fetch_format: 'auto' }  // Tự động chọn format tốt nhất
        ]
      });
      
      // Xóa file tạm sau khi upload
      this.deleteTempFile(filePath);
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload audio lên Cloudinary
   * @param {string} filePath - Đường dẫn file audio
   * @param {string} folder - Thư mục lưu trữ trên Cloudinary
   * @returns {Promise<Object>} - Kết quả upload
   */
  async uploadAudio(filePath, folder = 'hsk-audio') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'video', // Cloudinary xử lý audio như video
        format: 'mp3',
        transformation: [
          { quality: 'auto:good' }
        ]
      });
      
      // Xóa file tạm sau khi upload
      this.deleteTempFile(filePath);
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        duration: result.duration
      };
    } catch (error) {
      console.error('Lỗi upload audio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload cả ảnh và audio
   * @param {Object} files - Object chứa file ảnh và audio
   * @returns {Promise<Object>} - Kết quả upload
   */
  async uploadMedia(files) {

    
    const results = {};
    
    if (files.image && files.image[0]) {
      
      results.image = await this.uploadImage(files.image[0].path);
    } else {
      
    }
    
    if (files.audio && files.audio[0]) {
      
      results.audio = await this.uploadAudio(files.audio[0].path);
    } else {
      
    }
    

    return results;
  }

  /**
   * Xóa file trên Cloudinary
   * @param {string} publicId - Public ID của file trên Cloudinary
   * @param {string} resourceType - Loại resource (image, video)
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      
      return {
        success: true,
        result: result
      };
    } catch (error) {
      console.error('Lỗi xóa file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xóa file tạm
   * @param {string} filePath - Đường dẫn file cần xóa
   */
  deleteTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
  
      }
    } catch (error) {
      console.error('Lỗi xóa file tạm:', error);
    }
  }

  /**
   * Lấy URL ảnh với transformation
   * @param {string} publicId - Public ID của ảnh
   * @param {Object} options - Tùy chọn transformation
   * @returns {string} - URL ảnh đã được transform
   */
  getImageUrl(publicId, options = {}) {
    const defaultOptions = {
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto:good'
    };
    
    const transformOptions = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, transformOptions);
  }

  /**
   * Lấy URL audio với transformation
   * @param {string} publicId - Public ID của audio
   * @param {Object} options - Tùy chọn transformation
   * @returns {string} - URL audio đã được transform
   */
  getAudioUrl(publicId, options = {}) {
    const defaultOptions = {
      quality: 'auto:good',
      format: 'mp3'
    };
    
    const transformOptions = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, { resource_type: 'video', ...transformOptions });
  }

  /**
   * Lấy danh sách ảnh từ Cloudinary
   * @param {string} folder - Thư mục cần lấy ảnh
   * @param {number} maxResults - Số lượng ảnh tối đa
   * @returns {Promise<Object>} - Kết quả lấy danh sách ảnh
   */
  async getImageList(folder = '', maxResults = 50) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: maxResults,
        resource_type: 'image'
      });
      
      return {
        success: true,
        images: result.resources.map(resource => ({
          public_id: resource.public_id,
          url: resource.secure_url,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          created_at: resource.created_at
        }))
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ảnh từ Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy danh sách ảnh theo folder cụ thể
   * @param {string} folder - Thư mục cần lấy ảnh
   * @param {number} maxResults - Số lượng ảnh tối đa
   * @returns {Promise<Object>} - Kết quả lấy danh sách ảnh
   */
  async getImagesByFolder(folder, maxResults = 50) {
    return this.getImageList(folder, maxResults);
  }

  /**
   * Lấy thông tin ảnh cụ thể
   * @param {string} publicId - Public ID của ảnh
   * @returns {Promise<Object>} - Kết quả lấy thông tin ảnh
   */
  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId, { resource_type: 'image' });
      
      return {
        success: true,
        image: {
          public_id: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          created_at: result.created_at,
          bytes: result.bytes
        }
      };
    } catch (error) {
      console.error('Lỗi khi lấy thông tin ảnh từ Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CloudinaryService();

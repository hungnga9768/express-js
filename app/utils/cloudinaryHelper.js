/**
 * Helper functions cho Cloudinary
 */

/**
 * Tạo URL Cloudinary từ public_id
 * @param {string} publicId - Public ID của file trên Cloudinary
 * @param {string} resourceType - Loại resource (image, video)
 * @param {string} version - Version của file (optional)
 * @returns {string} - URL đầy đủ
 */
function getCloudinaryUrl(publicId, resourceType = 'image', version = null) {
  if (!publicId) return null;
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dviufwqfi';
  const baseUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload`;
  
  if (version) {
    return `${baseUrl}/v${version}/${publicId}`;
  }
  
  return `${baseUrl}/${publicId}`;
}

/**
 * Tạo URL ảnh Cloudinary từ public_id
 * @param {string} publicId - Public ID của ảnh
 * @param {string} version - Version của file (optional)
 * @returns {string} - URL ảnh
 */
function getImageUrl(publicId, version = null) {
  return getCloudinaryUrl(publicId, 'image', version);
}

/**
 * Tạo URL audio/video Cloudinary từ public_id
 * @param {string} publicId - Public ID của audio/video
 * @param {string} version - Version của file (optional)
 * @returns {string} - URL audio/video
 */
function getVideoUrl(publicId, version = null) {
  return getCloudinaryUrl(publicId, 'video', version);
}

/**
 * Kiểm tra xem một URL có phải là Cloudinary URL không
 * @param {string} url - URL cần kiểm tra
 * @returns {boolean} - true nếu là Cloudinary URL
 */
function isCloudinaryUrl(url) {
  return url && url.includes('cloudinary.com');
}

/**
 * Trích xuất public_id từ Cloudinary URL hoặc public_id
 * @param {string} url - Cloudinary URL hoặc public_id
 * @returns {string} - Public ID
 */
function extractPublicId(url) {
  if (!url) return null;
  
  // Nếu đã là public_id (không chứa cloudinary.com)
  if (!isCloudinaryUrl(url)) {
    return url;
  }
  
  // Nếu là URL Cloudinary, trích xuất public_id
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
      // Lấy tất cả phần sau 'upload'
      const publicIdParts = urlParts.slice(uploadIndex + 1);
      
      // Loại bỏ version nếu có (phần bắt đầu bằng 'v' và số)
      let startIndex = 0;
      if (publicIdParts[0] && publicIdParts[0].match(/^v\d+$/)) {
        startIndex = 1;
      }
      
      // Lấy public_id thực sự (không bao gồm version)
      const actualPublicIdParts = publicIdParts.slice(startIndex);
      
      if (actualPublicIdParts.length > 0) {
        // Loại bỏ extension nếu có
        const lastPart = actualPublicIdParts[actualPublicIdParts.length - 1];
        if (lastPart.includes('.')) {
          const extensionIndex = lastPart.lastIndexOf('.');
          const withoutExtension = lastPart.substring(0, extensionIndex);
          actualPublicIdParts[actualPublicIdParts.length - 1] = withoutExtension;
        }
        
        return actualPublicIdParts.join('/');
      }
    }
    
    // Fallback: lấy filename cuối cùng
    const filename = urlParts[urlParts.length - 1];
    return filename.split('.')[0];
  } catch (error) {
    console.error('Lỗi khi trích xuất public_id:', error);
    return url; // Trả về nguyên bản nếu có lỗi
  }
}

module.exports = {
  getCloudinaryUrl,
  getImageUrl,
  getVideoUrl,
  isCloudinaryUrl,
  extractPublicId
};

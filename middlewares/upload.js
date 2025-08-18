const multer = require('multer');
const path = require('path');

// Cấu hình Multer để xử lý file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/'); // Lưu tạm vào thư mục uploads/temp
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file types
const fileFilter = (req, file, cb) => {
  // Cho phép upload ảnh cho tất cả các field name
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Cho phép upload audio
  else if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  }
  // Cho phép upload file khác
  else {
    cb(null, true);
  }
};

// Cấu hình Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  }
});

// Middleware upload ảnh (linh hoạt - chấp nhận bất kỳ field name nào)
const uploadImage = upload.single('image');

// Middleware upload ảnh cho banner (field name: image_url)
const uploadBannerImage = upload.single('image_url');

// Middleware upload ảnh cho chatbot (field name: avatar_url)
const uploadChatbotAvatar = upload.single('avatar_url');

// Middleware upload audio
const uploadAudio = upload.single('audio');

// Middleware upload cả ảnh và audio
const uploadMedia = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// Middleware upload ảnh linh hoạt - chấp nhận bất kỳ field name nào
const uploadImageFlexible = (fieldName = 'image') => {
  return upload.single(fieldName);
};

// Middleware upload ảnh cho các module khác
const uploadThumbnail = upload.single('thumbnail_url');
const uploadAvatar = upload.single('avatar');
const uploadProfilePicture = upload.single('profilePicture');

// Middleware upload ảnh cho các field khác
const uploadImageField = (fieldName) => {
  return upload.single(fieldName);
};

module.exports = {
  uploadImage,
  uploadBannerImage,
  uploadChatbotAvatar,
  uploadAudio,
  uploadMedia,
  uploadImageFlexible,
  uploadThumbnail,
  uploadAvatar,
  uploadProfilePicture,
  uploadImageField
};

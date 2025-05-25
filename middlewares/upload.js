const multer = require("multer");
const path = require("path");

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images"); // Thư mục lưu trữ ảnh
  },
  filename: function (req, file, cb) {
    const originalName = path.parse(file.originalname).name; // tên không có đuôi
    const ext = path.extname(file.originalname); // .jpg, .png,...
    const uniqueSuffix = Date.now();
    cb(null, originalName + "-" + uniqueSuffix + ext);
  },
});

// Khởi tạo multer với cấu hình storage
const upload = multer({ storage: storage });
//  Export đúng
module.exports = upload;

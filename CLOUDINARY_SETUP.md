# Hướng dẫn cài đặt và sử dụng Cloudinary

## 1. Cài đặt Cloudinary

### Bước 1: Đăng ký tài khoản Cloudinary
- Truy cập: https://cloudinary.com/
- Đăng ký tài khoản miễn phí
- Sau khi đăng ký, bạn sẽ nhận được:
  - Cloud Name
  - API Key
  - API Secret

### Bước 2: Cài đặt package
```bash
npm install cloudinary multer
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` trong thư mục gốc của dự án:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 2. Cấu trúc file đã tạo

### `config/cloudinary.js`
- Cấu hình kết nối Cloudinary
- Sử dụng biến môi trường từ file .env

### `middlewares/upload.js`
- Middleware xử lý upload file với Multer
- Hỗ trợ upload ảnh và audio
- Giới hạn kích thước file: 10MB
- Lưu file tạm vào `uploads/temp/`

### `app/services/cloudinaryService.js`
- Service xử lý upload và quản lý file trên Cloudinary
- Hỗ trợ upload ảnh và audio
- Tự động xóa file tạm sau khi upload
- Hỗ trợ transformation và optimization

## 3. Cách sử dụng

### Upload ảnh:
```javascript
const result = await cloudinaryService.uploadImage(filePath, 'hsk-questions');
if (result.success) {
  console.log('URL ảnh:', result.url);
}
```

### Upload audio:
```javascript
const result = await cloudinaryService.uploadAudio(filePath, 'hsk-audio');
if (result.success) {
  console.log('URL audio:', result.url);
}
```

### Upload cả ảnh và audio:
```javascript
const results = await cloudinaryService.uploadMedia(req.files);
// results.image.url - URL ảnh
// results.audio.url - URL audio
```

## 4. Tính năng đã tích hợp

### Form thêm câu hỏi HSK:
- ✅ Upload file ảnh (JPG, PNG, GIF)
- ✅ Upload file audio (MP3, WAV, M4A)
- ✅ Vẫn giữ URL cũ để tương thích
- ✅ Hiển thị tên file đã chọn
- ✅ Tự động upload lên Cloudinary
- ✅ Lưu URL vào database

### Xử lý file:
- ✅ Validation file type
- ✅ Giới hạn kích thước file
- ✅ Tự động xóa file tạm
- ✅ Tối ưu chất lượng ảnh
- ✅ Hỗ trợ transformation

## 5. Lưu ý quan trọng

### File .env:
- KHÔNG commit file .env vào git
- Chỉ commit file .env.example
- Bảo mật API key và secret

### Thư mục uploads:
- File được lưu tạm trong `uploads/temp/`
- Tự động xóa sau khi upload lên Cloudinary
- Không cần backup thư mục này

### Cloudinary:
- Tài khoản miễn phí có giới hạn:
  - 25 credits/tháng
  - 25GB storage
  - 25GB bandwidth
- Nên monitor usage để tránh vượt quá giới hạn

## 6. Troubleshooting

### Lỗi "CLOUDINARY_CLOUD_NAME is not defined":
- Kiểm tra file .env có tồn tại không
- Kiểm tra tên biến môi trường có đúng không
- Restart server sau khi thay đổi .env

### Lỗi upload file:
- Kiểm tra kích thước file (tối đa 10MB)
- Kiểm tra định dạng file được hỗ trợ
- Kiểm tra quyền ghi thư mục uploads/temp

### Lỗi Cloudinary API:
- Kiểm tra API key và secret có đúng không
- Kiểm tra Cloud name có đúng không
- Kiểm tra tài khoản Cloudinary có bị suspend không

## 7. Nâng cao

### Custom transformation:
```javascript
// Resize ảnh
const imageUrl = cloudinaryService.getImageUrl(publicId, {
  width: 400,
  height: 300,
  crop: 'fill'
});

// Tối ưu audio
const audioUrl = cloudinaryService.getAudioUrl(publicId, {
  quality: 'auto:low',
  format: 'mp3'
});
```

### Xóa file:
```javascript
// Xóa ảnh
await cloudinaryService.deleteFile(publicId, 'image');

// Xóa audio
await cloudinaryService.deleteFile(publicId, 'video');
```

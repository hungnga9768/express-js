# 🧪 TEST IMAGE UPLOAD CHO SEO SETTINGS

## 📋 **CÁC TRƯỜNG IMAGE CẦN TEST:**

### **1. Logo & Favicon (Đã hoạt động):**
- ✅ `logo` - Logo website
- ✅ `favicon` - Favicon website

### **2. SEO Images (Cần test):**
- 🔄 `seo_image` - Hình ảnh cho social sharing
- 🔄 `vocabulary_image` - Hình ảnh trang từ vựng
- 🔄 `courses_image` - Hình ảnh trang khóa học
- 🔄 `hsk-tests_image` - Hình ảnh trang HSK tests
- 🔄 `games_image` - Hình ảnh trang games

---

## 🔧 **CODE ĐÃ SỬA:**

### **Trong `app/controllers/admin/setting.controller.js`:**

```javascript
// Trường hợp là ảnh (logo, favicon, hoặc các SEO images)
const imageKeys = [
  "logo", 
  "favicon", 
  "seo_image",
  "vocabulary_image", 
  "courses_image", 
  "hsk-tests_image", 
  "games_image"
];

if (imageKeys.includes(key)) {
  console.log('🔧 Processing image upload for key:', key);
  if (req.file) {
    console.log('🔧 Uploading file:', req.file.path);
    const result = await cloudinaryService.uploadImage(req.file.path, 'settings-images');
    console.log('🔧 Upload result:', result);
    if (result.success) {
      value = result.public_id;
      console.log('🔧 Setting value to public_id:', value);
      
      // Xóa file cũ trên Cloudinary nếu có
      if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
        try {
          const oldPublicId = old_thumbnail_url.split('/').pop().split('.')[0];
          await cloudinaryService.deleteFile(oldPublicId);
          console.log('Đã xóa file cũ trên Cloudinary:', oldPublicId);
        } catch (deleteError) {
          console.error('Lỗi khi xóa file cũ:', deleteError);
        }
      }
    } else {
      console.error('Lỗi upload lên Cloudinary:', result.error);
      throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
    }
  } else if (selected_image && selected_image.trim() !== '') {
    // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
    if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
      try {
        const oldPublicId = old_thumbnail_url.split('/').pop().split('.')[0];
        await cloudinaryService.deleteFile(oldPublicId);
        console.log('Đã xóa file cũ trên Cloudinary:', oldPublicId);
      } catch (deleteError) {
        console.error('Lỗi khi xóa file cũ:', deleteError);
      }
    }
    value = selected_image;
  } else if (old_thumbnail_url) {
    // Nếu không có file upload và không có selected_image, giữ nguyên ảnh cũ
    value = old_thumbnail_url;
  }
} else {
  // Trường hợp là input hoặc textarea khác
  console.log('🔧 Processing non-image field:', key);
  value = req.body.value;
  console.log('🔧 Setting value to:', value);
}
```

---

## 🧪 **CÁCH TEST:**

### **1. Test Upload File Mới:**
1. Vào admin panel: `/admin/setting`
2. Chọn một trường SEO image (ví dụ: `courses_image`)
3. Upload file ảnh mới
4. Kiểm tra console log để xem:
   - `🔧 Is image key? true for key: courses_image`
   - `🔧 Processing image upload for key: courses_image`
   - `🔧 Uploading file: /path/to/file`
   - `🔧 Upload result: { success: true, public_id: "..." }`
   - `🔧 Setting value to public_id: settings-images/abc123`

### **2. Test Chọn Ảnh Từ Cloudinary:**
1. Chọn ảnh từ thư viện Cloudinary
2. Kiểm tra console log để xem:
   - `🔧 Processing image upload for key: courses_image`
   - `🔧 Setting value to public_id: settings-images/xyz789`

### **3. Test Trường Không Phải Ảnh:**
1. Chỉnh sửa title hoặc description
2. Kiểm tra console log để xem:
   - `🔧 Is image key? false for key: courses_title`
   - `🔧 Processing non-image field: courses_title`
   - `🔧 Setting value to: Khóa học tiếng Trung - Làng Hán Ngữ`

---

## 🔍 **DEBUG LOGS CẦN QUAN SÁT:**

### **Khi Upload Thành Công:**
```
🔧 Settings update request: {
  id: '62',
  key: 'courses_image',
  selected_image: 'null',
  old_thumbnail_url: 'https://yourdomain.com/images/courses-og.jpg',
  hasFile: true
}
🔧 Is image key? true for key: courses_image
🔧 Processing image upload for key: courses_image
🔧 Uploading file: /path/to/temp/file.jpg
🔧 Upload result: { success: true, public_id: "settings-images/abc123", url: "..." }
🔧 Setting value to public_id: settings-images/abc123
🔧 Final dataUpdate: { key: 'courses_image', value: 'settings-images/abc123' }
🔧 Settings updated successfully
```

### **Khi Chọn Ảnh Từ Cloudinary:**
```
🔧 Settings update request: {
  id: '62',
  key: 'courses_image',
  selected_image: 'settings-images/xyz789',
  old_thumbnail_url: 'https://yourdomain.com/images/courses-og.jpg',
  hasFile: false
}
🔧 Is image key? true for key: courses_image
🔧 Processing image upload for key: courses_image
🔧 Setting value to public_id: settings-images/xyz789
🔧 Final dataUpdate: { key: 'courses_image', value: 'settings-images/xyz789' }
🔧 Settings updated successfully
```

---

## ⚠️ **CÁC VẤN ĐỀ CÓ THỂ GẶP:**

### **1. Key Không Được Nhận Diện:**
- **Nguyên nhân:** Key không có trong `imageKeys` array
- **Giải pháp:** Kiểm tra tên key trong database và thêm vào array

### **2. File Upload Thất Bại:**
- **Nguyên nhân:** Lỗi Cloudinary hoặc file không hợp lệ
- **Giải pháp:** Kiểm tra console log để xem error message

### **3. Database Không Cập Nhật:**
- **Nguyên nhân:** Lỗi trong `Settings.update()`
- **Giải pháp:** Kiểm tra model Settings và database connection

---

## 🎯 **KẾT QUẢ MONG ĐỢI:**

Sau khi sửa code, tất cả các trường SEO image sẽ hoạt động giống như logo và favicon:

- ✅ **Upload file mới** → Lưu public_id vào database
- ✅ **Chọn ảnh từ Cloudinary** → Lưu public_id vào database  
- ✅ **Xóa file cũ** → Tự động cleanup trên Cloudinary
- ✅ **Error handling** → Xử lý lỗi gracefully

**Bây giờ hãy test lại để xem có hoạt động không!** 🚀

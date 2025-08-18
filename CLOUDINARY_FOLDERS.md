# 📁 TỔNG HỢP FOLDER CLOUDINARY

## 🎯 **Cấu trúc folder hiện tại:**

### **👥 User Management:**
- `user-avatars` - Avatar người dùng (Admin)
- `api-user-avatars` - Avatar người dùng (API)
- `admin-avatars` - Avatar admin

### **📚 Content Management:**
- `khoahoc-thumbnails` - Thumbnail khóa học (Admin)
- `api-khoahoc-thumbnails` - Thumbnail khóa học (API)
- `tailieu-thumbnails` - Thumbnail tài liệu
- `game-thumbnails` - Thumbnail game

### **🤖 System Management:**
- `chatbot-avatars` - Avatar chatbot
- `settings-images` - Ảnh banner/settings

### **📝 HSK System:**
- `hsk-questions` - Ảnh câu hỏi HSK (default)
- `hsk-audio` - Audio câu hỏi HSK

### **📚 Learning Content:**
- `vocabulary-audio` - Audio từ vựng

## 🔍 **Kiểm tra từng controller:**

### **✅ Đã có folder riêng:**
1. **Admin Controllers:**
   - `user.controllers.js` → `user-avatars`
   - `khoahoc.controllers.js` → `khoahoc-thumbnails`
   - `tailieu.controller.js` → `tailieu-thumbnails`
   - `game.controller.js` → `game-thumbnails`
   - `chatbot.controller.js` → `chatbot-avatars`
   - `setting.controller.js` → `settings-images`
   - `admins.controller.js` → `admin-avatars`

2. **API Controllers:**
   - `user.controllers.js` → `api-user-avatars`
   - `khoahoc.controllers.js` → `api-khoahoc-thumbnails`

3. **HSK Controller:**
   - `hsk.controller.js` → `hsk-questions` (ảnh) + `hsk-audio` (audio)

4. **Vocabulary Controller:**
   - `vocabulary.controller.js` → `vocabulary-audio` (audio)

## 🎵 **Audio Upload:**

### **✅ Đã có:**
- **HSK Questions**: Upload audio cho câu hỏi nghe
- **Vocabulary**: Upload audio cho từ vựng

### **❓ Cần kiểm tra thêm:**
- **Game Audio**: Có cần audio cho game không?
- **Course Audio**: Có cần audio cho khóa học không?
- **Document Audio**: Có cần audio cho tài liệu không?

## 📊 **Thống kê:**
- **Tổng số folder**: 12 folders
- **Controllers đã cập nhật**: 10 controllers
- **Loại file**: Ảnh + Audio
- **Tổ chức**: Theo module và loại file

## 🎯 **Kết luận:**
✅ **Tất cả controllers đã có folder riêng**
✅ **Cấu trúc folder rõ ràng, dễ quản lý**
✅ **Hỗ trợ cả ảnh và audio**

## 💡 **Gợi ý cải thiện:**
1. **Thêm audio cho game** (nếu cần)
2. **Thêm audio cho khóa học** (nếu cần)
3. **Thêm audio cho tài liệu** (nếu cần)

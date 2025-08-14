# Hệ thống Quản lý Game - Express.js

## Tổng quan
Hệ thống quản lý game được xây dựng trên nền tảng Express.js với MySQL, cung cấp giao diện admin để quản lý games và API cho frontend VueJS.

## Cấu trúc thư mục

### Views (Giao diện Admin)
```
views/
├── ds-games.ejs              # Danh sách games
├── add-game.ejs              # Form thêm game mới
├── edit-game.ejs             # Form chỉnh sửa game
├── game-statistics.ejs       # Thống kê game
├── header.ejs                # Header chung
├── footer.ejs                # Footer chung
└── aside.ejs                 # Sidebar navigation
```

### Controllers
```
app/controllers/
├── admin/
│   └── game.controller.js    # Controller quản lý game (Admin)
└── api/
    └── game.controller.js    # Controller API cho frontend
```

### Models
```
app/models/
└── game.js                   # Model xử lý database
```

### Routes
```
routes/
├── admin/
│   └── game.js               # Routes admin
└── api/
    └── game.js               # Routes API
```

## Tính năng chính

### 1. Quản lý Game (Admin)
- ✅ **Danh sách Game**: Hiển thị tất cả games với thông tin chi tiết
- ✅ **Thêm Game Mới**: Form tạo game với upload ảnh
- ✅ **Chỉnh sửa Game**: Cập nhật thông tin game
- ✅ **Xóa Game**: Xóa game và dữ liệu liên quan
- ✅ **Thống kê Game**: Biểu đồ và bảng thống kê chi tiết

### 2. API cho Frontend
- ✅ **Game Listing**: Lấy danh sách games
- ✅ **Game Sessions**: Bắt đầu/kết thúc session
- ✅ **Leaderboard**: Bảng xếp hạng
- ✅ **User Progress**: Tiến độ người chơi
- ✅ **Achievements**: Hệ thống thành tích
- ✅ **Statistics**: Thống kê tổng quan

### 3. Upload Ảnh
- ✅ **Multer Configuration**: Xử lý upload ảnh
- ✅ **Validation**: Kiểm tra định dạng và kích thước
- ✅ **Storage**: Lưu trong `public/images/games/`
- ✅ **Cleanup**: Tự động xóa ảnh cũ khi cập nhật

## Cấu trúc Database

### Bảng chính
- **Games**: Thông tin game
- **GameSessions**: Lịch sử chơi game
- **GameLeaderboard**: Bảng xếp hạng
- **GameData**: Dữ liệu game (câu hỏi, đáp án)
- **GameRewards**: Phần thưởng
- **UserGameProgress**: Tiến độ người chơi
- **UserAchievements**: Thành tích người chơi

## Routes

### Admin Routes
```
GET    /admin/games                    # Danh sách games
GET    /admin/games/add-game           # Form thêm game
POST   /admin/games/add-game           # Tạo game mới
GET    /admin/games/edit-game/:id      # Form chỉnh sửa
POST   /admin/games/edit-game/:id      # Cập nhật game
POST   /admin/games/delete-game/:id    # Xóa game
GET    /admin/games/:id/statistics     # Thống kê game
```

### API Routes
```
GET    /api/game                       # Danh sách games
GET    /api/game/:id                   # Chi tiết game
GET    /api/game/type/:type            # Games theo loại
POST   /api/game/:game_id/start        # Bắt đầu game
POST   /api/game/sessions/:id/end      # Kết thúc game
GET    /api/game/:game_id/leaderboard  # Leaderboard
GET    /api/game/user/progress         # Tiến độ user
GET    /api/game/user/stats            # Thống kê user
```

## Cấu trúc EJS

### Pattern chung
```ejs
<%- include('header')%> <%- include('aside')%>
<!-- Nội dung trang -->
<%- include('footer')%>
```

### Features
- ✅ **Responsive Design**: Bootstrap 4
- ✅ **AdminLTE Theme**: Giao diện admin chuyên nghiệp
- ✅ **Chart.js**: Biểu đồ thống kê
- ✅ **Form Validation**: Client-side validation
- ✅ **File Upload**: Custom file input
- ✅ **Flash Messages**: Thông báo thành công/lỗi

## Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình database
- Tạo database MySQL
- Import file SQL
- Cập nhật `connect-mysql.js`

### 3. Tạo thư mục upload
```bash
mkdir -p public/images/games
```

### 4. Chạy server
```bash
npm start
```

## Tính năng nổi bật

### 1. Quản lý Game
- Hỗ trợ nhiều loại game: Flashcard, Quiz, Matching, Typing, Picture Guess, Listening, Speaking
- 4 mức độ khó: Dễ, Trung bình, Khó, Chuyên gia
- Upload ảnh đại diện với validation
- Trạng thái kích hoạt/tạm dừng

### 2. Thống kê chi tiết
- Tổng số lượt chơi
- Người chơi duy nhất
- Điểm trung bình
- Tỷ lệ hoàn thành
- Biểu đồ theo thời gian
- Top 10 người chơi
- Lượt chơi gần đây

### 3. API hoàn chỉnh
- JWT Authentication
- RESTful design
- Error handling
- Response format chuẩn
- Documentation đầy đủ

## Cập nhật gần đây

### ✅ Hoàn thành
- Tái cấu trúc views theo pattern EJS hiện tại
- Sửa lỗi tên trường database (game_id, thumbnail_url)
- Cập nhật routes và redirects
- Tối ưu hóa controller logic
- Cải thiện giao diện admin
- Tạo thư mục upload ảnh

### 🔄 Đang phát triển
- Tích hợp với hệ thống user hiện tại
- Thêm tính năng quản lý phần thưởng
- Cải thiện performance
- Thêm unit tests

## Hướng dẫn sử dụng

### Admin
1. Truy cập `/admin/games` để xem danh sách
2. Click "Thêm Game Mới" để tạo game
3. Click "Sửa" để chỉnh sửa thông tin
4. Click "Thống kê" để xem báo cáo

### API
1. Xem `API_GUIDE.md` để biết chi tiết
2. Sử dụng JWT token cho authentication
3. Gọi API theo format RESTful

## Liên hệ
Hệ thống đã sẵn sàng để sử dụng! 🎮

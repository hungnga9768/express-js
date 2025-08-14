# Hệ Thống Game Học Tiếng Trung

## Tổng Quan

Hệ thống game học tiếng Trung bao gồm 5 game chính được thiết kế để giúp người học rèn luyện các kỹ năng khác nhau:

1. **Flashcard Master** - Ghi nhớ từ vựng qua phương pháp lặp lại ngắt quãng
2. **Pinyin Puzzle** - Ghép âm pinyin tương ứng với chữ Hán
3. **Sentence Builder** - Xây dựng câu hoàn chỉnh từ các từ đã học
4. **Listening Warrior** - Luyện kỹ năng nghe hiểu và nhận diện thanh điệu
5. **HSK Speed Run** - Ôn tập từ vựng HSK dưới áp lực thời gian

## Cài Đặt và Chạy

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Database
- Import file `game_data.sql` vào database MySQL
- Đảm bảo các bảng đã được tạo theo schema trong `file dulieu sql cuaweb.sql`

### 3. Chạy ứng dụng
```bash
npm start
```

### 4. Truy cập
- Trang chính game: `http://localhost:3000/game`
- API endpoints: `http://localhost:3000/api/game/*`

## Cấu Trúc Hệ Thống

### Backend

#### Controllers
- `app/controllers/api/game.controller.js` - API controller cho game
- `app/controllers/game.controller.js` - Controller render trang game

#### Models
- `app/models/game.js` - Model quản lý game sessions, leaderboard, rewards
- `app/models/vocabulary.js` - Model từ vựng (đã có sẵn, đã bổ sung methods)
- `app/models/grammar.js` - Model ngữ pháp (mới tạo)
- `app/models/pronunciationPractice.js` - Model luyện phát âm (mới tạo)
- `app/models/flashcard.js` - Model flashcard (đã có sẵn, đã bổ sung methods)

#### Routes
- `routes/api/game.js` - API routes cho game
- `routes/game.js` - Routes render trang game

### Frontend

#### Views
- `views/games.ejs` - Trang chính hiển thị danh sách game
- `views/game-flashcard-master.ejs` - Trang game Flashcard Master
- `views/game-pinyin-puzzle.ejs` - Trang game Pinyin Puzzle (cần tạo)
- `views/game-sentence-builder.ejs` - Trang game Sentence Builder (cần tạo)
- `views/game-listening-warrior.ejs` - Trang game Listening Warrior (cần tạo)
- `views/game-hsk-speed-run.ejs` - Trang game HSK Speed Run (cần tạo)

## API Endpoints

### Flashcard Master
```
GET /api/game/flashcard-master/data - Lấy dữ liệu flashcard
POST /api/game/flashcard-master/progress - Cập nhật tiến độ
```

### Pinyin Puzzle
```
GET /api/game/pinyin-puzzle/data - Lấy dữ liệu pinyin puzzle
POST /api/game/pinyin-puzzle/result - Lưu kết quả
```

### Sentence Builder
```
GET /api/game/sentence-builder/data - Lấy dữ liệu sentence builder
POST /api/game/sentence-builder/result - Lưu kết quả
```

### Listening Warrior
```
GET /api/game/listening-warrior/data - Lấy dữ liệu listening warrior
POST /api/game/listening-warrior/result - Lưu kết quả
```

### HSK Speed Run
```
GET /api/game/hsk-speed-run/data - Lấy dữ liệu HSK speed run
POST /api/game/hsk-speed-run/result - Lưu kết quả
```

### Leaderboard & Rewards
```
GET /api/game/leaderboard - Lấy bảng xếp hạng
GET /api/game/user-progress - Lấy tiến độ user
GET /api/game/user-badges - Lấy badges của user
```

## Database Schema

### Bảng chính
- `Games` - Thông tin các game
- `GameSessions` - Lịch sử chơi game
- `GameLeaderboard` - Bảng xếp hạng
- `UserGameProgress` - Tiến độ game của user
- `Achievements` - Các thành tích/badge
- `UserAchievements` - Badge của user
- `GameRewards` - Phần thưởng game
- `GameVocabulary` - Từ vựng sử dụng trong game
- `GameGrammar` - Ngữ pháp sử dụng trong game

### Bảng liên quan
- `Vocabulary` - Từ vựng tiếng Trung
- `Grammar` - Ngữ pháp tiếng Trung
- `PronunciationPractice` - Bài luyện phát âm
- `Flashcards` - Thẻ học từ vựng

## Tính Năng Chính

### 1. Flashcard Master
- Hiển thị thẻ mặt trước với chữ Hán
- Lật thẻ để xem pinyin và nghĩa
- Đánh giá độ khó (Dễ/Trung bình/Khó)
- Tích hợp audio phát âm
- Tính toán ngày ôn tập tiếp theo theo phương pháp Spaced Repetition

### 2. Pinyin Puzzle
- Hiển thị chữ Hán + 4 lựa chọn pinyin
- Kéo thả pinyin đúng vào chữ Hán
- Tích hợp audio phát âm
- Tính điểm theo độ chính xác

### 3. Sentence Builder
- Hiển thị các từ đảo lộn từ câu ví dụ
- Ghép thành câu hoàn chỉnh
- Kiểm tra tự động với câu đúng
- Tính điểm theo tốc độ và độ chính xác

### 4. Listening Warrior
- Phát audio từ vựng/câu
- Hiển thị 4 lựa chọn chữ Hán
- Phân tích thanh điệu
- Lưu kết quả phát âm

### 5. HSK Speed Run
- Hiển thị từng từ trong 5 giây
- Nhập nhanh pinyin
- Tính điểm theo tốc độ
- Xếp hạng theo điểm số

### Hệ Thống Phần Thưởng
- Badge cho các thành tích khác nhau
- XP (Experience Points) cho mỗi game
- Leaderboard xếp hạng
- Theo dõi tiến độ chi tiết

## Tùy Chỉnh và Mở Rộng

### Thêm Game Mới
1. Tạo controller methods trong `game.controller.js`
2. Thêm routes trong `routes/api/game.js`
3. Tạo view cho game mới
4. Thêm dữ liệu vào bảng `Games`

### Thêm Badge Mới
1. Thêm record vào bảng `Achievements`
2. Cập nhật logic trao badge trong controller
3. Thêm icon cho badge

### Tùy Chỉnh Giao Diện
- CSS styles trong các file `.ejs`
- Bootstrap classes cho responsive design
- FontAwesome icons cho UI

## Bảo Mật

- Tất cả API endpoints yêu cầu authentication
- Sử dụng JWT token cho xác thực
- Kiểm tra quyền truy cập dữ liệu user

## Performance

- Sử dụng database indexing cho các truy vấn thường xuyên
- Caching cho leaderboard và stats
- Lazy loading cho dữ liệu game

## Troubleshooting

### Lỗi thường gặp
1. **Database connection error**: Kiểm tra cấu hình MySQL
2. **Authentication error**: Kiểm tra JWT token
3. **Audio not playing**: Kiểm tra file audio URL
4. **Game data not loading**: Kiểm tra API endpoints

### Debug
- Kiểm tra console logs
- Sử dụng browser developer tools
- Kiểm tra network requests

## Đóng Góp

Để đóng góp vào dự án:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Tạo pull request

## License

Dự án này được phát triển cho mục đích giáo dục và học tập.

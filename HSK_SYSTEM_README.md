# Hệ thống Quản lý Đề thi HSK

## Tổng quan

Hệ thống quản lý đề thi HSK là một phần của ứng dụng học tiếng Trung, cho phép admin tạo, quản lý và tổ chức các đề thi HSK từ cấp độ 1-6.

## Tính năng chính

### 1. Quản lý Đề thi
- ✅ Tạo đề thi mới với các thông tin cơ bản
- ✅ Chỉnh sửa thông tin đề thi
- ✅ Xóa đề thi
- ✅ Bật/tắt tính năng trộn câu hỏi
- ✅ Tìm kiếm và lọc theo cấp độ HSK

### 2. Quản lý Câu hỏi
- ✅ Hỗ trợ nhiều loại câu hỏi khác nhau
- ✅ Upload audio và hình ảnh
- ✅ Sắp xếp thứ tự câu hỏi
- ✅ Quản lý độ khó và điểm số

### 3. Các loại câu hỏi được hỗ trợ

#### 🔘 Trắc nghiệm (Multiple Choice)
- 4 lựa chọn A, B, C, D
- Chọn một đáp án đúng
- Phù hợp cho tất cả kỹ năng

#### ⬜ Điền từ (Fill in the Blank)
- Tạo nhiều chỗ trống
- Mỗi chỗ trống có 4 lựa chọn
- Hỗ trợ cloze test

#### 🔗 Ghép nối (Matching)
- Tạo các cặp ghép nối
- Ví dụ: A-1, B-2, C-3
- Phù hợp cho từ vựng và ngữ pháp

#### ✅ Đúng/Sai (True/False)
- Câu hỏi đơn giản
- Chỉ có 2 lựa chọn
- Phù hợp cho kiểm tra kiến thức cơ bản

#### 📋 Sắp xếp (Ordering)
- Sắp xếp các mục theo thứ tự đúng
- Phù hợp cho câu, đoạn văn
- Hỗ trợ logic và ngữ pháp

#### ✏️ Viết lại câu (Rewrite)
- Hướng dẫn viết lại câu
- Kiểm tra kỹ năng viết
- Phù hợp cho HSK cao cấp

## Cách sử dụng

### 1. Dashboard HSK

1. Truy cập `/admin/hsk/dashboard` để xem tổng quan hệ thống HSK
2. Dashboard hiển thị:
   - **Thống kê tổng quan**: Số đề thi, câu hỏi, lượt thi
   - **Biểu đồ phân bố**: Theo cấp độ HSK và kỹ năng
   - **Đề thi gần đây**: Danh sách 5 đề thi mới nhất
   - **Thống kê theo thời gian**: Lượt thi trong 7 ngày gần đây

### 2. Tạo đề thi mới

1. Truy cập `/admin/hsk/add`
2. Điền thông tin cơ bản:
   - **HSK Level**: Chọn cấp độ (1-6)
   - **Tiêu đề**: Tên đề thi
   - **Mô tả**: Mô tả chi tiết
   - **Số câu hỏi**: Tổng số câu (có thể để 0)
   - **Thời gian**: Giới hạn thời gian làm bài (phút)
   - **Điểm đạt**: Điểm tối thiểu để đạt
   - **Trộn đề**: Bật/tắt xáo trộn câu hỏi

3. Nhấn "Tạo đề thi"

### 3. Thêm câu hỏi

1. Sau khi tạo đề thi, hệ thống chuyển đến trang quản lý câu hỏi
2. Chọn **Phần kỹ năng**:
   - 🎧 Nghe hiểu (Listening)
   - 📖 Đọc hiểu (Reading)
   - ✍️ Viết (Writing)

3. Chọn **Kiểu câu hỏi** phù hợp
4. Điền nội dung câu hỏi
5. Thêm **Audio URL** (nếu là câu hỏi nghe)
6. Thêm **Image URL** (nếu cần hình ảnh minh họa)
7. Cấu hình các tùy chọn theo loại câu hỏi
8. Nhấn "Thêm câu hỏi"

### 4. Quản lý câu hỏi

- **Xem danh sách**: Tất cả câu hỏi hiển thị theo thứ tự
- **Chỉnh sửa nhanh**: Sửa nội dung, đáp án, điểm, thứ tự
- **Xóa câu hỏi**: Xóa câu hỏi không cần thiết
- **Sắp xếp**: Thay đổi thứ tự hiển thị

## Cấu trúc cơ sở dữ liệu

### Bảng HSKTests
```sql
CREATE TABLE HSKTests (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    hsk_level INT NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    total_questions INT NOT NULL,
    time_limit INT,
    passing_score INT NOT NULL,
    randomize_questions TINYINT(1) NOT NULL DEFAULT 0
);
```

### Bảng HSKQuestions
```sql
CREATE TABLE HSKQuestions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    skill_type ENUM('listening', 'reading', 'writing') NOT NULL,
    question_type ENUM('multiple_choice', 'fill_blank', 'matching', 'true_false', 'ordering', 'rewrite') NOT NULL,
    question_text TEXT,
    audio_url VARCHAR(255),
    image_url VARCHAR(255),
    options JSON,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard'),
    points INT NOT NULL DEFAULT 1,
    order_in_test INT NOT NULL DEFAULT 0,
    matching_pairs JSON NULL,
    ordering_items JSON NULL,
    rewrite_instruction TEXT NULL
);
```

## Lưu ý quan trọng

### 1. Audio và Hình ảnh
- **Audio URL**: Hỗ trợ các định dạng phổ biến (MP3, WAV, OGG)
- **Image URL**: Hỗ trợ JPG, PNG, GIF
- Nên sử dụng CDN hoặc hosting ổn định

### 2. Độ khó câu hỏi
- **Dễ**: Phù hợp HSK 1-2
- **Trung bình**: Phù hợp HSK 3-4
- **Khó**: Phù hợp HSK 5-6

### 3. Điểm số
- Mỗi câu hỏi có thể có điểm từ 1-10
- Tổng điểm đề thi = tổng điểm các câu hỏi
- Điểm đạt nên là 60-70% tổng điểm

### 4. Thứ tự câu hỏi
- Sử dụng để sắp xếp logic
- Có thể để 0 để tự động sắp xếp
- Hỗ trợ kéo thả để sắp xếp

## API Endpoints

### Đề thi
- `GET /admin/hsk` - Danh sách đề thi
- `GET /admin/hsk/add` - Form tạo đề thi
- `POST /admin/hsk/create` - Tạo đề thi mới
- `GET /admin/hsk/edit/:id` - Form chỉnh sửa
- `POST /admin/hsk/update/:id` - Cập nhật đề thi
- `POST /admin/hsk/delete/:id` - Xóa đề thi

### Câu hỏi
- `GET /admin/hsk/:testId/questions` - Quản lý câu hỏi
- `POST /admin/hsk/:testId/questions` - Thêm câu hỏi
- `POST /admin/hsk/:testId/questions/:questionId/update` - Cập nhật câu hỏi
- `POST /admin/hsk/:testId/questions/:questionId/delete` - Xóa câu hỏi
- `POST /admin/hsk/:testId/questions/reorder` - Sắp xếp câu hỏi

## Tùy chỉnh và mở rộng

### 1. Thêm loại câu hỏi mới
1. Cập nhật enum `question_type` trong database
2. Thêm logic xử lý trong controller
3. Cập nhật form và JavaScript

### 2. Thêm kỹ năng mới
1. Cập nhật enum `skill_type` trong database
2. Thêm option trong form
3. Cập nhật logic xử lý

### 3. Tùy chỉnh giao diện
- Sử dụng Bootstrap 4 classes
- Hỗ trợ responsive design
- Có thể tùy chỉnh CSS tùy ý

## Hỗ trợ và liên hệ

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng:
1. Kiểm tra console log để xem lỗi
2. Kiểm tra database connection
3. Xác nhận quyền truy cập admin
4. Liên hệ developer để được hỗ trợ

---

**Phiên bản**: 1.0.0  
**Cập nhật cuối**: <%= new Date().toLocaleDateString('vi-VN') %>  
**Tác giả**: Hệ thống quản lý HSK

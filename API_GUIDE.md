# 📚 HƯỚNG DẪN SỬ DỤNG API KHÓA HỌC & BÀI HỌC

## 🔐 XÁC THỰC API

Tất cả API được bảo vệ yêu cầu token JWT trong header:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 🎓 API KHÓA HỌC (COURSES)

### **1. PUBLIC APIs (Không cần đăng nhập)**

#### **1.1. Lấy danh sách khóa học**
```http
GET /api/khoahoc
```

**Query Parameters:**
- `page` (optional): Trang hiện tại (mặc định: 1)
- `limit` (optional): Số lượng item mỗi trang (mặc định: 10)
- `difficulty` (optional): Độ khó (beginner, intermediate, advanced)
- `category` (optional): Danh mục khóa học

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "course_id": 1,
      "title": "HSK 1 Cơ bản",
      "description": "Khóa học tiếng Trung cơ bản",
      "thumbnail_url": "https://example.com/image.jpg",
      "difficulty_level": "beginner",
      "estimated_duration": 20,
      "is_free": true,
      "price": 0,
      "instructor_id": 1,
      "stats": {
        "enrollment_count": 150,
        "lesson_count": 10,
        "average_rating": 4.5
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  }
}
```

#### **1.2. Lấy chi tiết khóa học**
```http
GET /api/khoahoc/{courseId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "course_id": 1,
    "title": "HSK 1 Cơ bản",
    "description": "Khóa học tiếng Trung cơ bản",
    "thumbnail_url": "https://example.com/image.jpg",
    "difficulty_level": "beginner",
    "estimated_duration": 20,
    "is_free": true,
    "price": 0,
    "instructor": {
      "user_id": 1,
      "full_name": "Giảng viên A"
    },
    "stats": {
      "enrollment_count": 150,
      "lesson_count": 10,
      "average_rating": 4.5,
      "review_count": 25
    },
    "enrollment_status": {
      "is_enrolled": true,
      "enrollment_date": "2024-01-15T10:30:00Z",
      "completion_percentage": 25.5
    }
  }
}
```

**Lưu ý về `enrollment_status`:**
- `null` - User chưa đăng nhập
- `{"is_enrolled": false}` - User đã đăng nhập nhưng chưa đăng ký
- `{"is_enrolled": true, "enrollment_date": "...", "completion_percentage": 25.5}` - User đã đăng ký và có tiến độ học tập

#### **1.3. Lấy bài học của khóa học**
```http
GET /api/khoahoc/{courseId}/lessons
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "lesson_id": 1,
      "title": "Bài 1: Giới thiệu",
      "description": "Bài học đầu tiên",
      "content_type": "video",
      "duration": 30,
      "display_order": 1,
      "is_preview": true,
      "content_url": {
        "type": "youtube",
        "video_id": "abc123",
        "embed_url": "https://www.youtube.com/embed/abc123",
        "original_url": "https://youtube.com/watch?v=abc123"
      }
    }
  ]
}
```

#### **1.4. Tìm kiếm khóa học**
```http
GET /api/khoahoc/search?q=từ khóa&difficulty=beginner&page=1&limit=10
```

**Query Parameters:**
- `q`: Từ khóa tìm kiếm
- `difficulty` (optional): Độ khó
- `category` (optional): Danh mục
- `page` (optional): Trang
- `limit` (optional): Số lượng item

#### **1.5. Lấy khóa học theo danh mục**
```http
GET /api/khoahoc/category/{category}
```

---

### **2. PROTECTED APIs (Cần đăng nhập)**

#### **2.1. Đăng ký khóa học**
```http
POST /api/khoahoc/{courseId}/enroll
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký khóa học thành công",
  "data": {
    "enrollment_id": 1,
    "enrollment_date": "2024-01-15T10:30:00Z",
    "completion_percentage": 0
  }
}
```

#### **2.2. Lấy khóa học đã đăng ký**
```http
GET /api/khoahoc/enrolled?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "course_id": 1,
      "title": "HSK 1 Cơ bản",
      "thumbnail_url": "https://example.com/image.jpg",
      "enrollment_date": "2024-01-15T10:30:00Z",
      "completion_percentage": 25.5,
      "last_accessed": "2024-01-16T15:20:00Z"
    }
  ]
}
```

#### **2.3. Hủy đăng ký khóa học**
```http
DELETE /api/khoahoc/{courseId}/unenroll
```

**Response:**
```json
{
  "success": true,
  "message": "Hủy đăng ký khóa học thành công"
}
```

#### **2.4. Lấy tiến độ khóa học**
```http
GET /api/khoahoc/{courseId}/progress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "course_id": 1,
    "enrollment_date": "2024-01-15T10:30:00Z",
    "completion_percentage": 25.5,
    "total_lessons": 10,
    "completed_lessons": 2,
    "in_progress_lessons": 1,
    "not_started_lessons": 7,
    "last_accessed": "2024-01-16T15:20:00Z",
    "lessons_progress": [
      {
        "lesson_id": 1,
        "title": "Bài 1: Giới thiệu",
        "completion_status": "completed",
        "completion_date": "2024-01-15T12:00:00Z",
        "score": 85.5
      }
    ]
  }
}
```

#### **2.5. Đánh giá khóa học**
```http
POST /api/khoahoc/{courseId}/review
```

**Body:**
```json
{
  "rating": 5,
  "review_text": "Khóa học rất hay và bổ ích!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đánh giá khóa học thành công"
}
```

#### **2.6. Lấy đánh giá khóa học**
```http
GET /api/khoahoc/{courseId}/reviews?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "review_id": 1,
      "rating": 5,
      "review_text": "Khóa học rất hay và bổ ích!",
      "review_date": "2024-01-15T10:30:00Z",
      "helpful_count": 3,
      "user": {
        "user_id": 2,
        "full_name": "Nguyễn Văn A"
      }
    }
  ]
}
```

---

## 📖 API BÀI HỌC (LESSONS)

### **1. PUBLIC APIs (Không cần đăng nhập)**

#### **1.1. Lấy danh sách bài học**
```http
GET /api/baihoc
```

**Query Parameters:**
- `page` (optional): Trang hiện tại
- `limit` (optional): Số lượng item mỗi trang
- `course_id` (optional): Lọc theo khóa học

#### **1.2. Lấy chi tiết bài học**
```http
GET /api/baihoc/{lessonId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lesson_id": 1,
    "course_id": 1,
    "title": "Bài 1: Giới thiệu",
    "description": "Bài học đầu tiên",
    "content_type": "video",
    "duration": 30,
    "display_order": 1,
    "is_preview": true,
    "content_url": {
      "type": "youtube",
      "video_id": "abc123",
      "embed_url": "https://www.youtube.com/embed/abc123",
      "original_url": "https://youtube.com/watch?v=abc123"
    },
    "course": {
      "course_id": 1,
      "title": "HSK 1 Cơ bản"
    }
  }
}
```

#### **1.3. Lấy bài học theo khóa học**
```http
GET /api/baihoc/course/{courseId}
```

---

### **2. PROTECTED APIs (Cần đăng nhập)**

#### **2.1. Bắt đầu học bài học**
```http
POST /api/baihoc/{lessonId}/start
```

**Response:**
```json
{
  "success": true,
  "message": "Bắt đầu học bài học thành công",
  "data": {
    "progress_id": 1,
    "status": "in_progress",
    "started_at": "2024-01-15T10:30:00Z"
  }
}
```

#### **2.2. Hoàn thành bài học**
```http
POST /api/baihoc/{lessonId}/complete
```

**Body (optional):**
```json
{
  "score": 85.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hoàn thành bài học thành công",
  "data": {
    "completion_date": "2024-01-15T12:00:00Z",
    "score": 85.5,
    "next_lesson": {
      "lesson_id": 2,
      "title": "Bài 2: Phát âm cơ bản"
    }
  }
}
```

#### **2.3. Lấy tiến độ bài học**
```http
GET /api/baihoc/{lessonId}/progress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lesson_id": 1,
    "completion_status": "completed",
    "last_accessed": "2024-01-15T12:00:00Z",
    "completion_date": "2024-01-15T12:00:00Z",
    "score": 85.5,
    "time_spent": 1800
  }
}
```

---

## 📝 API GHI CHÚ BÀI HỌC (LESSON NOTES)

### **1. Thêm ghi chú bài học**
```http
POST /api/baihoc/{lessonId}/note
```

**Body:**
```json
{
  "note_text": "Ghi chú về từ vựng mới học được",
  "note_type": "vocabulary"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thêm ghi chú thành công",
  "data": {
    "note_id": 1,
    "note_text": "Ghi chú về từ vựng mới học được",
    "note_type": "vocabulary",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### **2. Lấy ghi chú bài học**
```http
GET /api/baihoc/{lessonId}/notes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "note_id": 1,
      "note_text": "Ghi chú về từ vựng mới học được",
      "note_type": "vocabulary",
      "is_public": false,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **3. Cập nhật ghi chú**
```http
PUT /api/baihoc/{lessonId}/notes/{noteId}
```

**Body:**
```json
{
  "note_text": "Ghi chú đã được cập nhật"
}
```

### **4. Xóa ghi chú**
```http
DELETE /api/baihoc/{lessonId}/notes/{noteId}
```

### **5. Lấy tất cả ghi chú của user**
```http
GET /api/baihoc/user/notes?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "note_id": 1,
      "note_text": "Ghi chú về từ vựng mới học được",
      "note_type": "vocabulary",
      "lesson_title": "Bài 1: Giới thiệu",
      "course_title": "HSK 1 Cơ bản",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **6. Tìm kiếm ghi chú**
```http
GET /api/baihoc/user/notes/search?q=từ vựng&page=1&limit=10
```

---

## 🔧 XỬ LÝ LỖI

### **Mã lỗi thường gặp:**

- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ
- **401 Unauthorized**: Chưa đăng nhập hoặc token không hợp lệ
- **403 Forbidden**: Không có quyền truy cập
- **404 Not Found**: Không tìm thấy tài nguyên
- **409 Conflict**: Xung đột dữ liệu (ví dụ: đã đăng ký khóa học)
- **500 Internal Server Error**: Lỗi server

### **Ví dụ response lỗi:**
```json
{
  "success": false,
  "message": "Không tìm thấy khóa học",
  "error_code": "COURSE_NOT_FOUND"
}
```

---

## 📱 VÍ DỤ SỬ DỤNG VỚI JAVASCRIPT

### **1. Đăng ký khóa học:**
```javascript
async function enrollCourse(courseId, token) {
  try {
    const response = await fetch(`/api/khoahoc/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Đăng ký thành công:', data.message);
    } else {
      console.error('Lỗi:', data.message);
    }
  } catch (error) {
    console.error('Lỗi network:', error);
  }
}
```

### **2. Lấy tiến độ khóa học:**
```javascript
async function getCourseProgress(courseId, token) {
  try {
    const response = await fetch(`/api/khoahoc/${courseId}/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Tiến độ:', data.data.completion_percentage + '%');
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
}
```

### **3. Thêm ghi chú bài học:**
```javascript
async function addLessonNote(lessonId, noteText, token) {
  try {
    const response = await fetch(`/api/baihoc/${lessonId}/note`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        note_text: noteText,
        note_type: 'vocabulary'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Thêm ghi chú thành công');
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
}
```

### **4. Lấy thông tin khóa học và trạng thái đăng ký:**
```javascript
async function getCourseDetail(courseId, token) {
  try {
    const response = await fetch(`/api/khoahoc/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const course = data.data;
      
      // Hiển thị thông tin khóa học
      console.log('Tên khóa học:', course.title);
      console.log('Số học viên:', course.stats.enrollment_count);
      
      // Kiểm tra trạng thái đăng ký
      if (course.enrollment_status) {
        if (course.enrollment_status.is_enrolled) {
          console.log('Đã đăng ký - Tiến độ:', course.enrollment_status.completion_percentage + '%');
          // Hiển thị nút "Tiếp tục học"
          showContinueButton(course.enrollment_status.completion_percentage);
        } else {
          console.log('Chưa đăng ký');
          // Hiển thị nút "Đăng ký ngay"
          showEnrollButton();
        }
      } else {
        console.log('Chưa đăng nhập');
        // Hiển thị nút "Đăng nhập để đăng ký"
        showLoginPrompt();
      }
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
}
```

---

## 🎯 LƯU Ý QUAN TRỌNG

1. **Authentication**: Tất cả API protected đều yêu cầu token JWT hợp lệ
2. **Content URL Processing**: API tự động xử lý YouTube và Google Drive links thành embed URLs
3. **Pagination**: Các API danh sách đều hỗ trợ phân trang
4. **Error Handling**: Luôn kiểm tra response.success trước khi xử lý data
5. **Rate Limiting**: Có giới hạn số request để tránh spam
6. **CORS**: API hỗ trợ CORS cho frontend cross-origin
7. **Enrollment Status**: API `GET /api/khoahoc/{id}` tự động trả về trạng thái đăng ký nếu user đã đăng nhập
8. **Completion Percentage**: Được lưu trữ trong database và tự động cập nhật khi user hoàn thành bài học

---

## 📞 HỖ TRỢ

Nếu có vấn đề với API, vui lòng liên hệ:
- Email: support@example.com
- Documentation: https://api.example.com/docs
- GitHub Issues: https://github.com/example/api-issues

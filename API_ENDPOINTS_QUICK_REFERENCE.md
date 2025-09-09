# 🚀 API ENDPOINTS - QUICK REFERENCE

## 📋 TÓM TẮT NHANH CÁC API

### **🎓 KHÓA HỌC (COURSES)**

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/khoahoc` | ❌ | Danh sách khóa học |
| `GET` | `/api/khoahoc/{id}` | ❌ | Chi tiết khóa học |
| `GET` | `/api/khoahoc/{id}/lessons` | ❌ | Bài học của khóa học |
| `GET` | `/api/khoahoc/search` | ❌ | Tìm kiếm khóa học |
| `GET` | `/api/khoahoc/category/{category}` | ❌ | Khóa học theo danh mục |
| `POST` | `/api/khoahoc/{id}/enroll` | ✅ | Đăng ký khóa học |
| `GET` | `/api/khoahoc/enrolled` | ✅ | Khóa học đã đăng ký |
| `DELETE` | `/api/khoahoc/{id}/unenroll` | ✅ | Hủy đăng ký |
| `GET` | `/api/khoahoc/{id}/progress` | ✅ | Tiến độ khóa học |
| `POST` | `/api/khoahoc/{id}/review` | ✅ | Đánh giá khóa học |
| `GET` | `/api/khoahoc/{id}/reviews` | ❌ | Xem đánh giá |

### **📖 BÀI HỌC (LESSONS)**

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/baihoc` | ❌ | Danh sách bài học |
| `GET` | `/api/baihoc/{id}` | ❌ | Chi tiết bài học |
| `GET` | `/api/baihoc/course/{courseId}` | ❌ | Bài học theo khóa học |
| `POST` | `/api/baihoc/{id}/start` | ✅ | Bắt đầu học bài học |
| `POST` | `/api/baihoc/{id}/complete` | ✅ | Hoàn thành bài học |
| `GET` | `/api/baihoc/{id}/progress` | ✅ | Tiến độ bài học |

### **📝 GHI CHÚ BÀI HỌC (NOTES)**

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `POST` | `/api/baihoc/{id}/note` | ✅ | Thêm ghi chú |
| `GET` | `/api/baihoc/{id}/notes` | ✅ | Xem ghi chú |
| `PUT` | `/api/baihoc/{id}/notes/{noteId}` | ✅ | Cập nhật ghi chú |
| `DELETE` | `/api/baihoc/{id}/notes/{noteId}` | ✅ | Xóa ghi chú |
| `GET` | `/api/baihoc/user/notes` | ✅ | Tất cả ghi chú của user |
| `GET` | `/api/baihoc/user/notes/search` | ✅ | Tìm kiếm ghi chú |

---

## 🔑 PARAMETERS & BODY EXAMPLES

### **Query Parameters Chung:**
```javascript
{
  page: 1,           // Trang hiện tại
  limit: 10,         // Số item mỗi trang
  difficulty: 'beginner|intermediate|advanced',
  category: 'string'
}
```

### **Body Examples:**

#### **Đăng ký khóa học:**
```javascript
// Không cần body
POST /api/khoahoc/123/enroll
```

#### **Đánh giá khóa học:**
```javascript
{
  "rating": 5,                    // 1-5 sao
  "review_text": "Rất hay!"       // Nội dung đánh giá
}
```

#### **Hoàn thành bài học:**
```javascript
{
  "score": 85.5                   // Điểm (optional)
}
```

#### **Thêm ghi chú:**
```javascript
{
  "note_text": "Ghi chú nội dung",
  "note_type": "vocabulary"       // general|vocabulary|grammar|pronunciation
}
```

#### **Cập nhật ghi chú:**
```javascript
{
  "note_text": "Nội dung đã cập nhật"
}
```

---

## 📊 RESPONSE FORMATS

### **Success Response:**
```javascript
{
  "success": true,
  "data": { /* data */ },
  "message": "Thành công" // optional
}
```

### **Error Response:**
```javascript
{
  "success": false,
  "message": "Lỗi mô tả",
  "error_code": "ERROR_CODE" // optional
}
```

### **Pagination Response:**
```javascript
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  }
}
```

---

## 🔐 AUTHENTICATION

### **Header Required:**
```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

### **Token Format:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ QUICK START EXAMPLES

### **1. Lấy danh sách khóa học:**
```javascript
fetch('/api/khoahoc?page=1&limit=10')
  .then(res => res.json())
  .then(data => console.log(data));
```

### **2. Đăng ký khóa học:**
```javascript
fetch('/api/khoahoc/123/enroll', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### **3. Thêm ghi chú:**
```javascript
fetch('/api/baihoc/456/note', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    note_text: 'Ghi chú của tôi',
    note_type: 'vocabulary'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🚨 ERROR CODES

| Code | HTTP Status | Mô tả |
|------|-------------|-------|
| `COURSE_NOT_FOUND` | 404 | Không tìm thấy khóa học |
| `LESSON_NOT_FOUND` | 404 | Không tìm thấy bài học |
| `ALREADY_ENROLLED` | 409 | Đã đăng ký khóa học |
| `NOT_ENROLLED` | 400 | Chưa đăng ký khóa học |
| `INVALID_TOKEN` | 401 | Token không hợp lệ |
| `PERMISSION_DENIED` | 403 | Không có quyền truy cập |

---

## 📱 FRONTEND INTEGRATION TIPS

### **1. Axios Setup:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **2. Error Handling:**
```javascript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### **3. Loading States:**
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchCourses = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await api.get('/khoahoc');
    setCourses(response.data.data);
  } catch (err) {
    setError(err.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    setLoading(false);
  }
};
```

---

## 🎯 BEST PRACTICES

1. **Always check `success` field** before processing data
2. **Handle pagination** for list endpoints
3. **Use proper error handling** for network errors
4. **Cache responses** when appropriate
5. **Validate input** before sending requests
6. **Use loading states** for better UX
7. **Implement retry logic** for failed requests
8. **Log errors** for debugging

---

## 📞 SUPPORT

- **Full Documentation**: `API_GUIDE.md`
- **Database Schema**: `file dulieu sql cuaweb.sql`
- **Source Code**: `app/controllers/api/` và `app/models/`

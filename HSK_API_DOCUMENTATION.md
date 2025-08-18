# HSK API Documentation - Phase 1, 2 & 3

## 🎯 **Core API Endpoints**

### **Base URL:** `http://localhost:3000/api/hsk`

---

## **Phase 1 - Core Features** ✅ **COMPLETED**

### **1. Lấy danh sách đề thi**
```http
GET /tests
```

**Query Parameters:**
- `level` (optional): HSK level (1-6)
- `status` (optional): Test status (active/inactive)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "test_id": 1,
        "hsk_level": 3,
        "title": "HSK 3 Practice Test 1",
        "description": "Practice test for HSK level 3",
        "total_questions": 25,
        "time_limit": 120,
        "passing_score": 60,
        "randomize_questions": true,
        "status": "published",
        "is_active": true
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### **2. Chi tiết đề thi**
```http
GET /tests/:testId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "test": {
      "test_id": 1,
      "hsk_level": 3,
      "title": "HSK 3 Practice Test 1",
      "description": "Practice test for HSK level 3",
      "total_questions": 25,
      "time_limit": 120,
      "passing_score": 60,
      "randomize_questions": true,
      "status": "published",
      "is_active": true
    },
    "question_count": 25,
    "estimated_time": 120,
    "can_take": true
  }
}
```

---

### **3. Bắt đầu bài thi**
```http
POST /tests/:testId/start
```

**Request Body:**
```json
{
  "user_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result_id": 456,
    "test_info": {
      "test_id": 1,
      "title": "HSK 3 Practice Test 1",
      "hsk_level": 3,
      "total_questions": 25,
      "time_limit": 120,
      "passing_score": 60
    },
    "started_at": "2024-01-15T10:00:00Z",
    "time_limit": 120,
    "total_questions": 25
  }
}
```

---

### **4. Lấy câu hỏi bài thi**
```http
GET /tests/:testId/questions
```

**Query Parameters:**
- `result_id` (optional): Result ID for tracking
- `randomize` (optional): Force randomization (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "test_id": 1,
    "total_questions": 25,
    "questions": [
      {
        "question_id": 1,
        "question_type": "multiple_choice",
        "skill_type": "reading",
        "question_text": "你好 có nghĩa là gì?",
        "audio_url": null,
        "image_url": null,
        "options": ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
        "points": 1,
        "order_in_test": 1,
        "difficulty_level": "easy"
      }
    ]
  }
}
```

---

### **5. Nộp bài thi**
```http
POST /results/:resultId/submit
```

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": 1,
      "user_answer": "A"
    },
    {
      "question_id": 2,
      "user_answer": "true"
    }
  ],
  "ended_at": "2024-01-15T12:00:00Z",
  "time_spent": 120
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result_id": 456,
    "total_score": 85,
    "listening_score": 30,
    "reading_score": 35,
    "writing_score": 20,
    "passed": true,
    "correct_answers": 20,
    "total_questions": 25,
    "time_spent": 120,
    "passing_score": 60
  }
}
```

---

## **Phase 2 - Results & Analytics** ✅ **COMPLETED**

### **6. Chi tiết kết quả bài thi**
```http
GET /results/:resultId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "result_id": 456,
      "user_id": 123,
      "test_id": 1,
      "status": "submitted",
      "started_at": "2024-01-15T10:00:00Z",
      "ended_at": "2024-01-15T12:00:00Z",
      "time_spent": 120,
      "time_limit": 120,
      "time_efficiency": 100,
      "total_score": 85,
      "listening_score": 30,
      "reading_score": 35,
      "writing_score": 20,
      "passed": true,
      "total_questions": 25
    },
    "test": {
      "test_id": 1,
      "title": "HSK 3 Practice Test 1",
      "hsk_level": 3,
      "passing_score": 60
    },
    "skill_stats": {
      "listening": {
        "score": 30,
        "percentage": 40
      },
      "reading": {
        "score": 35,
        "percentage": 47
      },
      "writing": {
        "score": 20,
        "percentage": 27
      }
    },
    "answers": [
      {
        "question_id": 1,
        "question_text": "你好 có nghĩa là gì?",
        "user_answer": "A",
        "correct_answer": "A",
        "is_correct": true,
        "explanation": "你好 có nghĩa là 'Xin chào'"
      }
    ]
  }
}
```

---

### **7. Lịch sử bài thi của user**
```http
GET /results/user/:userId
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `test_id` (optional): Filter by specific test

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "results": [
      {
        "result_id": 456,
        "test_id": 1,
        "test_title": "HSK 3 Practice Test 1",
        "hsk_level": 3,
        "status": "submitted",
        "started_at": "2024-01-15T10:00:00Z",
        "ended_at": "2024-01-15T12:00:00Z",
        "time_spent": 120,
        "total_score": 85,
        "passed": true,
        "total_questions": 25
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "total_pages": 2,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### **8. Thống kê cá nhân**
```http
GET /stats/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "overview": {
      "total_tests": 15,
      "passed_tests": 12,
      "pass_rate": 80,
      "average_score": 78,
      "best_score": 95,
      "total_time_spent": 1800,
      "avg_time_per_test": 120
    },
    "level_stats": [
      {
        "hsk_level": 3,
        "completed_tests": 8,
        "passed_tests": 7,
        "average_score": 82,
        "pass_rate": 88
      },
      {
        "hsk_level": 4,
        "completed_tests": 7,
        "passed_tests": 5,
        "average_score": 74,
        "pass_rate": 71
      }
    ],
    "trends": {
      "recent_scores": [85, 78, 92, 75, 88],
      "score_trend": 13,
      "trend_direction": "improving"
    }
  }
}
```

---

### **9. Bảng xếp hạng**
```http
GET /leaderboard/:level
```

**Path Parameters:**
- `level`: HSK level (1-6) hoặc "all" cho tất cả levels

**Query Parameters:**
- `limit` (optional): Number of rankings (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "level": 3,
    "leaderboard": [
      {
        "rank": 1,
        "user_id": 456,
        "username": "top_student",
        "avatar": null,
        "stats": {
          "total_tests": 25,
          "average_score": 92,
          "best_score": 98,
          "passed_tests": 24,
          "pass_rate": 96
        }
      }
    ],
    "total_rankings": 20
  }
}
```

---

## **Phase 3 - Practice, Search, Analytics, Session** ✅ **COMPLETED**

### **10. Luyện tập theo kỹ năng**
```http
GET /practice/:skillType
```

**Path Parameters:**
- `skillType`: `listening`, `reading`, hoặc `writing`

**Query Parameters:**
- `level` (optional): HSK level (1-6)
- `limit` (optional): Số câu hỏi (default: 10)
- `difficulty` (optional): `easy`, `medium`, `hard`

**Response:**
```json
{
  "success": true,
  "data": {
    "skill_type": "reading",
    "level": 4,
    "questions": [
      {
        "question_id": 57,
        "question_type": "multiple_choice",
        "skill_type": "reading",
        "question_text": "你好 có nghĩa là gì?",
        "audio_url": null,
        "image_url": null,
        "options": ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
        "points": 1,
        "difficulty_level": "easy"
      }
    ]
  }
}
```

---

### **11. Tìm kiếm đề thi**
```http
GET /search/tests
```

**Query Parameters:**
- `q` (optional): Từ khóa tìm kiếm
- `level` (optional): HSK level (1-6)
- `status` (optional): Trạng thái đề thi
- `page` (optional): Trang (default: 1)
- `limit` (optional): Số lượng (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "test_id": 2,
        "hsk_level": 4,
        "title": "HSK 4 Mock Test - 01",
        "description": "Đề thi thử HSK 4",
        "total_questions": 75,
        "time_limit": 105,
        "passing_score": 180,
        "status": "published",
        "is_active": true
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 5,
      "total_pages": 1
    }
  }
}
```

---

### **12. Phân tích điểm yếu cá nhân**
```http
GET /analytics/weaknesses/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "weaknesses": {
      "by_skill": [
        {
          "skill_type": "reading",
          "wrong": 5,
          "total": 20,
          "wrong_rate": 25
        },
        {
          "skill_type": "listening",
          "wrong": 3,
          "total": 15,
          "wrong_rate": 20
        }
      ],
      "by_type": [
        {
          "question_type": "multiple_choice",
          "wrong": 4,
          "total": 18,
          "wrong_rate": 22
        }
      ]
    }
  }
}
```

---

### **13. Lưu phiên làm bài (auto-save)**
```http
POST /session/save
```

**Request Body:**
```json
{
  "result_id": 456,
  "answers_snapshot": [
    {
      "question_id": 1,
      "user_answer": "A"
    }
  ],
  "time_spent": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result_id": 456,
    "saved": true
  }
}
```

---

## **Error Responses**

### **400 Bad Request**
```json
{
  "success": false,
  "message": "user_id là bắt buộc"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Không tìm thấy kết quả bài thi"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Lỗi khi lấy danh sách đề thi",
  "error": "Database connection failed"
}
```

---

## **Question Types Support**

### **Multiple Choice**
```json
{
  "question_type": "multiple_choice",
  "options": ["A", "B", "C", "D"],
  "user_answer": "A"
}
```

### **True/False**
```json
{
  "question_type": "true_false",
  "user_answer": "true"
}
```

### **Fill Blank**
```json
{
  "question_type": "fill_blank",
  "user_answer": "Xin chào"
}
```

### **Matching**
```json
{
  "question_type": "matching",
  "user_answer": "A-1,B-2,C-3,D-4"
}
```

### **Ordering**
```json
{
  "question_type": "ordering",
  "user_answer": "1,3,2,4"
}
```

### **Rewrite**
```json
{
  "question_type": "rewrite",
  "user_answer": "Tôi cảm thấy học tiếng Trung rất thú vị"
}
```

---

## **Usage Examples**

### **Frontend Flow:**

1. **Lấy danh sách đề thi:**
```javascript
const response = await fetch('/api/hsk/tests?level=3&page=1&limit=10');
const data = await response.json();
```

2. **Xem chi tiết đề thi:**
```javascript
const response = await fetch('/api/hsk/tests/1');
const data = await response.json();
```

3. **Bắt đầu bài thi:**
```javascript
const response = await fetch('/api/hsk/tests/1/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 123 })
});
const data = await response.json();
```

4. **Lấy câu hỏi:**
```javascript
const response = await fetch('/api/hsk/tests/1/questions?result_id=456');
const data = await response.json();
```

5. **Nộp bài:**
```javascript
const response = await fetch('/api/hsk/results/456/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: [
      { question_id: 1, user_answer: 'A' },
      { question_id: 2, user_answer: 'true' }
    ],
    time_spent: 120
  })
});
const data = await response.json();
```

6. **Xem chi tiết kết quả:**
```javascript
const response = await fetch('/api/hsk/results/456');
const data = await response.json();
```

7. **Lịch sử bài thi:**
```javascript
const response = await fetch('/api/hsk/results/user/123?page=1&limit=10');
const data = await response.json();
```

8. **Thống kê cá nhân:**
```javascript
const response = await fetch('/api/hsk/stats/user/123');
const data = await response.json();
```

9. **Bảng xếp hạng:**
```javascript
const response = await fetch('/api/hsk/leaderboard/3?limit=20');
const data = await response.json();
```

10. **Luyện tập theo kỹ năng:**
```javascript
const response = await fetch('/api/hsk/practice/reading?level=4&limit=10');
const data = await response.json();
```

11. **Tìm kiếm đề thi:**
```javascript
const response = await fetch('/api/hsk/search/tests?q=HSK%204&level=4');
const data = await response.json();
```

12. **Phân tích điểm yếu:**
```javascript
const response = await fetch('/api/hsk/analytics/weaknesses/123');
const data = await response.json();
```

13. **Lưu phiên làm bài:**
```javascript
const response = await fetch('/api/hsk/session/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    result_id: 456,
    answers_snapshot: [{ question_id: 1, user_answer: 'A' }],
    time_spent: 45
  })
});
const data = await response.json();
```

---

## **Notes**

- Tất cả responses đều có format `{ success: boolean, data: object }`
- Error responses có thêm field `message` và `error`
- Timestamps sử dụng ISO 8601 format
- Question types: `multiple_choice`, `fill_blank`, `matching`, `true_false`, `ordering`, `rewrite`
- Skill types: `listening`, `reading`, `writing`
- Difficulty levels: `easy`, `medium`, `hard`
- Trend directions: `improving`, `declining`, `stable`

---

## **🎯 HƯỚNG DẪN TÍCH HỢP VÀO VUE.JS FRONTEND**

### **📋 Tổng quan tích hợp:**

Dự án Vue.js của bạn đã có sẵn, chỉ cần thêm chức năng HSK test. Dưới đây là hướng dẫn từng bước:

---

### **🔧 Bước 1: Cấu hình API Service**

**Tạo file `src/services/hskApi.js`:**
- Tạo các hàm gọi API cho từng endpoint
- Sử dụng axios hoặc fetch để gọi API
- Xử lý lỗi và response format thống nhất
- Lưu base URL: `http://localhost:3000/api/hsk`

**Các hàm cần tạo:**
- `getTests(params)` - Lấy danh sách đề thi
- `getTestById(id)` - Chi tiết đề thi
- `startTest(testId, userId)` - Bắt đầu bài thi
- `getQuestions(testId, resultId)` - Lấy câu hỏi
- `submitTest(resultId, answers)` - Nộp bài
- `getResultById(resultId)` - Chi tiết kết quả
- `getUserResults(userId, params)` - Lịch sử bài thi
- `getUserStats(userId)` - Thống kê cá nhân
- `getLeaderboard(level, limit)` - Bảng xếp hạng
- `getPracticeQuestions(skillType, params)` - Luyện tập
- `searchTests(params)` - Tìm kiếm đề thi
- `getUserWeaknesses(userId)` - Phân tích điểm yếu
- `saveSessionProgress(data)` - Lưu phiên làm bài

---

### **📱 Bước 2: Tạo Components Vue.js**

**1. Component Danh sách đề thi (`TestList.vue`):**
- Hiển thị danh sách đề thi với pagination
- Filter theo level, status
- Nút "Bắt đầu thi" cho mỗi đề thi
- Sử dụng API: `GET /tests`

**2. Component Chi tiết đề thi (`TestDetail.vue`):**
- Hiển thị thông tin chi tiết đề thi
- Nút "Bắt đầu thi"
- Sử dụng API: `GET /tests/:testId`

**3. Component Làm bài thi (`TestTaking.vue`):**
- Hiển thị câu hỏi theo từng loại
- Timer countdown
- Auto-save progress
- Nộp bài khi hoàn thành
- Sử dụng API: `GET /tests/:testId/questions`, `POST /results/:resultId/submit`

**4. Component Kết quả bài thi (`TestResult.vue`):**
- Hiển thị điểm số và thống kê
- Phân tích theo kỹ năng
- Nút xem lại từng câu hỏi
- Sử dụng API: `GET /results/:resultId`

**5. Component Lịch sử bài thi (`TestHistory.vue`):**
- Danh sách các bài thi đã làm
- Filter và pagination
- Link đến chi tiết kết quả
- Sử dụng API: `GET /results/user/:userId`

**6. Component Thống kê cá nhân (`UserStats.vue`):**
- Dashboard thống kê tổng quan
- Biểu đồ theo level
- Xu hướng điểm số
- Sử dụng API: `GET /stats/user/:userId`

**7. Component Bảng xếp hạng (`Leaderboard.vue`):**
- Hiển thị top users
- Filter theo level
- Sử dụng API: `GET /leaderboard/:level`

**8. Component Luyện tập (`Practice.vue`):**
- Chọn kỹ năng và level
- Hiển thị câu hỏi luyện tập
- Sử dụng API: `GET /practice/:skillType`

**9. Component Tìm kiếm (`TestSearch.vue`):**
- Search box với filter
- Kết quả tìm kiếm
- Sử dụng API: `GET /search/tests`

---

### **🛣️ Bước 3: Cấu hình Router**

**Thêm routes vào `router/index.js`:**
```javascript
// HSK Test Routes
{
  path: '/hsk/tests',
  name: 'HSKTests',
  component: () => import('@/views/hsk/TestList.vue')
},
{
  path: '/hsk/tests/:id',
  name: 'HSKTestDetail',
  component: () => import('@/views/hsk/TestDetail.vue')
},
{
  path: '/hsk/tests/:id/take',
  name: 'HSKTestTaking',
  component: () => import('@/views/hsk/TestTaking.vue')
},
{
  path: '/hsk/results/:id',
  name: 'HSKTestResult',
  component: () => import('@/views/hsk/TestResult.vue')
},
{
  path: '/hsk/history',
  name: 'HSKTestHistory',
  component: () => import('@/views/hsk/TestHistory.vue')
},
{
  path: '/hsk/stats',
  name: 'HSKUserStats',
  component: () => import('@/views/hsk/UserStats.vue')
},
{
  path: '/hsk/leaderboard',
  name: 'HSKLeaderboard',
  component: () => import('@/views/hsk/Leaderboard.vue')
},
{
  path: '/hsk/practice',
  name: 'HSKPractice',
  component: () => import('@/views/hsk/Practice.vue')
},
{
  path: '/hsk/search',
  name: 'HSKSearch',
  component: () => import('@/views/hsk/TestSearch.vue')
}
```

---

### **🎨 Bước 4: Thiết kế UI/UX**

**1. Navigation Menu:**
- Thêm menu "HSK Tests" vào navigation
- Sub-menu: Danh sách đề thi, Lịch sử, Thống kê, Luyện tập, Bảng xếp hạng

**2. Layout cho từng component:**
- **TestList**: Grid layout với cards cho mỗi đề thi
- **TestTaking**: Full-screen layout với sidebar timer
- **TestResult**: Dashboard layout với charts
- **Practice**: Tab layout cho các kỹ năng

**3. Responsive Design:**
- Mobile-first approach
- Tablet và desktop layouts
- Touch-friendly cho mobile

---

### **🔐 Bước 5: State Management (Vuex/Pinia)**

**Tạo store cho HSK:**
```javascript
// stores/hsk.js
export const useHSKStore = defineStore('hsk', {
  state: () => ({
    currentTest: null,
    currentResult: null,
    userAnswers: {},
    testTimer: null,
    isTestActive: false
  }),
  
  actions: {
    async startTest(testId, userId) {
      // Gọi API start test
    },
    async loadQuestions(testId, resultId) {
      // Gọi API load questions
    },
    saveAnswer(questionId, answer) {
      // Lưu đáp án vào state
    },
    async submitTest(resultId) {
      // Gọi API submit test
    }
  }
})
```

---

### **⚡ Bước 6: Tính năng đặc biệt**

**1. Auto-save Progress:**
- Lưu đáp án mỗi 30 giây
- Sử dụng API: `POST /session/save`
- Khôi phục khi reload page

**2. Timer Countdown:**
- Hiển thị thời gian còn lại
- Auto-submit khi hết giờ
- Warning khi còn 5 phút

**3. Question Types Rendering:**
- **Multiple Choice**: Radio buttons
- **True/False**: Toggle buttons
- **Fill Blank**: Text inputs
- **Matching**: Drag & drop interface
- **Ordering**: Drag & drop list
- **Rewrite**: Textarea

**4. Audio/Image Support:**
- Audio player cho listening questions
- Image display cho reading questions
- Lazy loading cho performance

---

### **📊 Bước 7: Analytics & Reporting**

**1. Real-time Progress:**
- Progress bar cho bài thi
- Số câu đã trả lời / tổng số câu
- Thời gian trung bình mỗi câu

**2. Performance Tracking:**
- Lưu thời gian làm mỗi câu
- Phân tích điểm yếu
- Gợi ý cải thiện

**3. Results Visualization:**
- Radar chart cho skill scores
- Bar chart cho question types
- Line chart cho score trends

---

### **🔧 Bước 8: Error Handling**

**1. Network Errors:**
- Retry mechanism
- Offline mode với local storage
- User-friendly error messages

**2. Validation:**
- Validate đáp án trước khi submit
- Check required fields
- Show validation errors

**3. Loading States:**
- Skeleton loading cho lists
- Spinner cho API calls
- Progress indicators

---

### **🚀 Bước 9: Testing & Deployment**

**1. Unit Testing:**
- Test API service functions
- Test component logic
- Mock API responses

**2. Integration Testing:**
- Test complete user flows
- Test error scenarios
- Test responsive design

**3. Performance Optimization:**
- Lazy load components
- Optimize images
- Minify bundles

---

### **📱 Bước 10: Mobile Optimization**

**1. Touch Interactions:**
- Swipe gestures cho navigation
- Touch-friendly buttons
- Mobile-optimized forms

**2. Offline Capability:**
- Cache test data
- Sync when online
- Offline progress tracking

**3. PWA Features:**
- Add to home screen
- Push notifications
- Background sync

---

## **✅ PHASE 1, 2 & 3 COMPLETED!**

### **🎯 Đã hoàn thành:**
- ✅ **Phase 1**: Core API (5 endpoints)
- ✅ **Phase 2**: Results & Analytics (4 endpoints)
- ✅ **Phase 3**: Practice, Search, Analytics, Session (4 endpoints)
- ✅ **Documentation**: Đầy đủ với examples
- ✅ **Testing**: Tất cả API đã test thành công
- ✅ **Error Handling**: Xử lý lỗi database schema
- ✅ **Frontend Guide**: Hướng dẫn tích hợp Vue.js

### **🚀 Sẵn sàng cho development:**
- 🎯 Complete API system (13 endpoints)
- 🔍 Advanced analytics & reporting
- 🔐 Session management & auto-save
- 📱 Mobile-optimized experience
- 🎨 Modern UI/UX design

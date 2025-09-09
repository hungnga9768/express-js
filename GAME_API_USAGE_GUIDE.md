# 🎮 HƯỚNG DẪN SỬ DỤNG GAME API

## 📋 **TỔNG QUAN**

Dự án có hệ thống API game hoàn chỉnh với các tính năng:
- **Game Management**: Quản lý danh sách game, tìm kiếm, phân loại
- **Game Sessions**: Bắt đầu/kết thúc phiên chơi game
- **Leaderboard**: Bảng xếp hạng và ranking
- **User Progress**: Theo dõi tiến độ người dùng
- **Achievements**: Hệ thống thành tích và huy hiệu

---

## 🔐 **AUTHENTICATION**

Hầu hết API cần **JWT Token** trong header:
```http
Authorization: Bearer <your_jwt_token>
```

**Lấy token từ login API:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 🎯 **1. GAME LISTING APIs**

### **1.1 Lấy tất cả games**
```http
GET /api/games
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "HSK Vocabulary Game",
      "type": "vocabulary",
      "description": "Học từ vựng HSK qua game",
      "thumbnail_url": "game1.jpg",
      "difficulty": "easy",
      "is_active": true
    }
  ],
  "message": "Lấy danh sách game thành công"
}
```

### **1.2 Tìm kiếm games**
```http
GET /api/games/search?q=vocabulary&type=puzzle
```

**Parameters:**
- `q`: Từ khóa tìm kiếm
- `type`: Loại game (vocabulary, puzzle, memory, etc.)
- `difficulty`: Độ khó (easy, medium, hard)

### **1.3 Games theo loại**
```http
GET /api/games/type/vocabulary
```

### **1.4 Games được đề xuất (cần auth)**
```http
GET /api/games/recommended
Authorization: Bearer <token>
```

### **1.5 Chi tiết game theo ID**
```http
GET /api/games/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "HSK Vocabulary Game",
    "type": "vocabulary",
    "description": "Học từ vựng HSK qua game",
    "thumbnail_url": "game1.jpg",
    "difficulty": "easy",
    "is_active": true,
    "gameData": {
      "levels": 10,
      "questions_per_level": 20,
      "time_limit": 300
    },
    "rewards": [
      {
        "id": 1,
        "name": "Vocabulary Master",
        "description": "Hoàn thành 100 từ vựng",
        "points": 100
      }
    ]
  }
}
```

---

## 🎮 **2. GAME SESSION APIs**

### **2.1 Bắt đầu game session**
```http
POST /api/games/1/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_123456",
    "game": {
      "id": 1,
      "name": "HSK Vocabulary Game"
    }
  },
  "message": "Bắt đầu game thành công"
}
```

### **2.2 Kết thúc game session**
```http
POST /api/games/sessions/sess_123456/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 850,
  "duration_seconds": 180
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_123456",
    "final_score": 850,
    "duration": 180,
    "level_up": true,
    "new_level": 9,
    "achievements_unlocked": [
      {
        "id": 1,
        "name": "Speed Master",
        "description": "Hoàn thành game trong 3 phút"
      }
    ]
  },
  "message": "Kết thúc game thành công"
}
```

### **2.3 Lấy session hiện tại**
```http
GET /api/games/sessions/current
Authorization: Bearer <token>
```

---

## 🏆 **3. LEADERBOARD APIs**

### **3.1 Bảng xếp hạng game**
```http
GET /api/games/1/leaderboard?limit=10&period=weekly
```

**Parameters:**
- `limit`: Số lượng người chơi (default: 10)
- `period`: Khoảng thời gian (daily, weekly, monthly, all)

**Response:**
```json
{
  "success": true,
  "data": {
    "game_id": 1,
    "period": "weekly",
    "leaderboard": [
      {
        "rank": 1,
        "user_id": 123,
        "username": "player1",
        "score": 1200,
        "avatar": "avatar1.jpg"
      },
      {
        "rank": 2,
        "user_id": 456,
        "username": "player2", 
        "score": 1150,
        "avatar": "avatar2.jpg"
      }
    ],
    "total_players": 150
  }
}
```

### **3.2 Ranking của user (cần auth)**
```http
GET /api/games/1/rank
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "game_id": 1,
    "rank": 15,
    "score": 950,
    "total_players": 150,
    "percentile": 90
  }
}
```

---

## 📊 **4. USER PROGRESS APIs**

### **4.1 Tiến độ user**
```http
GET /api/games/user/progress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_games_played": 25,
    "total_score": 15000,
    "average_score": 600,
    "games_completed": 20,
    "current_level": 8,
    "total_xp": 8500,
    "next_level_xp": 1000,
    "progress_percentage": 85
  }
}
```

### **4.2 Thống kê game của user**
```http
GET /api/games/user/game-stats
Authorization: Bearer <token>
```

### **4.3 Cập nhật tiến độ**
```http
POST /api/games/user/progress/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "game_id": 1,
  "level": 5,
  "xp_earned": 200,
  "achievements": ["speed_master", "accuracy_king"]
}
```

---

## 🏅 **5. ACHIEVEMENTS APIs**

### **5.1 Huy hiệu của user**
```http
GET /api/games/user/badges
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Vocabulary Master",
      "description": "Hoàn thành 100 từ vựng",
      "icon": "badge1.png",
      "earned_date": "2024-01-15T10:30:00Z",
      "points": 100
    }
  ]
}
```

### **5.2 Tất cả achievements**
```http
GET /api/games/achievements
```

---

## 📈 **6. STATISTICS APIs**

### **6.1 Thống kê toàn cục**
```http
GET /api/games/stats/global
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_games": 50,
    "total_players": 1250,
    "total_sessions": 15000,
    "average_score": 650,
    "most_popular_game": {
      "id": 1,
      "name": "HSK Vocabulary Game",
      "play_count": 5000
    },
    "top_players": [
      {
        "user_id": 123,
        "username": "player1",
        "total_score": 25000
      }
    ]
  }
}
```

---

## 🎯 **7. GAME DATA APIs**

### **7.1 Dữ liệu game (cần auth)**
```http
GET /api/games/1/data
Authorization: Bearer <token>
```

### **7.2 Dữ liệu game công khai**
```http
GET /api/games/1/data/public
```

---

## 💡 **VÍ DỤ SỬ DỤNG HOÀN CHỈNH**

### **Flow chơi game hoàn chỉnh:**

```javascript
// 1. Lấy danh sách games
const gamesResponse = await fetch('/api/games');
const games = await gamesResponse.json();

// 2. Chọn game và bắt đầu session
const startResponse = await fetch('/api/games/1/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
const session = await startResponse.json();

// 3. Lấy dữ liệu game
const gameDataResponse = await fetch('/api/games/1/data', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const gameData = await gameDataResponse.json();

// 4. Chơi game... (logic game ở frontend)

// 5. Kết thúc session
const endResponse = await fetch(`/api/games/sessions/${session.data.session_id}/end`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    score: 850,
    duration_seconds: 180
  })
});

// 6. Kiểm tra leaderboard
const leaderboardResponse = await fetch('/api/games/1/leaderboard');
const leaderboard = await leaderboardResponse.json();

// 7. Kiểm tra ranking của user
const rankResponse = await fetch('/api/games/1/rank', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const userRank = await rankResponse.json();
```

---

## ⚠️ **LƯU Ý QUAN TRỌNG**

1. **Authentication**: Hầu hết API cần JWT token
2. **Rate Limiting**: Có giới hạn số request/phút
3. **Error Handling**: Luôn check `success` field trong response
4. **Session Management**: Mỗi game session có ID duy nhất
5. **Score Validation**: Score phải là số nguyên dương
6. **Duration**: Thời gian tính bằng giây

---

## 🔧 **ERROR CODES**

- `400`: Bad Request - Dữ liệu không hợp lệ
- `401`: Unauthorized - Token không hợp lệ
- `404`: Not Found - Game/session không tồn tại
- `429`: Too Many Requests - Vượt quá rate limit
- `500`: Internal Server Error - Lỗi server

---

## 📱 **FRONTEND INTEGRATION**

### **Vue.js Example:**
```javascript
// store/game.js
export const gameStore = {
  state: {
    games: [],
    currentSession: null,
    leaderboard: []
  },
  
  actions: {
    async fetchGames() {
      const response = await this.$http.get('/api/games');
      this.games = response.data.data;
    },
    
    async startGame(gameId) {
      const response = await this.$http.post(`/api/games/${gameId}/start`);
      this.currentSession = response.data.data;
    },
    
    async endGame(score, duration) {
      const response = await this.$http.post(
        `/api/games/sessions/${this.currentSession.session_id}/end`,
        { score, duration_seconds: duration }
      );
      return response.data.data;
    }
  }
}
```

**Chúc bạn sử dụng Game API thành công! 🎮**

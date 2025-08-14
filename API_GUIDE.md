# Hướng dẫn sử dụng Game API cho Frontend VueJS

## Tổng quan

API này cung cấp các endpoint để quản lý game học tiếng Trung, bao gồm:
- Quản lý danh sách game
- Game sessions và gameplay
- Leaderboard và achievements
- User progress và statistics

## Base URL

```
http://localhost:3000/api/game
```

## Authentication

Hầu hết các API cần xác thực bằng JWT token. Thêm header:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

## 1. Game Listing

### Lấy danh sách tất cả games
```javascript
// GET /api/game
const response = await fetch('/api/game');
const data = await response.json();
```

### Lấy thông tin game theo ID
```javascript
// GET /api/game/:id
const response = await fetch(`/api/game/${gameId}`);
const data = await response.json();
```

### Lấy games theo loại
```javascript
// GET /api/game/type/:type
const response = await fetch(`/api/game/type/vocabulary`);
const data = await response.json();
```

### Tìm kiếm game
```javascript
// GET /api/game/search?q=keyword&type=vocabulary&difficulty=easy
const response = await fetch('/api/game/search?q=hello&type=vocabulary&difficulty=easy');
const data = await response.json();
```

## 2. Game Sessions

### Bắt đầu session game mới
```javascript
// POST /api/game/:game_id/start
const response = await fetch(`/api/game/${gameId}/start`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
// Trả về: { session_id, game }
```

### Kết thúc session game
```javascript
// POST /api/game/sessions/:session_id/end
const response = await fetch(`/api/game/sessions/${sessionId}/end`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    score: 150,
    duration_seconds: 300
  })
});
const data = await response.json();
```

## 3. Game Data

### Lấy dữ liệu game cho gameplay
```javascript
// GET /api/game/:game_id/data?limit=10
const response = await fetch(`/api/game/${gameId}/data?limit=10`);
const data = await response.json();
```

## 4. Leaderboard

### Lấy leaderboard của game
```javascript
// GET /api/game/:game_id/leaderboard?limit=10
const response = await fetch(`/api/game/${gameId}/leaderboard?limit=10`);
const data = await response.json();
```

### Lấy rank của user trong game
```javascript
// GET /api/game/:game_id/rank
const response = await fetch(`/api/game/${gameId}/rank`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
```

## 5. User Progress & Statistics

### Lấy tiến độ game của user
```javascript
// GET /api/game/user/progress
const response = await fetch('/api/game/user/progress', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
```

### Lấy thống kê game của user
```javascript
// GET /api/game/user/stats
const response = await fetch('/api/game/user/stats', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
```

## 6. Achievements & Badges

### Lấy badges của user
```javascript
// GET /api/game/user/badges
const response = await fetch('/api/game/user/badges', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
```

### Lấy danh sách tất cả achievements
```javascript
// GET /api/game/achievements
const response = await fetch('/api/game/achievements', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
```

## 7. Recommendations

### Lấy game đề xuất cho user
```javascript
// GET /api/game/recommended?limit=5
const response = await fetch('/api/game/recommended?limit=5', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
```

## 8. Global Statistics

### Lấy thống kê tổng quan
```javascript
// GET /api/game/stats/global
const response = await fetch('/api/game/stats/global');
const data = await response.json();
```

## Cấu trúc dữ liệu

### Game Object
```javascript
{
  game_id: 1,
  name: "Từ vựng cơ bản",
  description: "Học từ vựng tiếng Trung cơ bản",
  game_type: "vocabulary",
  difficulty: "easy",
  instructions: "Chọn từ đúng nghĩa",
  thumbnail_url: "/images/games/game-1.jpg",
  is_active: true,
  created_at: "2024-01-01T00:00:00.000Z"
}
```

### Game Data Object
```javascript
{
  data_id: 1,
  game_id: 1,
  question: "你好 có nghĩa là gì?",
  answer: "Xin chào",
  options: ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
  explanation: "你好 (nǐ hǎo) có nghĩa là xin chào",
  image_url: "/images/games/data-1.jpg",
  created_at: "2024-01-01T00:00:00.000Z"
}
```

### User Progress Object
```javascript
{
  user_id: 1,
  game_id: 1,
  level: 5,
  current_xp: 450,
  unlocked_rewards: ["badge_1", "badge_2"],
  last_played: "2024-01-01T00:00:00.000Z"
}
```

### Leaderboard Entry
```javascript
{
  entry_id: 1,
  game_id: 1,
  user_id: 1,
  score: 1500,
  date_achieved: "2024-01-01T00:00:00.000Z",
  username: "user1",
  full_name: "Nguyễn Văn A",
  profile_picture: "/images/users/user1.jpg"
}
```

## Error Handling

Tất cả API trả về response với format:

```javascript
// Success
{
  success: true,
  data: {...},
  message: "Thành công"
}

// Error
{
  success: false,
  message: "Có lỗi xảy ra"
}
```

## Status Codes

- `200`: Thành công
- `400`: Bad Request
- `401`: Unauthorized (chưa đăng nhập)
- `404`: Not Found
- `500`: Internal Server Error

## Ví dụ sử dụng trong VueJS

### Vuex Store
```javascript
// store/modules/game.js
export default {
  namespaced: true,
  state: {
    games: [],
    currentGame: null,
    userProgress: [],
    leaderboard: []
  },
  mutations: {
    SET_GAMES(state, games) {
      state.games = games;
    },
    SET_CURRENT_GAME(state, game) {
      state.currentGame = game;
    }
  },
  actions: {
    async fetchGames({ commit }) {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        if (data.success) {
          commit('SET_GAMES', data.data);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    },
    async startGame({ commit }, gameId) {
      try {
        const response = await fetch(`/api/game/${gameId}/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      } catch (error) {
        console.error('Error starting game:', error);
      }
    }
  }
};
```

### Vue Component
```vue
<template>
  <div class="game-list">
    <div v-for="game in games" :key="game.game_id" class="game-card">
      <img :src="game.thumbnail_url" :alt="game.name">
      <h3>{{ game.name }}</h3>
      <p>{{ game.description }}</p>
      <button @click="startGame(game.game_id)">Chơi ngay</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'GameList',
  computed: {
    ...mapState('game', ['games'])
  },
  methods: {
    ...mapActions('game', ['fetchGames', 'startGame']),
    async handleStartGame(gameId) {
      const session = await this.startGame(gameId);
      if (session) {
        this.$router.push(`/game/${gameId}/play?session=${session.session_id}`);
      }
    }
  },
  async mounted() {
    await this.fetchGames();
  }
};
</script>
```

## Lưu ý

1. **Authentication**: Đảm bảo user đã đăng nhập trước khi gọi các API cần xác thực
2. **Error Handling**: Luôn xử lý lỗi khi gọi API
3. **Loading States**: Hiển thị loading khi đang gọi API
4. **Caching**: Có thể cache dữ liệu game để tăng performance
5. **Pagination**: Sử dụng limit parameter cho các API trả về danh sách dài

## Support

Nếu có vấn đề gì, vui lòng liên hệ admin hoặc xem log server để debug.

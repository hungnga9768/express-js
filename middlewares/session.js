// const session = require("express-session");
// const sessionStorage = require("node-sessionstorage");

// class CustomStore extends session.Store {
//   constructor() {
//     super();
//   }

//   get(sid, callback) {
//     const data = sessionStorage.getItem(sid);
//     callback(null, data ? JSON.parse(data) : null);
//   }

//   set(sid, session, callback) {
//     sessionStorage.setItem(sid, JSON.stringify(session));
//     callback(null);
//   }

//   destroy(sid, callback) {
//     sessionStorage.removeItem(sid);
//     callback(null);
//   }
// }

// const sessionMiddleware = session({
//   secret: "your-secret-key",
//   resave: false,
//   saveUninitialized: true,
//   store: new CustomStore(),
//   cookie: {
//     secure: false, // true nếu dùng HTTPS
//     maxAge: 1000 * 60 * 6000,
//   },
// });
// module.exports = sessionMiddleware;

// const session = require("express-session");
// const Redis = require("redis");
// const RedisStore = require("connect-redis")(session);

// // Tạo Redis client
// const redisClient = Redis.createClient({
//   url: "redis://localhost:6379", // Cổng mặc định Redis
//   legacyMode: true, // ⚠️ BẮT BUỘC nếu dùng với connect-redis v6 trở lên
// });

// redisClient.connect().catch(console.error); // Kết nối Redis

// // Middleware session dùng Redis
// const sessionMiddleware = session({
//   store: new RedisStore({ client: redisClient }),
//   secret: "your-secret-key", // 🔐 Đặt chuỗi bí mật mạnh
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: false, // true nếu dùng HTTPS
//     httpOnly: true,
//     maxAge: 1000 * 60 * 60 * 24, // 1 ngày
//     sameSite: "lax",
//   },
// });

// module.exports = sessionMiddleware;

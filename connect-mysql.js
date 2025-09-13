const mysql = require("mysql2/promise");
require("dotenv").config();

// Optimized connection pool with mysql2/promise for better concurrency
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 25,           // ↑ Tăng từ 10 → 25 cho concurrency tốt hơn
  queueLimit: 50,               // ↑ Giới hạn queue để tránh memory leak
  idleTimeout: 300000,          // ↑ 5 minutes idle timeout
  charset: 'utf8mb4',           // ↑ Unicode support
  timezone: '+07:00'            // ↑ Vietnam timezone
});

// Test kết nối trong một function async
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    // console.log("Kết nối thành công tới MySQL (Connection Pool)");
    connection.release(); // Trả connection về pool
  } catch (err) {
    console.error("Kết nối thất bại:", err);
  }
}

// Gọi function test kết nối
testConnection();

// Export pool trực tiếp (mysql2/promise tự động hỗ trợ promise)
module.exports = pool;

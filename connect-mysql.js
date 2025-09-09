const mysql = require("mysql2/promise");
require("dotenv").config();

// Tạo connection pool với mysql2/promise (tự động hỗ trợ promise)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Số lượng connection tối đa trong pool
  queueLimit: 0 // Không giới hạn số lượng request chờ
});

// Test kết nối trong một function async
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Kết nối thành công tới MySQL (Connection Pool)");
    connection.release(); // Trả connection về pool
  } catch (err) {
    console.error("Kết nối thất bại:", err);
  }
}

// Gọi function test kết nối
testConnection();

// Export pool trực tiếp (mysql2/promise tự động hỗ trợ promise)
module.exports = pool;

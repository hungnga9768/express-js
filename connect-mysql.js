const mysql = require("mysql2");
require("dotenv").config();
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // đổi thành tên database bạn tạo
});

connection.connect((err) => {
  if (err) {
    console.error(" Kết nối thất bại:", err);
    return;
  }
  console.log(" Kết nối thành công tới MySQL");
});
module.exports = connection;

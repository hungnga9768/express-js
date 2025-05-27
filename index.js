const express = require("express");
const cors = require("cors"); // thu vien lien ket font endend
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const passport = require("passport");
require("dotenv").config();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
const port = process.env.PORT || 3000; // Sử dụng biến môi trường nếu có
// const sessionMiddleware = require("./middlewares/session");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Chỉ rõ thư mục views
// Middleware quan trọng
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Đường dẫn tuyệt đối
// Xử lý favicon (tránh request không cần thiết)
app.get("/favicon.ico", (req, res) => res.status(204));

app.use(passport.initialize()); // Khởi tạo Passport
require("./config/passport")(passport); // Truyền đối tượng passport vào hàm cấu hình

// app.use(sessionMiddleware);
const routes = require("./routes");
app.use("/", routes);

app.use((req, res, next) => {
  console.log("Đang truy cập:", req.path);
  next();
});
// Khởi động server
app.listen(port, () => {
  console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
});

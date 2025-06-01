const express = require("express");
const cors = require("cors"); // thu vien lien ket font endend
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const { startCronJobs } = require("./app/services/cronjobs"); // đường đãn file chức năng dịnh kì
app.use(cookieParser());
const passport = require("passport");
require("dotenv").config();
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Cho phép khi chạy frontend cục bộ trên cùng máy
      "http://192.168.240.124:5173",
      "http://localhost:8100", // Cho phép khi truy cập frontend từ IP LAN của bạn
      // Nếu bạn muốn cho phép bất kỳ origin nào (KHÔNG NÊN DÙNG TRONG PRODUCTION):
      // "*",
    ],
    credentials: true,
  })
);

const port = process.env.PORT || 3000; // Sử dụng biến môi trường nếu có
//sử dụng template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Chỉ rõ thư mục views
// cho phép nhận gửi putt post
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Đường dẫn tuyệt đối

// Xử lý favicon (tránh request không cần thiết)
app.get("/favicon.ico", (req, res) => res.status(204));

app.use(passport.initialize()); // Khởi tạo Passport
require("./config/passport")(passport); // Truyền đối tượng passport vào hàm cấu hình

//phần router
const routes = require("./routes");
app.use("/", routes);
// log hiển thị truy cập
app.use((req, res, next) => {
  console.log("Đang truy cập:", req.path);
  next();
});
// Khởi động server
app.listen(port, () => {
  startCronJobs();
  console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
});

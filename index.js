const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
require("dotenv").config();

const app = express();
const { startCronJobs } = require("./app/services/cronjobs");

app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.240.124:5173",
      "http://localhost:8100",
    ],
    credentials: true,
  })
);

// Middleware ghi log truy cập (đặt sớm)
app.use((req, res, next) => {
  console.log("Đang truy cập:", req.method, req.path); // Thêm req.method để rõ hơn
  next();
});

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Phục vụ file tĩnh
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, 'dist'))); // Cho frontend

app.get("/favicon.ico", (req, res) => res.status(204).end()); // Thêm .end()

app.use(passport.initialize());
require("./config/passport")(passport);

// API routes
const routes = require("./routes"); 
app.use("/", routes);

// Catch-all route cho SPA (đặt cuối cùng)
app.get('/*splat', (req, res) => { // THÊM DẤU GẠCH CHÉO (/) Ở ĐẦU DẤU *
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  startCronJobs();
  console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
});
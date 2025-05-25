const jwt = require("jsonwebtoken");
const userModel = require("../../models/user");
const bcrypt = require("bcrypt"); // phương thức mã hóa sản phẩm
const saltRounds = 10; //số vòng mã hóa sản phẩm vòng càng cao thì chạy chậm
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

module.exports = {
  async Login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userModel.check_emaill(email);

      if (!user.length) {
        return res.status(400).json({ message: "Tài khoản không tồn tại" });
      }

      const storedPassword = user[0].password_hash;
      const isMatch = await bcrypt.compare(password, storedPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Sai mật khẩu, mời nhập lại" });
      }

      const userInfo = {
        user_id: user[0].user_id,
        username: user[0].username,
        email: user[0].email,
        full_name: user[0].full_name,
        profile_picture: user[0].profile_picture,
      };
      console.log(userInfo);
      const accessToken = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(userInfo, REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Đăng nhập thành công",
        accessToken,
        user: userInfo,
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      res.status(500).json({ message: "Đã xảy ra lỗi server" });
    }
  },
  refreshToken(req, res) {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Không có refresh token" });
    }

    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Refresh token không hợp lệ" });
      }

      const userInfo = {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      };

      const accessToken = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      return res.status(200).json({ accessToken });
    });
  },

  checkLogin: (req, res) => {
    return res.status(200).json({
      message: "Đã đăng nhập",
      user: req.user,
    });
  },

  async create(req, res) {
    try {
      const { email, firstName, lastName } = req.body;
      const password_hash = await bcrypt.hash(req.body.password, saltRounds);
      console.log(email, firstName, lastName);
      const user = {
        username: firstName + lastName,
        full_name: firstName + " " + lastName,
        email,
        password_hash,
        profile_picture: "/dist/img/avatar4.png",
      };
      const isDuplicate = await userModel.checkDuplicateUsernameOrEmail(
        user.username,
        email
      );
      if (isDuplicate) {
        return res.status(409).json({
          message: "Tên đăng nhập hoặc email đã tồn tại bởi người dùng khác.",
          data: "hihi",
        });
      }
      await userModel.create(user);
      res.status(200).json({ message: "Đăng ký thành công", data: user });
    } catch (err) {
      console.error("lỗi đăng ký nguòi dùng:", err);
      return res.status(400).json({ err });
    }
  },

  logout(req, res) {
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Đăng xuất thành công" });
  },
};

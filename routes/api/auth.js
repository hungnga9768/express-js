// routes/auth.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Đảm bảo đã tải biến môi trường

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const userInfo = {
      user_id: req.user.user_id,
      username: req.user.username,
      email: req.user.email,
      full_name: req.user.full_name,
      profile_picture: req.user.profile_picture,
      role: req.user.role || "user",
    };

    try {
      // Tạo Access Token (thời gian sống ngắn, gửi qua URL hoặc response body)
      const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      // Tạo Refresh Token (thời gian sống dài hơn, đặt trong HttpOnly cookie)
      const refreshToken = jwt.sign(
        userInfo,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      // Đặt Refresh Token vào HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // ✅ CẬP NHẬT LAST_LOGIN CHO GOOGLE OAUTH
      const userModel = require('../../app/models/user');
      userModel.updateLastLogin(req.user.user_id)
        .then(() => {
          console.log(`Updated last_login for Google OAuth user ID: ${req.user.user_id}`);
        })
        .catch((error) => {
          console.error("Error updating last_login for Google OAuth user:", error);
        });

      // Chuyển đổi userInfo thành chuỗi JSON và mã hóa để đưa vào URL
      const encodedUserInfo = encodeURIComponent(JSON.stringify(userInfo));
      // Tự động detect frontend URL dựa trên request
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        // Nếu không có FRONTEND_URL, tự động detect từ request
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
        const host = req.get('host') || 'localhost:3000';
        frontendUrl = `${protocol}://${host}`;
      }
      const redirectUrl = `${frontendUrl}/auth-callback?accessToken=${accessToken}&user=${encodedUserInfo}`;
      console.log(`Redirecting to frontend: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error during JWT creation or cookie setting:", error);
      // Tự động detect frontend URL dựa trên request
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        // Nếu không có FRONTEND_URL, tự động detect từ request
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
        const host = req.get('host') || 'localhost:3000';
        frontendUrl = `${protocol}://${host}`;
      }
      res.redirect(`${frontendUrl}/login`);
    }
  }
);

// Facebook OAuth routes
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const userInfo = {
      user_id: req.user.user_id,
      username: req.user.username,
      email: req.user.email,
      full_name: req.user.full_name,
      profile_picture: req.user.profile_picture,
      role: req.user.role || "user",
    };

    try {
      // Tạo Access Token (thời gian sống ngắn, gửi qua URL hoặc response body)
      const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      // Tạo Refresh Token (thời gian sống dài hơn, đặt trong HttpOnly cookie)
      const refreshToken = jwt.sign(
        userInfo,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      // Đặt Refresh Token vào HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // ✅ CẬP NHẬT LAST_LOGIN CHO FACEBOOK OAUTH
      const userModel = require('../../app/models/user');
      userModel.updateLastLogin(req.user.user_id)
        .then(() => {
          console.log(`Updated last_login for Facebook OAuth user ID: ${req.user.user_id}`);
        })
        .catch((error) => {
          console.error("Error updating last_login for Facebook OAuth user:", error);
        });

      // Chuyển đổi userInfo thành chuỗi JSON và mã hóa để đưa vào URL
      const encodedUserInfo = encodeURIComponent(JSON.stringify(userInfo));
      // Tự động detect frontend URL dựa trên request
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        // Nếu không có FRONTEND_URL, tự động detect từ request
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
        const host = req.get('host') || 'localhost:3000';
        frontendUrl = `${protocol}://${host}`;
      }
      const redirectUrl = `${frontendUrl}/auth-callback?accessToken=${accessToken}&user=${encodedUserInfo}`;
      console.log(`Redirecting to frontend: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error during JWT creation or cookie setting:", error);
      // Tự động detect frontend URL dựa trên request
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        // Nếu không có FRONTEND_URL, tự động detect từ request
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
        const host = req.get('host') || 'localhost:3000';
        frontendUrl = `${protocol}://${host}`;
      }
      res.redirect(`${frontendUrl}/login`);
    }
  }
);

module.exports = router;

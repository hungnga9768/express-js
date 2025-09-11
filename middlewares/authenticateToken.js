/**
 * Middleware xác thực token BẮT BUỘC (bắt buộc)
 * 
 * CHỨC NĂNG:
 * - BẮT BUỘC user phải đăng nhập để truy cập admin routes
 * - Nếu có token hợp lệ: set req.user với đầy đủ thông tin
 * - Nếu không có token hoặc token hết hạn: REDIRECT /admin/login
 * - Redirect khi thất bại, không cho phép tiếp tục
 * 
 * SỬ DỤNG: Admin routes để bảo vệ admin pages
 * KHÁC VỚI: authenticateTokenOptional.js (tùy chọn, không redirect)
 */

const jwt = require("jsonwebtoken");
require("dotenv").config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

function authenticateToken(req, res, next) {
  const accessToken_admin = req.cookies?.accessToken_admin;
  const refreshToken_admin = req.cookies?.refreshToken_admin;

  if (!accessToken_admin) {
    // Không có access token, thử refresh
    return tryRefreshToken(refreshToken_admin, req, res, next);
  }

  jwt.verify(accessToken_admin, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // accessToken_admin hết hạn → thử refresh
      return tryRefreshToken(refreshToken_admin, req, res, next);
    }

    // ✅ ĐẢM BẢO USER CÓ ĐẦY ĐỦ THÔNG TIN
    req.user = {
      admin_id: user.admin_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar: user.avatar,
      role: user.role || 'support' // ✅ FALLBACK ROLE nếu không có
    };
    next();
  });
}

function tryRefreshToken(refreshToken_admin, req, res, next) {
  if (!refreshToken_admin) return res.redirect("/admin/login");

  jwt.verify(refreshToken_admin, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.redirect("/admin/login");

    // Tạo lại access token
    const userInfo = {
      admin_id: user.admin_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar: user.avatar,
      role: user.role || 'support', // ✅ FALLBACK ROLE nếu không có
    };

    const newAccessToken = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    res.cookie("accessToken_admin", newAccessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    req.user = userInfo; // Cho middleware tiếp tục
    next();
  });
}

module.exports = authenticateToken;

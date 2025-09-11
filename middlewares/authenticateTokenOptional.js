/**
 * Middleware xác thực token TÙY CHỌN (không bắt buộc)
 * 
 * CHỨC NĂNG:
 * - Kiểm tra user có đăng nhập không (nhưng không bắt buộc)
 * - Nếu có token hợp lệ: set req.user với đầy đủ thông tin
 * - Nếu không có token hoặc token hết hạn: req.user = null và TIẾP TỤC
 * - KHÔNG redirect, chỉ kiểm tra và set user info
 * 
 * SỬ DỤNG: Root level để kiểm tra trạng thái đăng nhập
 * KHÁC VỚI: authenticateToken.js (bắt buộc, redirect khi thất bại)
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
      // accessToken hết hạn → thử refresh
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
    res.locals.user = req.user;
    next();
  });
}

function tryRefreshToken(refreshToken_admin, req, res, next) {
  if (!refreshToken_admin) {
    req.user = null; // ✅ SET req.user = null
    res.locals.user = null;
    return next();
  }
  jwt.verify(refreshToken_admin, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      req.user = null; // ✅ SET req.user = null khi refresh thất bại
      res.locals.user = null;
      return next();
    }
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

    req.user = userInfo; // ✅ SET req.user cho checkAdminRole
    res.locals.user = userInfo; // Cho middleware tiếp tục
    next();
  });
}

module.exports = authenticateToken;

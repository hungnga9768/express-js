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

    res.locals.user = user;
    next();
  });
}

function tryRefreshToken(refreshToken_admin, req, res, next) {
  if (!refreshToken_admin) {
    res.locals.user = null;
    return next();
  }
  jwt.verify(refreshToken_admin, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
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
    };

    const newAccessToken = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    res.cookie("accessToken_admin", newAccessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    res.locals.user = userInfo; // Cho middleware tiếp tục
    next();
  });
}

module.exports = authenticateToken;

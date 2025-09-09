const rateLimit = require('express-rate-limit');

// 🛡️ Rate limiting cho API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests per IP per windowMs
  message: {
    error: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Rate limiting cho login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Giới hạn 5 lần login thất bại
  message: {
    error: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Rate limiting cho HSK test submission
const testSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // Giới hạn 10 lần submit test
  message: {
    error: 'Quá nhiều lần nộp bài, vui lòng thử lại sau 1 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Rate limiting cho general requests
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 300, // Giới hạn 300 requests per IP per minute
  message: {
    error: 'Quá nhiều requests, vui lòng thử lại sau 1 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  loginLimiter,
  testSubmissionLimiter,
  generalLimiter
};

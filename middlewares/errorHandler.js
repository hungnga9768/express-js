/**
 * Global Error Handler Middleware
 * Xử lý tất cả lỗi trong ứng dụng
 */

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('❌ [ErrorHandler]', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID không hợp lệ';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Dữ liệu đã tồn tại';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }

  // API response
  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Web response
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.status(statusCode).json({
      success: false,
      message: message
    });
  }

  // Render error page
  res.status(statusCode).render('error', {
    title: 'Lỗi',
    message: message,
    statusCode: statusCode,
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
};

module.exports = errorHandler;

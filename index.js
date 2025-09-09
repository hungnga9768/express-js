const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

// Set development environment if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const app = express();
const { startCronJobs } = require("./app/services/cronjobs");

// 🛡️ Security middleware (DISABLE FOR LAN DEVELOPMENT)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://fonts.googleapis.com", 
          "https://code.ionicframework.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrcElem: [
          "'self'", 
          "'unsafe-inline'", 
          "https://fonts.googleapis.com", 
          "https://code.ionicframework.com"
        ],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://code.jquery.com"
        ],
        scriptSrcAttr: ["'unsafe-inline'"], // Cho phép inline event handlers
        fontSrc: [
          "'self'", 
          "https://fonts.gstatic.com", 
          "https://code.ionicframework.com",
          "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
          "'self'", 
          "data:", 
          "https:", 
          "blob:",
          "https://res.cloudinary.com"
        ],
        connectSrc: [
          "'self'", 
          "https://api.cloudinary.com",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com"
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));
} else {
  // Minimal security for development
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    hsts: false,
    noSniff: true,
    referrerPolicy: false
  }));
}

// Rate limiting
const rateLimit = require('express-rate-limit');

// API rate limiting (cho API endpoints - chỉ áp dụng cho /api/*)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // 100 requests per 15 minutes
  message: {
    error: 'API rate limit exceeded',
    message: 'Quá nhiều requests API, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bỏ qua rate limiting cho admin panel và static files
    const shouldSkip = req.path.startsWith('/admin') || 
                      req.path.startsWith('/dist/') ||
                      req.path.startsWith('/plugins/') ||
                      req.path.startsWith('/images/') ||
                      req.path.startsWith('/public/') ||
                      req.path.includes('.css') ||
                      req.path.includes('.js') ||
                      req.path.includes('.png') ||
                      req.path.includes('.jpg') ||
                      req.path.includes('.jpeg') ||
                      req.path.includes('.gif') ||
                      req.path.includes('.ico') ||
                      req.path.includes('.svg');
    
    if (shouldSkip) {
      console.log(`✅ [APIRateLimit] Skipping rate limit for: ${req.path}`);
    }
    return shouldSkip;
  }
});

app.use('/api/', apiLimiter);

// Admin login rate limiting (chỉ cho /admin/login)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 login attempts per 15 minutes
  message: {
    error: 'Too many admin login attempts',
    message: 'Quá nhiều lần đăng nhập admin thất bại, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/admin/login', adminLoginLimiter);

// User login rate limiting (chỉ cho /api/login)
const userLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 login attempts per 15 minutes
  message: {
    error: 'Too many user login attempts',
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/login', userLoginLimiter);

// Public routes rate limiting (không phải admin và API)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // 200 requests per 15 minutes
  message: {
    error: 'Too many requests',
    message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bỏ qua rate limiting cho admin, API, static files
    const shouldSkip = req.path.startsWith('/admin') || 
                      req.path.startsWith('/api') || 
                      req.path.startsWith('/dist/') ||
                      req.path.startsWith('/plugins/') ||
                      req.path.startsWith('/images/') ||
                      req.path.startsWith('/public/') ||
                      req.path.includes('.css') ||
                      req.path.includes('.js') ||
                      req.path.includes('.png') ||
                      req.path.includes('.jpg') ||
                      req.path.includes('.jpeg') ||
                      req.path.includes('.gif') ||
                      req.path.includes('.ico') ||
                      req.path.includes('.svg') ||
                      req.path === '/favicon.ico' ||
                      req.path === '/health' ||
                      req.path === '/health/detailed';
    
    if (shouldSkip) {
      console.log(`✅ [PublicRateLimit] Skipping rate limit for: ${req.path}`);
    }
    return shouldSkip;
  }
});

// Apply public rate limiting (sau khi đã setup các middleware khác)
app.use((req, res, next) => {
  // Bỏ qua rate limiting cho admin, API routes và static files
  if (req.path.startsWith('/admin') || 
      req.path.startsWith('/api') || 
      req.path.startsWith('/dist/') ||
      req.path.startsWith('/plugins/') ||
      req.path.startsWith('/images/') ||
      req.path.startsWith('/public/') ||
      req.path.includes('.css') ||
      req.path.includes('.js') ||
      req.path.includes('.png') ||
      req.path.includes('.jpg') ||
      req.path.includes('.jpeg') ||
      req.path.includes('.gif') ||
      req.path.includes('.ico') ||
      req.path.includes('.svg') ||
      req.path === '/favicon.ico' ||
      req.path === '/health' ||
      req.path === '/health/detailed') {
    console.log(`🔐 [RateLimit] Bypassing rate limit for: ${req.path}`);
    return next();
  }
  return publicLimiter(req, res, next);
});

// 📦 Compression middleware
app.use(compression());

// ⚡ Performance monitoring (TẮT để tránh duplicate logs)
// app.use((req, res, next) => {
//   const start = Date.now();
//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
//   });
//   next();
// });

app.use(cookieParser());
// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://172.16.0.121",
      "http://192.168.1.100", // Add your LAN IP
      "http://192.168.1.*",   // Allow any LAN IP
      "http://10.*",          // Allow 10.x.x.x networks
      "http://172.16.*"       // Allow 172.16.x.x networks
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
  })
);

// Security logging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log tất cả requests
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`);
  
  // Log các request đáng ngờ
  if (req.path.includes('..') || req.path.includes('admin') || req.path.includes('wp-admin')) {
    console.warn(`⚠️ [SECURITY] Suspicious request detected: ${req.method} ${req.path} from ${ip}`);
  }
  
  next();
});

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parsing middleware với giới hạn kích thước
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Security headers middleware
app.use((req, res, next) => {
  // Thêm security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Disable Origin-Agent-Cluster for LAN development
  if (process.env.NODE_ENV !== 'production') {
    res.removeHeader('Origin-Agent-Cluster');
  }
  
  next();
});

// Phục vụ file tĩnh
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, 'dist'))); // Cho frontend

app.get("/favicon.ico", (req, res) => res.status(204).end()); // Thêm .end()

app.use(passport.initialize());
require("./config/passport")(passport);

// API routes
const routes = require("./routes"); 
app.use("/", routes);

// Global Error Handler (phải đặt sau routes)
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Không tìm thấy',
    message: 'Trang bạn tìm kiếm không tồn tại',
    statusCode: 404
  });
});

// Catch-all route cho SPA (đặt cuối cùng)
app.get('/*splat', (req, res) => { 
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  startCronJobs();
  console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
});
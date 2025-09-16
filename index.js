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
const { startCronJobs } = require("./app/services/cronjobs"); // QUAN TRỌNG cho auto-expire

// 🛡️ Security middleware (OPTIMIZED FOR LOW MEMORY)
if (process.env.NODE_ENV === 'production') {
  // Simplified helmet config for low memory environments
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
          "https://code.jquery.com",
          "https://www.youtube.com"
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
          "https://fonts.gstatic.com",
          "https://hoctiengtrung.click",
          "http://hoctiengtrung.click",
          "https://www.hoctiengtrung.click",
          "http://www.hoctiengtrung.click",
          "https://cdn.jsdelivr.net",
          "http://localhost:3000",
          "https://localhost:3000",
          "http://127.0.0.1:3000",
          "https://127.0.0.1:3000"
        ],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
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
const { ipKeyGenerator } = require('express-rate-limit');

// API rate limiting (optimized for low memory)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Further reduced for low memory hosting
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

// Rate limiting cho các endpoint cụ thể cần bảo vệ (theo IP)
const strictApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Strict limit cho các endpoint nhạy cảm
  message: {
    error: 'Too many attempts',
    message: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => `${ipKeyGenerator(req, res)}-${req.get('User-Agent') || 'unknown'}`
});

app.use('/api/register', strictApiLimiter);
app.use('/api/forgot-password', strictApiLimiter);
app.use('/api/reset-password', strictApiLimiter);
app.use('/api/auth/google', strictApiLimiter);
app.use('/api/auth/facebook', strictApiLimiter);
app.use('/api/momo/webhook', strictApiLimiter);

// Rate limiting nhẹ cho các API khác (không ảnh hưởng đến người dùng khác)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Cao hơn cho các API thông thường
  message: {
    error: 'API rate limit exceeded',
    message: 'Quá nhiều requests API, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bỏ qua rate limiting cho static files và admin
    return req.path.startsWith('/admin') || 
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
  }
});

// Áp dụng cho các API còn lại
app.use('/api/', generalApiLimiter);

// Admin login rate limiting (riêng biệt, không ảnh hưởng đến user)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Reduced to 5 login attempts per 15 minutes
  message: {
    error: 'Too many admin login attempts',
    message: 'Quá nhiều lần đăng nhập admin thất bại, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => `admin-${ipKeyGenerator(req, res)}-${req.get('User-Agent') || 'unknown'}`
});

app.use('/admin/login', adminLoginLimiter);

// User login rate limiting (riêng biệt, không ảnh hưởng đến admin)
const userLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Reduced to 5 login attempts per 15 minutes
  message: {
    error: 'Too many user login attempts',
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => `user-${ipKeyGenerator(req, res)}-${req.get('User-Agent') || 'unknown'}`
});

app.use('/api/login', userLoginLimiter);

// Public routes - KHÔNG giới hạn rate limit để người dùng truy cập tự do
// Chỉ giới hạn admin và API để bảo vệ server

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
    origin: function (origin, callback) {
      // Cho phép requests không có origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        // Development frontend
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        
        // Admin panel
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        
        // Production domains only
        "https://hoctiengtrung.click",
        "https://www.hoctiengtrung.click"
      ];
      
      // Kiểm tra origin có trong danh sách cho phép không
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
);

// Security logging middleware (SIMPLIFIED for low memory)
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Only log suspicious requests to save memory
  if (req.path.includes('..') || 
      req.path.includes('/wp-admin') || 
      req.path.includes('/wp-login') ||
      req.path.includes('/phpmyadmin') ||
      req.path.includes('/.env') ||
      req.path.includes('/config') ||
      req.path.includes('/backup')) {
    console.warn(`⚠️ [SECURITY] Suspicious request: ${req.method} ${req.path} from ${ip}`);
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

// Handle missing images from Vue.js src paths
app.get('/src/assets/images/:imageName', (req, res) => {
  const imageName = req.params.imageName; // courses-01.jpg
  const distPath = path.join(__dirname, 'dist', 'assets');
  
  // Tìm file trong dist/assets với pattern matching
  const fs = require('fs');
  try {
    const files = fs.readdirSync(distPath);
    const matchingFile = files.find(file => file.includes(imageName.split('.')[0]));
    
    if (matchingFile) {
      res.sendFile(path.join(distPath, matchingFile));
    } else {
      res.status(404).send('Image not found');
    }
  } catch (error) {
    res.status(404).send('Image not found');
  }
});

app.get("/favicon.ico", (req, res) => res.status(204).end()); // Thêm .end()

app.use(passport.initialize());
require("./config/passport")(passport);

// API routes
const routes = require("./routes"); 
app.use("/", routes);
// Catch-all route cho SPA (đặt cuối cùng)
app.get('/*splat', (req, res) => { 
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
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



app.listen(port, '0.0.0.0', () => {
  // ✅ Start cron jobs - QUAN TRỌNG cho auto-expire premium
  startCronJobs();
  console.log(`🚀 Server đang chạy trên tất cả interfaces:`);
  console.log(`   - http://localhost:${port}`);
  console.log(`   - http://127.0.0.1:${port}`);
  console.log(`   - http://192.168.222.2:${port}`);
  console.log(`   - Và tất cả IP khác trên máy này`);
});
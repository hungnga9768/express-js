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
          "https://fonts.gstatic.com",
          "https://hoctiengtrung.click",
          "http://hoctiengtrung.click",
          "https://www.hoctiengtrung.click",
          "http://www.hoctiengtrung.click"
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
  max: 2000, // 2000 requests per 15 minutes
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
        // Development
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        
        // Local network
        "http://172.16.0.121",
        "http://192.168.1.100",
        "http://192.168.222.2:3000",
        "http://192.168.222.2:5173",
        
        // Production domains
        "https://hoctiengtrung.click",
        "http://hoctiengtrung.click",
        "https://www.hoctiengtrung.click",
        "http://www.hoctiengtrung.click",
        
        // Local network patterns
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/172\.16\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/172\.20\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/
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

// Security logging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log tất cả requests
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`);
  
  // Log các request đáng ngờ (chỉ các path thực sự nguy hiểm)
  if (req.path.includes('..') || 
      req.path.includes('/wp-admin') || 
      req.path.includes('/wp-login') ||
      req.path.includes('/phpmyadmin') ||
      req.path.includes('/.env') ||
      req.path.includes('/config') ||
      req.path.includes('/backup')) {
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
  startCronJobs();
  console.log(`🚀 Server đang chạy trên tất cả interfaces:`);
  console.log(`   - http://localhost:${port}`);
  console.log(`   - http://127.0.0.1:${port}`);
  console.log(`   - http://192.168.222.2:${port}`);
  console.log(`   - Và tất cả IP khác trên máy này`);
});
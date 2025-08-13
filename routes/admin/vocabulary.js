const express = require("express");
const router = express.Router();
const vocabularyCtrl = require("../../app/controllers/admin/vocabulary.controller");
const authenticateToken = require("../../middlewares/authenticateToken");
const multer = require("multer");
const path = require("path");

// Middleware xác thực admin
router.use(authenticateToken);

// Cấu hình multer cho upload CSV
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vocabulary-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file CSV'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ...
// Routes quản lý từ vựng
router.get("/", vocabularyCtrl.index);
router.get("/add", vocabularyCtrl.createForm);
router.post("/create", vocabularyCtrl.create);
router.get("/edit/:id", vocabularyCtrl.editForm);
router.put("/update/:id", vocabularyCtrl.update);
router.delete("/delete/:id", vocabularyCtrl.delete);

// Routes import/export (đặt TRƯỚC route tham số)
router.get("/import", vocabularyCtrl.importForm);
router.post("/import", upload.single('csvFile'), vocabularyCtrl.importFromCSV);
router.get("/export", vocabularyCtrl.exportToCSV);


module.exports = router;

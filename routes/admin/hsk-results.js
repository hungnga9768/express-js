const express = require("express");
const router = express.Router();
const ctrl = require("../../app/controllers/admin/hsk-results.controller");

// Danh sách kết quả thi
router.get("/", ctrl.index);

// Chi tiết kết quả thi
router.get("/:id", ctrl.show);

// Chấm điểm thủ công
router.post("/:resultId/questions/:questionId/grade", ctrl.gradeWriting);

// Export kết quả thi
router.get("/export", ctrl.exportResults);

// Thống kê kết quả
router.get("/statistics", ctrl.statistics);

module.exports = router;

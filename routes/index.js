const express = require("express");
const router = express.Router();
const adminRoutes = require("./admin");
const authenticateTokenOptional = require("../middlewares/authenticateTokenOptional");
const apiRoutes = require("./api");
router.use(authenticateTokenOptional);

// Admin routes
router.use("/admin", adminRoutes); // Trang admin

// API routes
router.use("/api/hsk", require("./api/hsk"));

// API cho mobile/web client
router.use("/api", apiRoutes);

module.exports = router;

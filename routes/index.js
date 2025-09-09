const express = require("express");
const router = express.Router();
const adminRoutes = require("./admin");
const authenticateTokenOptional = require("../middlewares/authenticateTokenOptional");
const apiRoutes = require("./api");

// Health check routes (không cần authentication)
router.use("/", require("./health"));

router.use(authenticateTokenOptional);

// Admin routes
router.use("/admin", adminRoutes); // Trang admin

// API cho mobile/web client
router.use("/api", apiRoutes);

module.exports = router;

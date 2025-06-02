const express = require("express");
const router = express.Router();
const adminRoutes = require("./admin");
const authenticateTokenOptional = require("../middlewares/authenticateTokenOptional");
const apiRoutes = require("./api");
router.use(authenticateTokenOptional);
router.use("/admin", adminRoutes); // Trang admin

router.use("/api", apiRoutes); // API cho mobile/web client

module.exports = router;

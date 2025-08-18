const express = require("express");
const router = express.Router();
const gameCtrl = require("../../app/controllers/api/game.controller");
const authenticateTokenUser = require("../../middlewares/authAPI");

// ==================== GAME LISTING ====================
router.get("/", gameCtrl.getAllGames);
router.get("/search", gameCtrl.searchGames);
router.get("/recommended", authenticateTokenUser, gameCtrl.getRecommendedGames);
router.get("/type/:type", gameCtrl.getGamesByType);

// ==================== USER PROGRESS ====================
router.get("/user/progress", authenticateTokenUser, gameCtrl.getUserProgress);
router.get("/user/game-stats", authenticateTokenUser, gameCtrl.getUserGameStats);
router.post("/user/progress/update", authenticateTokenUser, gameCtrl.updateUserProgress);

// ==================== ACHIEVEMENTS & BADGES ====================
router.get("/user/badges", authenticateTokenUser, gameCtrl.getUserBadges);
router.get("/achievements", gameCtrl.getAllAchievements);

// ==================== STATISTICS ====================
router.get("/stats/global", gameCtrl.getGlobalStats);

// ==================== GAME SESSIONS ====================
router.post("/:game_id/start", authenticateTokenUser, gameCtrl.startGameSession);
router.post("/sessions/:session_id/end", authenticateTokenUser, gameCtrl.endGameSession);
router.get("/sessions/current", authenticateTokenUser, gameCtrl.getCurrentSession);

// ==================== GAME DATA ====================
router.get("/:game_id/data", authenticateTokenUser, gameCtrl.getGameData);
router.get("/:game_id/data/public", gameCtrl.getGameData);

// ==================== LEADERBOARD ====================
router.get("/:game_id/leaderboard", gameCtrl.getLeaderboard);
router.get("/:game_id/rank", authenticateTokenUser, gameCtrl.getUserRank);

// ==================== GAME BY ID (Đặt cuối để tránh xung đột) ====================
router.get("/:id", gameCtrl.getGameById);

module.exports = router;

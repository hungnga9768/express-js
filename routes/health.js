const express = require('express');
const router = express.Router();
const pool = require('../connect-mysql');

/**
 * Health Check Route
 * Sử dụng cho monitoring và load balancer
 */
router.get('/health', async (req, res) => {
  try {
    // Kiểm tra database connection
    const [dbResult] = await pool.query('SELECT 1 as health');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbResult[0].health === 1 ? 'connected' : 'disconnected',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        }
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Detailed Health Check
 * Kiểm tra chi tiết các service
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database
    const [dbResult] = await pool.query('SELECT COUNT(*) as count FROM users');
    const dbTime = Date.now() - startTime;
    
    const detailedStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: dbTime + 'ms',
          userCount: dbResult[0].count
        },
        memory: {
          status: 'healthy',
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        },
        uptime: {
          status: 'healthy',
          uptime: process.uptime(),
          uptimeFormatted: formatUptime(process.uptime())
        }
      }
    };

    res.status(200).json(detailedStatus);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = router;

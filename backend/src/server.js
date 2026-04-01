const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const database = require('./db/database');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  logger.info('Created data directory');
}

async function startServer() {
  try {
    // Initialize database
    await database.initialize();
    logger.info('Database initialized');

    // Get port from environment or config
    const PORT = process.env.PORT || config.port || 3000;

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('='.repeat(60));
      logger.info('🎯 Sports Predictor Pro v2.0 - PRODUCTION MODE');
      logger.info('='.repeat(60));
      logger.info(`📡 Server running on port: ${PORT}`);
      logger.info(`✅ Status: Online - AI-Powered Predictions`);
      logger.info(`📅 Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
      logger.info(`🤖 AI Features: Enabled (Fallback Mode)`);
      logger.info(`📊 Accuracy Tracking: Active`);
      logger.info(`💡 Insights Engine: Running`);
      logger.info(`🌐 Public URL: ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}`);
      logger.info('='.repeat(60));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
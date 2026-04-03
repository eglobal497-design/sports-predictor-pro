const app = require('./app');
const logger = require('./utils/logger');
const database = require('./db/database');

// Get port from environment variable (Render sets this)
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database (will use memory or file-based depending on environment)
    await database.initialize();
    logger.info('Database initialized');

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
      logger.info(`🎯 Dual Accumulators: 3x & 12x`);
      logger.info(`🌍 Timezone: Africa/Nairobi (EAT)`);
      logger.info(`💰 Currency: UGX`);
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
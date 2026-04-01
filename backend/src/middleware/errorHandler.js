const logger = require('../utils/logger');

class ErrorHandler {
  static handle(error, req, res, next) {
    logger.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });

    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';

    res.status(status).json({
      error: message,
      timestamp: new Date().toISOString(),
      path: req.url
    });
  }

  static notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  }
}

module.exports = ErrorHandler;
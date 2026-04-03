const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const predictionController = require('./controllers/predictionController');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const cacheMiddleware = require('./middleware/cache');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Performance middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend');
console.log('✅ Frontend found at:', frontendPath);
app.use(express.static(frontendPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// ============================================
// API ROUTES
// ============================================

// Health and Status Routes
app.get('/health', (req, res, next) => predictionController.healthCheck(req, res, next));
app.get('/api/status', (req, res, next) => predictionController.getStatus(req, res, next));
app.get('/api/stats', (req, res, next) => predictionController.getPredictionStats(req, res, next));

// Main Prediction Routes
app.get('/api/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getPredictions(req, res, next));
app.get('/api/best-picks', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getBestPicks(req, res, next));
app.get('/api/safe-picks', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getSafePicks(req, res, next));
app.get('/api/elite-picks', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getElitePicks(req, res, next));
app.get('/api/bet-of-the-day', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getBetOfTheDay(req, res, next));
app.get('/api/matches-of-the-day', rateLimiter, cacheMiddleware(3600), (req, res, next) => predictionController.getMatchesOfTheDay(req, res, next));

// Markets Routes
app.get('/api/all-markets', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getAllMarkets(req, res, next));
app.get('/api/markets/:sport', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getMarketsBySport(req, res, next));

// Accumulator Routes (Football & Basketball only)
app.get('/api/accumulator-recommendations', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getAccumulatorRecommendations(req, res, next));
app.get('/api/safe-accumulator', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getSafeAccumulator(req, res, next));
app.get('/api/value-accumulator', rateLimiter, cacheMiddleware(1800), (req, res, next) => predictionController.getValueAccumulator(req, res, next));

// Sport-specific Routes
app.get('/api/football/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => {
  req.params = { sport: 'football' };
  predictionController.getPredictionsBySport(req, res, next);
});

app.get('/api/basketball/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => {
  req.params = { sport: 'basketball' };
  predictionController.getPredictionsBySport(req, res, next);
});

app.get('/api/tennis/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => {
  req.params = { sport: 'tennis' };
  predictionController.getPredictionsBySport(req, res, next);
});

app.get('/api/volleyball/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => {
  req.params = { sport: 'volleyball' };
  predictionController.getPredictionsBySport(req, res, next);
});

app.get('/api/tabletennis/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => {
  req.params = { sport: 'tabletennis' };
  predictionController.getPredictionsBySport(req, res, next);
});

app.get('/api/handball/predictions', rateLimiter, cacheMiddleware(1800), (req, res, next) => {
  req.params = { sport: 'handball' };
  predictionController.getPredictionsBySport(req, res, next);
});

// Analytics Routes
app.get('/api/accuracy', rateLimiter, (req, res, next) => predictionController.getAccuracy(req, res, next));
app.get('/api/insights', rateLimiter, cacheMiddleware(3600), (req, res, next) => predictionController.getInsights(req, res, next));

// External Predictions Route (POST)
app.post('/api/external-predictions', rateLimiter, (req, res, next) => predictionController.getExternalPredictions(req, res, next));

// ============================================
// FRONTEND ROUTES
// ============================================

// Serve main frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Handle all other routes - serve index.html for client-side routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Serve index.html for all other routes
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================
// ERROR HANDLING (Must be last)
// ============================================

// 404 handler
app.use(errorHandler.notFound);

// Global error handler
app.use(errorHandler.handle);

module.exports = app;
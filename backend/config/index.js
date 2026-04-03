require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  apis: {
    football: {
      key: process.env.RAPIDAPI_KEY,
      host: process.env.RAPIDAPI_HOST,
      baseUrl: 'https://api-football-v1.p.rapidapi.com/v3'
    },
    odds: {
      key: process.env.THEODDS_API_KEY,
      baseUrl: 'https://api.the-odds-api.com/v4'
    }
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    maxTokens: 150
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 1800,
    checkPeriod: 600
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  database: {
    path: process.env.DB_PATH || './data/predictions.db'
  }
};
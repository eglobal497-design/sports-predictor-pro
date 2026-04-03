// config.js
require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // API Keys
    apis: {
        football: {
            baseUrl: 'https://api.football-data.org/v4',
            key: process.env.FOOTBALL_API_KEY || '',
            host: 'api.football-data.org'
        },
        odds: {
            key: process.env.THEODDS_API_KEY || '',
            baseUrl: 'https://api.the-odds-api.com/v4'
        },
        basketball: {
            key: process.env.BASKETBALL_API_KEY || '',
            host: process.env.BASKETBALL_API_HOST || ''
        },
        tennis: {
            key: process.env.TENNIS_API_KEY || '',
            host: process.env.TENNIS_API_HOST || ''
        }
    },

    // Cache settings
    cache: {
        ttl: 1800, // 30 minutes
        checkPeriod: 600 // 10 minutes
    },

    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },

    // AI Settings
    ai: {
        enabled: true,
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.7
    },

    // Prediction thresholds
    thresholds: {
        elite: 85,
        high: 75,
        medium: 65,
        low: 55
    },

    // Helper functions
    isOddsApiConfigured: function () {
        return !!(this.apis.odds.key && this.apis.odds.key.length > 0);
    },

    isFootballApiConfigured: function () {
        return !!(this.apis.football.key && this.apis.football.key.length > 0);
    },

    isBasketballApiConfigured: function () {
        return !!(this.apis.basketball.key && this.apis.basketball.key.length > 0);
    },

    isTennisApiConfigured: function () {
        return !!(this.apis.tennis.key && this.apis.tennis.key.length > 0);
    },

    getApiStatus: function () {
        return {
            football: this.isFootballApiConfigured(),
            odds: this.isOddsApiConfigured(),
            basketball: this.isBasketballApiConfigured(),
            tennis: this.isTennisApiConfigured()
        };
    }
};

// Validate critical configuration
if (!config.apis.odds.key) {
    console.warn('⚠️  Warning: THEODDS_API_KEY not set. Some sports predictions will be limited.');
}

module.exports = config;
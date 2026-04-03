const predictionService = require('./predictionService');
const aiHelper = require('../utils/aiHelper');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');

class InsightsService {
  async getInsights() {
    const cacheKey = 'insights';
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const predictions = await predictionService.getAllPredictions();
      const insights = await aiHelper.generateInsights(predictions);
      cacheManager.set(cacheKey, insights, 3600);
      return insights;
    } catch (error) {
      logger.error('Error generating insights:', error);
      return ['Unable to generate insights at this time.'];
    }
  }
}

module.exports = new InsightsService();
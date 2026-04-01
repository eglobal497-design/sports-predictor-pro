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

      if (predictions.length === 0) {
        return ['No predictions available for today. Check back later for insights.'];
      }

      const insights = await aiHelper.generateInsights(predictions);
      cacheManager.set(cacheKey, insights, 3600); // Cache for 1 hour

      return insights;
    } catch (error) {
      logger.error('Error generating insights:', error);
      return ['Unable to generate insights at this time.'];
    }
  }
}

module.exports = new InsightsService();
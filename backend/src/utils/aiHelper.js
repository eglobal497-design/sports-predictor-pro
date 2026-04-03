const logger = require('./logger');

class AIHelper {
  constructor() {
    this.cache = new Map();
    logger.info('AI Helper initialized with fallback explanations (OpenAI disabled)');
  }

  async generateExplanation(predictionData) {
    const cacheKey = `${predictionData.homeTeam}-${predictionData.awayTeam}-${predictionData.sport}-${predictionData.market}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const explanation = this.getFallbackExplanation(predictionData);
    this.cache.set(cacheKey, explanation);
    setTimeout(() => this.cache.delete(cacheKey), 3600000);

    return explanation;
  }

  async generateInsights(predictions) {
    return this.getFallbackInsights(predictions);
  }

  getFallbackExplanation(data) {
    const factors = [];

    if (data.homeForm && data.awayForm && data.homeForm !== 'N/A' && data.awayForm !== 'N/A') {
      const homeFormNum = parseFloat(data.homeForm);
      const awayFormNum = parseFloat(data.awayForm);
      const diff = homeFormNum - awayFormNum;

      if (diff > 1.5) {
        factors.push(`${data.homeTeam} has significantly better form (${data.homeForm}/10 vs ${data.awayForm}/10)`);
      } else if (diff < -1.5) {
        factors.push(`${data.awayTeam} has significantly better form (${data.awayForm}/10 vs ${data.homeForm}/10)`);
      }
    }

    if (data.h2h) {
      const [homeWins, draws, awayWins] = data.h2h.split('-');
      if (parseInt(homeWins) > parseInt(awayWins)) {
        factors.push(`${data.homeTeam} leads head-to-head (${data.h2h})`);
      } else if (parseInt(awayWins) > parseInt(homeWins)) {
        factors.push(`${data.awayTeam} leads head-to-head (${data.h2h})`);
      }
    }

    if (factors.length > 0) {
      return `Based on ${factors.join(' and ')}, ${data.prediction.toLowerCase()} is the likely outcome.`;
    }

    return `${data.prediction} is predicted with ${data.probability}% probability based on statistical analysis.`;
  }

  getFallbackInsights(predictions) {
    const insights = [];

    if (!predictions || predictions.length === 0) {
      return ['No predictions available for today. Check back later.'];
    }

    const highConfidence = predictions.filter(p => p.confidence === 'Very High' || p.confidence === 'High');
    if (highConfidence.length > 0) {
      insights.push(`🔮 ${highConfidence.length} high-confidence predictions identified.`);
    }

    const sports = [...new Set(predictions.map(p => p.sport))];
    insights.push(`📊 Analysis covers ${sports.length} sports with ${predictions.length} total predictions.`);

    const avgProb = (predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length).toFixed(1);
    insights.push(`📈 Average prediction confidence: ${avgProb}%.`);

    return insights;
  }
}

module.exports = new AIHelper();
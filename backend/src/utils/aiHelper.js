const logger = require('./logger');

class AIHelper {
  constructor() {
    this.cache = new Map();
    logger.info('AI Helper initialized with fallback explanations (OpenAI disabled)');
  }

  async generateExplanation(predictionData) {
    // Check cache first
    const cacheKey = `${predictionData.homeTeam}-${predictionData.awayTeam}-${predictionData.sport}-${predictionData.market}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const explanation = this.getFallbackExplanation(predictionData);

    // Cache the explanation
    this.cache.set(cacheKey, explanation);
    setTimeout(() => this.cache.delete(cacheKey), 3600000); // Cache for 1 hour

    return explanation;
  }

  async generateInsights(predictions) {
    return this.getFallbackInsights(predictions);
  }

  getFallbackExplanation(data) {
    const factors = [];

    // Form factors
    if (data.homeForm && data.awayForm && data.homeForm !== 'N/A' && data.awayForm !== 'N/A') {
      const homeFormNum = parseFloat(data.homeForm);
      const awayFormNum = parseFloat(data.awayForm);
      const diff = homeFormNum - awayFormNum;

      if (diff > 1.5) {
        factors.push(`${data.homeTeam} has significantly better form (${data.homeForm}/10 vs ${data.awayForm}/10)`);
      } else if (diff < -1.5) {
        factors.push(`${data.awayTeam} has significantly better form (${data.awayForm}/10 vs ${data.homeForm}/10)`);
      } else if (Math.abs(diff) <= 1.5 && diff !== 0) {
        factors.push(`both teams have similar form (${data.homeForm}/10 vs ${data.awayForm}/10)`);
      }
    }

    // H2H factors
    if (data.h2h) {
      const [homeWins, draws, awayWins] = data.h2h.split('-');
      const homeWinsNum = parseInt(homeWins);
      const awayWinsNum = parseInt(awayWins);

      if (homeWinsNum > awayWinsNum) {
        factors.push(`${data.homeTeam} leads in head-to-head meetings (${data.h2h})`);
      } else if (awayWinsNum > homeWinsNum) {
        factors.push(`${data.awayTeam} leads in head-to-head meetings (${data.h2h})`);
      } else if (homeWinsNum === awayWinsNum && homeWinsNum > 0) {
        factors.push(`head-to-head record is evenly matched (${data.h2h})`);
      }
    }

    // Odds factors
    if (data.odds) {
      const oddsNum = parseFloat(data.odds);
      if (oddsNum < 2.0) {
        factors.push(`odds strongly favor this outcome (${data.odds})`);
      } else if (oddsNum < 3.0) {
        factors.push(`odds moderately favor this outcome (${data.odds})`);
      }
    }

    // Market-specific factors
    if (data.market === 'Both Teams to Score') {
      if (data.homeForm && data.awayForm) {
        const homeAvg = parseFloat(data.homeForm);
        const awayAvg = parseFloat(data.awayForm);
        if (homeAvg > 7 && awayAvg > 7) {
          factors.push(`both teams are in good attacking form`);
        }
      }
    }

    if (data.market === 'Total Goals' && data.prediction.includes('Over')) {
      if (data.homeForm && data.awayForm) {
        const avgForm = (parseFloat(data.homeForm) + parseFloat(data.awayForm)) / 2;
        if (avgForm > 7) {
          factors.push(`both teams have strong attacking records`);
        }
      }
    }

    if (factors.length > 0) {
      return `Based on ${factors.join(' and ')}, ${data.prediction.toLowerCase()} is the likely outcome.`;
    }

    // Default explanations based on market
    switch (data.market) {
      case 'Match Winner':
        return `${data.prediction} is predicted with ${data.probability}% probability based on statistical analysis of recent form and historical data.`;
      case 'Double Chance':
        return `Combined probability of ${data.probability}% for this double chance outcome based on team strength and form analysis.`;
      case 'Both Teams to Score':
        return `${data.probability}% chance both teams will score based on attacking and defensive records.`;
      case 'Total Goals':
        return `${data.probability}% probability for ${data.prediction.toLowerCase()} based on average goals per game analysis.`;
      case 'Half-Time/Full-Time':
        return `${data.probability}% chance for this half-time/full-time combination based on team consistency patterns.`;
      case 'Moneyline':
        return `${data.prediction} is favored with ${data.probability}% probability based on current odds and team performance.`;
      case 'Point Spread':
        return `${data.probability}% chance to cover the spread based on team performance metrics.`;
      case 'Total Points':
        return `${data.probability}% probability for ${data.prediction.toLowerCase()} based on average scoring patterns.`;
      default:
        return `${data.prediction} is predicted with ${data.probability}% probability based on current data analysis.`;
    }
  }

  getFallbackInsights(predictions) {
    const insights = [];

    if (!predictions || predictions.length === 0) {
      return ['No predictions available for today. Check back later for insights.'];
    }

    // Count predictions by sport
    const sportCount = {};
    predictions.forEach(p => {
      sportCount[p.sport] = (sportCount[p.sport] || 0) + 1;
    });

    const topSport = Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0];
    if (topSport) {
      insights.push(`📊 ${topSport[0]} has the most predictions today with ${topSport[1]} matches.`);
    }

    // High confidence predictions
    const highConfidence = predictions.filter(p => p.confidence === 'Very High' || p.confidence === 'High');
    if (highConfidence.length > 0) {
      insights.push(`🎯 ${highConfidence.length} high-confidence predictions identified (${highConfidence.map(p => p.prediction.split(' to')[0]).slice(0, 3).join(', ')}).`);
    }

    // Average probability
    const avgProb = (predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length).toFixed(1);
    insights.push(`📈 Average prediction confidence across all markets: ${avgProb}%.`);

    // Market insights
    const marketCount = {};
    predictions.forEach(p => {
      if (p.market) {
        marketCount[p.market] = (marketCount[p.market] || 0) + 1;
      }
    });

    const topMarkets = Object.entries(marketCount).sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (topMarkets.length > 0) {
      insights.push(`💡 Most analyzed markets: ${topMarkets.map(m => m[0]).join(' and ')}.`);
    }

    // Basketball-specific insights
    const basketballPredictions = predictions.filter(p => p.sport === 'Basketball');
    if (basketballPredictions.length > 0) {
      const avgBasketballProb = (basketballPredictions.reduce((sum, p) => sum + p.probability, 0) / basketballPredictions.length).toFixed(1);
      insights.push(`🏀 Basketball predictions average ${avgBasketballProb}% confidence across ${basketballPredictions.length} games.`);
    }

    // Football-specific insights
    const footballPredictions = predictions.filter(p => p.sport === 'Football');
    if (footballPredictions.length > 0) {
      const bttsPredictions = footballPredictions.filter(p => p.market === 'Both Teams to Score');
      if (bttsPredictions.length > 0) {
        const avgBtts = (bttsPredictions.reduce((sum, p) => sum + p.probability, 0) / bttsPredictions.length).toFixed(1);
        insights.push(`⚽ Both Teams to Score markets average ${avgBtts}% probability today.`);
      }
    }

    // Ensure we have at least 3 insights
    if (insights.length < 3) {
      insights.push(`🔄 Data refreshes every 30 minutes with real-time odds and statistics.`);
      insights.push(`📊 Track prediction accuracy over time in the Accuracy Dashboard.`);
    }

    return insights.slice(0, 5);
  }
}

module.exports = new AIHelper();
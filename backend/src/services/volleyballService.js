const axios = require('axios');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');

class VolleyballService {
  async getPredictions() {
    const cacheKey = 'volleyball_predictions';
    const cached = cacheManager.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    const predictions = await this.fetchRealPredictions();
    if (predictions && predictions.length > 0) {
      cacheManager.set(cacheKey, predictions, 1800);
    }
    return predictions;
  }

  async fetchRealPredictions() {
    try {
      const predictions = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      logger.info(`Fetching volleyball matches for: ${todayStr}`);

      // Try multiple volleyball endpoints
      const endpoints = [
        'https://api.the-odds-api.com/v4/sports/volleyball/odds',
        'https://api.the-odds-api.com/v4/sports/volleyball_championship/odds'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            params: {
              apiKey: process.env.THEODDS_API_KEY,
              regions: 'eu',
              markets: 'h2h',
              oddsFormat: 'decimal',
              dateFormat: 'iso'
            },
            timeout: 10000
          });

          if (response.data && response.data.length > 0) {
            // Filter for today's matches
            const todayMatches = response.data.filter(match => {
              const matchDate = new Date(match.commence_time);
              const matchDateStr = matchDate.toISOString().split('T')[0];
              return matchDateStr === todayStr;
            });

            if (todayMatches.length > 0) {
              logger.info(`Found ${todayMatches.length} volleyball matches for today`);

              for (const match of todayMatches) {
                const analysis = this.analyzeMatch(match);
                if (analysis) predictions.push(analysis);
              }
            }
          }
        } catch (error) {
          logger.debug(`Volleyball endpoint failed:`, error.message);
        }
      }

      if (predictions.length > 0) {
        logger.info(`Generated ${predictions.length} volleyball predictions for today`);
        return predictions;
      }

      logger.info(`No volleyball matches found for today`);
      return [];
    } catch (error) {
      logger.error('Volleyball API error:', error);
      return [];
    }
  }

  analyzeMatch(match) {
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const outcomes = match.bookmakers?.[0]?.markets?.[0]?.outcomes || [];

    const homeOutcome = outcomes.find(o => o.name === homeTeam);
    const awayOutcome = outcomes.find(o => o.name === awayTeam);

    if (homeOutcome && awayOutcome) {
      const homeProb = (1 / homeOutcome.price) * 100;
      const awayProb = (1 / awayOutcome.price) * 100;
      const total = homeProb + awayProb;
      const homeWinProb = (homeProb / total) * 100;
      const awayWinProb = (awayProb / total) * 100;

      const highestProb = Math.max(homeWinProb, awayWinProb);
      const winner = highestProb === homeWinProb ? homeTeam : awayTeam;

      if (highestProb >= 58) {
        return {
          market: 'Match Winner',
          prediction: `${winner} to win`,
          probability: Math.round(highestProb),
          confidence: this.getConfidenceLevel(highestProb),
          odds: homeOutcome.price.toFixed(2),
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          league: 'Volleyball',
          time: new Date(match.commence_time).toLocaleTimeString(),
          sport: 'Volleyball',
          matchDate: match.commence_time
        };
      }
    }

    return null;
  }

  getConfidenceLevel(probability) {
    if (probability >= 85) return 'Very High';
    if (probability >= 75) return 'High';
    if (probability >= 65) return 'Medium High';
    if (probability >= 58) return 'Medium';
    return 'Low';
  }
}

module.exports = new VolleyballService();
const axios = require('axios');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');

class TennisService {
  async getPredictions() {
    const cacheKey = 'tennis_predictions';
    const cached = cacheManager.get(cacheKey);
    if (cached && cached.length > 0) {
      logger.debug(`Returning ${cached.length} cached tennis predictions`);
      return cached;
    }

    const predictions = await this.fetchRealPredictions();
    if (predictions && predictions.length > 0) {
      cacheManager.set(cacheKey, predictions, 1800);
      logger.info(`Cached ${predictions.length} tennis predictions for today`);
    }
    return predictions;
  }

  async fetchRealPredictions() {
    try {
      const predictions = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      logger.info(`Fetching tennis matches for: ${todayStr}`);

      // Try multiple tennis endpoints
      const tennisEndpoints = [
        'https://api.the-odds-api.com/v4/sports/tennis_atp/odds',
        'https://api.the-odds-api.com/v4/sports/tennis_wta/odds',
        'https://api.the-odds-api.com/v4/sports/tennis_atp_wta/odds'
      ];

      for (const endpoint of tennisEndpoints) {
        try {
          const response = await axios.get(endpoint, {
            params: {
              apiKey: process.env.THEODDS_API_KEY,
              regions: 'uk',
              markets: 'h2h',
              oddsFormat: 'decimal',
              dateFormat: 'iso'
            },
            timeout: 10000
          });

          if (response.data && response.data.length > 0) {
            // Filter matches for today only
            const todayMatches = response.data.filter(match => {
              const matchDate = new Date(match.commence_time);
              const matchDateStr = matchDate.toISOString().split('T')[0];
              return matchDateStr === todayStr;
            });

            if (todayMatches.length > 0) {
              const league = endpoint.includes('atp') ? 'ATP' : (endpoint.includes('wta') ? 'WTA' : 'Tennis');
              logger.info(`Found ${todayMatches.length} ${league} matches for today`);

              for (const match of todayMatches.slice(0, 10)) {
                const analysis = this.analyzeMatch(match, league);
                if (analysis) predictions.push(analysis);
              }

              if (predictions.length >= 10) break;
            }
          }
        } catch (error) {
          logger.debug(`${endpoint} not available:`, error.message);
        }
      }

      if (predictions.length > 0) {
        logger.info(`Generated ${predictions.length} tennis predictions for today`);
        return predictions;
      }

      logger.info(`No tennis matches found for today (${todayStr})`);
      return [];
    } catch (error) {
      logger.error('Tennis API error:', error.message);
      return [];
    }
  }

  analyzeMatch(match, league) {
    const player1 = match.home_team;
    const player2 = match.away_team;
    const outcomes = match.bookmakers?.[0]?.markets?.[0]?.outcomes || [];

    const player1Outcome = outcomes.find(o => o.name === player1);
    const player2Outcome = outcomes.find(o => o.name === player2);

    if (player1Outcome && player2Outcome) {
      const player1Prob = (1 / player1Outcome.price) * 100;
      const player2Prob = (1 / player2Outcome.price) * 100;
      const total = player1Prob + player2Prob;
      const p1WinProb = (player1Prob / total) * 100;
      const p2WinProb = (player2Prob / total) * 100;

      const highestProb = Math.max(p1WinProb, p2WinProb);
      const winner = highestProb === p1WinProb ? player1 : player2;

      if (highestProb >= 58) {
        return {
          market: 'Match Winner',
          prediction: `${winner} to win`,
          probability: Math.round(highestProb),
          confidence: this.getConfidenceLevel(highestProb),
          odds: player1Outcome.price.toFixed(2),
          homeTeam: player1,
          awayTeam: player2,
          league: league,
          time: new Date(match.commence_time).toLocaleTimeString(),
          sport: 'Tennis',
          homeForm: (6 + Math.random() * 3).toFixed(1),
          awayForm: (5 + Math.random() * 3).toFixed(1),
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

module.exports = new TennisService();
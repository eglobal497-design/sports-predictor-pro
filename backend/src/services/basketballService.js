const axios = require('axios');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');

class BasketballService {
  async getPredictions() {
    const cacheKey = 'basketball_predictions';
    const cached = cacheManager.get(cacheKey);
    if (cached && cached.length > 0) {
      logger.debug(`Returning ${cached.length} cached basketball predictions`);
      return cached;
    }

    const predictions = await this.fetchRealPredictions();
    if (predictions && predictions.length > 0) {
      cacheManager.set(cacheKey, predictions, 1800);
      logger.info(`Cached ${predictions.length} basketball predictions for today`);
    }
    return predictions;
  }

  async fetchRealPredictions() {
    try {
      const allPredictions = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      logger.info(`Fetching basketball matches for: ${todayStr}`);

      // Fetch NBA games
      try {
        const nbaResponse = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
          params: {
            apiKey: process.env.THEODDS_API_KEY,
            regions: 'us',
            markets: 'h2h',
            oddsFormat: 'american',
            dateFormat: 'iso'
          },
          timeout: 15000
        });

        if (nbaResponse.data && nbaResponse.data.length > 0) {
          // Filter for today's games
          const todayGames = nbaResponse.data.filter(game => {
            const gameDate = new Date(game.commence_time);
            const gameDateStr = gameDate.toISOString().split('T')[0];
            return gameDateStr === todayStr;
          });

          if (todayGames.length > 0) {
            logger.info(`Found ${todayGames.length} NBA games for today`);

            for (const game of todayGames) {
              const analysis = this.analyzeGameWithMarkets(game, 'NBA');
              if (analysis && analysis.length > 0) {
                allPredictions.push(...analysis);
              }
            }
          } else {
            logger.info(`No NBA games scheduled for today`);
          }
        }
      } catch (error) {
        logger.error('NBA API error:', error.message);
      }

      // Fetch EuroLeague games
      try {
        const euroResponse = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_euroleague/odds', {
          params: {
            apiKey: process.env.THEODDS_API_KEY,
            regions: 'eu',
            markets: 'h2h',
            oddsFormat: 'decimal',
            dateFormat: 'iso'
          },
          timeout: 15000
        });

        if (euroResponse.data && euroResponse.data.length > 0) {
          // Filter for today's games
          const todayGames = euroResponse.data.filter(game => {
            const gameDate = new Date(game.commence_time);
            const gameDateStr = gameDate.toISOString().split('T')[0];
            return gameDateStr === todayStr;
          });

          if (todayGames.length > 0) {
            logger.info(`Found ${todayGames.length} EuroLeague games for today`);

            for (const game of todayGames) {
              const analysis = this.analyzeGameWithMarkets(game, 'EuroLeague');
              if (analysis && analysis.length > 0) {
                allPredictions.push(...analysis);
              }
            }
          } else {
            logger.info(`No EuroLeague games scheduled for today`);
          }
        }
      } catch (error) {
        logger.debug('EuroLeague data not available:', error.message);
      }

      if (allPredictions.length > 0) {
        logger.info(`Generated ${allPredictions.length} basketball predictions for today`);
        return allPredictions;
      }

      logger.info(`No basketball games found for today (${todayStr})`);
      return [];
    } catch (error) {
      logger.error('Basketball API error:', error.message);
      return [];
    }
  }

  analyzeGameWithMarkets(game, league) {
    const predictions = [];
    const homeTeam = game.home_team;
    const awayTeam = game.away_team;
    const markets = game.bookmakers?.[0]?.markets || [];

    // Moneyline (Match Winner)
    const moneylineMarket = markets.find(m => m.key === 'h2h');
    if (moneylineMarket && moneylineMarket.outcomes) {
      const homeOutcome = moneylineMarket.outcomes.find(o => o.name === homeTeam);
      const awayOutcome = moneylineMarket.outcomes.find(o => o.name === awayTeam);

      if (homeOutcome && awayOutcome) {
        let homeProb, awayProb;

        if (league === 'NBA') {
          homeProb = this.americanToProbability(homeOutcome.price);
          awayProb = this.americanToProbability(awayOutcome.price);
        } else {
          homeProb = (1 / homeOutcome.price) * 100;
          awayProb = (1 / awayOutcome.price) * 100;
        }

        const total = homeProb + awayProb;
        const homeWinProb = (homeProb / total) * 100;
        const awayWinProb = (awayProb / total) * 100;

        if (homeWinProb >= 58) {
          predictions.push({
            market: 'Moneyline',
            prediction: `${homeTeam} to win`,
            probability: Math.round(homeWinProb),
            confidence: this.getConfidenceLevel(homeWinProb),
            odds: this.formatOdds(homeOutcome.price, league),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            league: league,
            time: new Date(game.commence_time).toLocaleTimeString(),
            sport: 'Basketball',
            homeForm: (6 + Math.random() * 3).toFixed(1),
            awayForm: (5 + Math.random() * 3).toFixed(1),
            matchDate: game.commence_time
          });
        }

        if (awayWinProb >= 58) {
          predictions.push({
            market: 'Moneyline',
            prediction: `${awayTeam} to win`,
            probability: Math.round(awayWinProb),
            confidence: this.getConfidenceLevel(awayWinProb),
            odds: this.formatOdds(awayOutcome.price, league),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            league: league,
            time: new Date(game.commence_time).toLocaleTimeString(),
            sport: 'Basketball',
            homeForm: (6 + Math.random() * 3).toFixed(1),
            awayForm: (5 + Math.random() * 3).toFixed(1),
            matchDate: game.commence_time
          });
        }
      }
    }

    return predictions;
  }

  americanToProbability(odds) {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }

  formatOdds(odds, league) {
    if (league === 'NBA') {
      return odds > 0 ? `+${odds}` : `${odds}`;
    }
    return odds.toFixed(2);
  }

  getConfidenceLevel(probability) {
    if (probability >= 85) return 'Very High';
    if (probability >= 75) return 'High';
    if (probability >= 65) return 'Medium High';
    if (probability >= 58) return 'Medium';
    return 'Low';
  }
}

module.exports = new BasketballService();
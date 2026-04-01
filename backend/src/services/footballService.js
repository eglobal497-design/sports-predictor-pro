const axios = require('axios');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');
const { Mutex } = require('async-mutex');

const fetchMutex = new Mutex();

class FootballService {
  constructor() {
    this.cacheKey = 'football_predictions';
    this.lastSuccessfulFetch = null;
  }

  async getPredictions() {
    const cached = cacheManager.get(this.cacheKey);
    if (cached && cached.length > 0) {
      logger.debug(`Returning ${cached.length} cached football predictions`);
      return cached;
    }

    const release = await fetchMutex.acquire();
    try {
      const doubleCheck = cacheManager.get(this.cacheKey);
      if (doubleCheck && doubleCheck.length > 0) {
        return doubleCheck;
      }

      const predictions = await this.fetchRealPredictions();
      if (predictions && predictions.length > 0) {
        cacheManager.set(this.cacheKey, predictions, 1800);
        this.lastSuccessfulFetch = new Date();
        logger.info(`Cached ${predictions.length} football predictions for today`);
      }
      return predictions;
    } finally {
      release();
    }
  }

  async fetchRealPredictions() {
    try {
      const allPredictions = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      logger.info(`Fetching football matches for: ${todayStr}`);

      // Try multiple endpoints with today's date filter
      const endpoints = [
        { url: 'https://api.the-odds-api.com/v4/sports/soccer/odds', markets: 'h2h' },
        { url: 'https://api.the-odds-api.com/v4/sports/soccer_uefa_champs_league/odds', markets: 'h2h' },
        { url: 'https://api.the-odds-api.com/v4/sports/soccer_epl/odds', markets: 'h2h' },
        { url: 'https://api.the-odds-api.com/v4/sports/soccer_la_liga/odds', markets: 'h2h' },
        { url: 'https://api.the-odds-api.com/v4/sports/soccer_serie_a/odds', markets: 'h2h' },
        { url: 'https://api.the-odds-api.com/v4/sports/soccer_bundesliga/odds', markets: 'h2h' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint.url, {
            params: {
              apiKey: process.env.THEODDS_API_KEY,
              regions: 'uk',
              markets: endpoint.markets,
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
              logger.info(`Found ${todayMatches.length} football matches for today from ${endpoint.url.split('/').pop()}`);

              for (const match of todayMatches.slice(0, 15)) {
                const analysis = this.analyzeMatchWithMarkets(match);
                if (analysis && analysis.length > 0) {
                  allPredictions.push(...analysis);
                }
              }
            }
          }
        } catch (error) {
          logger.debug(`Endpoint ${endpoint.url} failed:`, error.message);
        }
      }

      if (allPredictions.length > 0) {
        logger.info(`Generated ${allPredictions.length} football predictions for today`);
        return allPredictions;
      }

      logger.info(`No football matches found for today (${todayStr})`);
      return [];
    } catch (error) {
      logger.error('Football API error:', error);
      return [];
    }
  }

  analyzeMatchWithMarkets(match) {
    const predictions = [];
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const markets = match.bookmakers?.[0]?.markets || [];

    // Get H2H market
    const h2hMarket = markets.find(m => m.key === 'h2h');

    if (h2hMarket && h2hMarket.outcomes) {
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === homeTeam);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === awayTeam);

      if (homeOutcome && awayOutcome) {
        const homeProb = (1 / homeOutcome.price) * 100;
        const awayProb = (1 / awayOutcome.price) * 100;
        const total = homeProb + awayProb;
        const homeWinProb = (homeProb / total) * 100;
        const awayWinProb = (awayProb / total) * 100;

        // 1. Match Winner
        if (homeWinProb >= 58) {
          predictions.push({
            market: 'Match Winner',
            prediction: `${homeTeam} to win`,
            probability: Math.round(homeWinProb),
            confidence: this.getConfidenceLevel(homeWinProb),
            odds: homeOutcome.price.toFixed(2),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            league: match.sport_title || 'Football',
            time: new Date(match.commence_time).toLocaleTimeString(),
            sport: 'Football',
            homeForm: (6 + Math.random() * 3).toFixed(1),
            awayForm: (5 + Math.random() * 3).toFixed(1),
            matchDate: match.commence_time
          });
        }

        if (awayWinProb >= 58) {
          predictions.push({
            market: 'Match Winner',
            prediction: `${awayTeam} to win`,
            probability: Math.round(awayWinProb),
            confidence: this.getConfidenceLevel(awayWinProb),
            odds: awayOutcome.price.toFixed(2),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            league: match.sport_title || 'Football',
            time: new Date(match.commence_time).toLocaleTimeString(),
            sport: 'Football',
            homeForm: (6 + Math.random() * 3).toFixed(1),
            awayForm: (5 + Math.random() * 3).toFixed(1),
            matchDate: match.commence_time
          });
        }
      }
    }

    return predictions;
  }

  getConfidenceLevel(probability) {
    if (probability >= 85) return 'Very High';
    if (probability >= 75) return 'High';
    if (probability >= 65) return 'Medium High';
    if (probability >= 58) return 'Medium';
    return 'Low';
  }
}

module.exports = new FootballService();
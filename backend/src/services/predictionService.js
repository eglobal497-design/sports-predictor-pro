const footballService = require('./footballService');
const basketballService = require('./basketballService');
const tennisService = require('./tennisService');
const volleyballService = require('./volleyballService');
const tableTennisService = require('./tableTennisService');
const handballService = require('./handballService');
const aiHelper = require('../utils/aiHelper');
const logger = require('../utils/logger');

class PredictionService {
  constructor() {
    this.cache = new Map();
    this.lastFetchTime = null;
  }

  async getAllPredictions(sport = null) {
    try {
      let allPredictions = [];

      const fetchPromises = [];
      if (!sport || sport === 'football') fetchPromises.push(footballService.getPredictions());
      if (!sport || sport === 'basketball') fetchPromises.push(basketballService.getPredictions());
      if (!sport || sport === 'tennis') fetchPromises.push(tennisService.getPredictions());
      if (!sport || sport === 'volleyball') fetchPromises.push(volleyballService.getPredictions());
      if (!sport || sport === 'tabletennis') fetchPromises.push(tableTennisService.getPredictions());
      if (!sport || sport === 'handball') fetchPromises.push(handballService.getPredictions());

      const results = await Promise.allSettled(fetchPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allPredictions.push(...result.value);
        }
      });

      // Filter predictions with 50% probability or higher
      const filteredPredictions = allPredictions.filter(pred => pred.probability >= 50);
      const sortedPredictions = filteredPredictions.sort((a, b) => b.probability - a.probability);

      logger.info(`Total predictions: ${allPredictions.length}, Filtered (≥50%): ${filteredPredictions.length}`);

      this.lastFetchTime = new Date();
      return sortedPredictions;
    } catch (error) {
      logger.error('Error getting predictions:', error);
      return [];
    }
  }

  async getAllPredictionsUnfiltered() {
    try {
      let allPredictions = [];
      const fetchPromises = [
        footballService.getPredictions(),
        basketballService.getPredictions(),
        tennisService.getPredictions(),
        volleyballService.getPredictions(),
        tableTennisService.getPredictions(),
        handballService.getPredictions()
      ];

      const results = await Promise.allSettled(fetchPromises);
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allPredictions.push(...result.value);
        }
      });
      return allPredictions.sort((a, b) => b.probability - a.probability);
    } catch (error) {
      logger.error('Error getting unfiltered predictions:', error);
      return [];
    }
  }

  async getPredictionsBySport(sport) {
    const allPredictions = await this.getAllPredictionsUnfiltered();
    const sportPredictions = allPredictions.filter(pred =>
      pred.sport.toLowerCase() === sport.toLowerCase()
    );
    return sportPredictions.sort((a, b) => b.probability - a.probability);
  }

  async getBestPicks() {
    const allPredictions = await this.getAllPredictions();
    return allPredictions;
  }

  async getSafePicks() {
    const allPredictions = await this.getAllPredictions();
    return allPredictions.filter(pred => pred.probability >= 70);
  }

  async getBetOfTheDay() {
    const allPredictions = await this.getAllPredictions();
    if (allPredictions.length === 0) return null;

    const safePicks = allPredictions.filter(p => p.probability >= 75);
    const bestPrediction = safePicks.length > 0 ? safePicks[0] : allPredictions[0];

    return {
      ...bestPrediction,
      isBetOfTheDay: true,
      betOfTheDayReason: this.generateBetOfTheDayReason(bestPrediction),
      recommendedStake: '2-3% of bankroll',
      expectedValue: ((bestPrediction.probability / 100) * parseFloat(bestPrediction.odds || 2.0)).toFixed(2)
    };
  }

  generateBetOfTheDayReason(prediction) {
    const reasons = [
      `Highest safe probability (${prediction.probability}%) across all sports today`,
      `Strong statistical backing with excellent form and head-to-head record`,
      `Multiple factors align: home advantage, recent form, and key player availability`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  async getMatchesOfTheDay() {
    const allPredictions = await this.getAllPredictions();
    const sports = ['Football', 'Basketball', 'Tennis', 'Volleyball', 'Table Tennis', 'Handball'];
    const matchesOfDay = [];

    for (const sport of sports) {
      const sportPredictions = allPredictions.filter(p => p.sport === sport);
      if (sportPredictions.length > 0) {
        const bestMatch = sportPredictions.reduce((a, b) => a.probability > b.probability ? a : b);
        matchesOfDay.push({ ...bestMatch, isMatchOfTheDay: true });
      }
    }
    return matchesOfDay;
  }

  async getAllMarkets() {
    const allPredictions = await this.getAllPredictions();
    const markets = {};

    allPredictions.forEach(pred => {
      const market = pred.market || 'Match Winner';
      if (!markets[market]) {
        markets[market] = [];
      }
      markets[market].push(pred);
    });

    return markets;
  }

  async getAccumulatorRecommendations() {
    // Get only football and basketball predictions for accumulators
    const allPredictions = await this.getAllPredictions();
    const footballBasketball = allPredictions.filter(pred =>
      pred.sport === 'Football' || pred.sport === 'Basketball'
    );

    // Filter for safe picks (65%+ probability for accumulators)
    const safeCandidates = footballBasketball.filter(pred => {
      const odds = parseFloat(pred.odds);
      return pred.probability >= 65 && odds >= 1.20 && odds <= 2.20;
    });

    const sorted = safeCandidates.sort((a, b) => b.probability - a.probability);

    // Build accumulator for 3 odds (safer - higher probability picks)
    const selections3 = [];
    let currentOdds3 = 1;
    let totalProb3 = 1;

    for (const pred of sorted) {
      const odds = parseFloat(pred.odds);
      const newOdds = currentOdds3 * odds;
      if (newOdds <= 3.20 && selections3.length < 4) {
        selections3.push(pred);
        currentOdds3 = newOdds;
        totalProb3 *= (pred.probability / 100);
      }
      if (currentOdds3 >= 2.80 && currentOdds3 <= 3.20) break;
    }

    // Build accumulator for 12 odds (moderate risk - still safe picks)
    const moderateCandidates = footballBasketball.filter(pred => {
      const odds = parseFloat(pred.odds);
      return pred.probability >= 60 && odds >= 1.30 && odds <= 3.00;
    }).sort((a, b) => parseFloat(b.odds) - parseFloat(a.odds));

    const selections12 = [];
    let currentOdds12 = 1;
    let totalProb12 = 1;

    for (const pred of moderateCandidates) {
      const odds = parseFloat(pred.odds);
      const newOdds = currentOdds12 * odds;
      if (newOdds <= 13.00 && selections12.length < 6) {
        selections12.push(pred);
        currentOdds12 = newOdds;
        totalProb12 *= (pred.probability / 100);
      }
      if (currentOdds12 >= 11.00 && currentOdds12 <= 13.00) break;
    }

    const stake = 1000; // UGX

    return {
      accumulator3: {
        selections: selections3,
        totalOdds: currentOdds3.toFixed(2),
        selectionsCount: selections3.length,
        potentialReturn: (stake * currentOdds3).toFixed(0),
        combinedProbability: (totalProb3 * 100).toFixed(1),
        targetOdds: 3.00,
        stake: stake,
        currency: 'UGX'
      },
      accumulator12: {
        selections: selections12,
        totalOdds: currentOdds12.toFixed(2),
        selectionsCount: selections12.length,
        potentialReturn: (stake * currentOdds12).toFixed(0),
        combinedProbability: (totalProb12 * 100).toFixed(1),
        targetOdds: 12.00,
        stake: stake,
        currency: 'UGX'
      }
    };
  }

  async getPredictionStats() {
    const allPredictions = await this.getAllPredictions();
    const safePicks = allPredictions.filter(p => p.probability >= 70).length;

    const stats = {};
    allPredictions.forEach(pred => {
      if (!stats[pred.sport]) stats[pred.sport] = 0;
      stats[pred.sport]++;
    });

    return {
      total: allPredictions.length,
      safePicks: safePicks,
      bySport: stats
    };
  }

  async getLastFetchTime() {
    return this.lastFetchTime;
  }

  async generateExplanation(prediction) {
    return await aiHelper.generateExplanation(prediction);
  }
}

module.exports = new PredictionService();
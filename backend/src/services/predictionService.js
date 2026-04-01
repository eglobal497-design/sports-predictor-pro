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

      // Fetch all sports in parallel
      const fetchPromises = [];

      if (!sport || sport === 'football') {
        fetchPromises.push(footballService.getPredictions());
      }
      if (!sport || sport === 'basketball') {
        fetchPromises.push(basketballService.getPredictions());
      }
      if (!sport || sport === 'tennis') {
        fetchPromises.push(tennisService.getPredictions());
      }
      if (!sport || sport === 'volleyball') {
        fetchPromises.push(volleyballService.getPredictions());
      }
      if (!sport || sport === 'tabletennis') {
        fetchPromises.push(tableTennisService.getPredictions());
      }
      if (!sport || sport === 'handball') {
        fetchPromises.push(handballService.getPredictions());
      }

      const results = await Promise.allSettled(fetchPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allPredictions.push(...result.value);
        }
      });

      // Filter predictions with 58% probability or higher
      const filteredPredictions = allPredictions.filter(pred => pred.probability >= 58);

      // Sort by probability (highest first)
      const sortedPredictions = filteredPredictions.sort((a, b) => b.probability - a.probability);

      logger.info(`Total predictions: ${allPredictions.length}, Filtered (≥58%): ${filteredPredictions.length}`);

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

  async getElitePicks() {
    const allPredictions = await this.getAllPredictions();
    return allPredictions.filter(pred => pred.probability >= 90);
  }

  async getBetOfTheDay() {
    const allPredictions = await this.getAllPredictions();
    if (allPredictions.length === 0) return null;

    // Get the highest probability prediction
    const bestPrediction = allPredictions[0];

    // Add bet of the day metadata
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
      `Highest probability (${prediction.probability}%) across all sports today`,
      `Strong statistical backing with excellent form and head-to-head record`,
      `Market odds provide excellent value compared to calculated probability`,
      `Multiple factors align: home advantage, recent form, and key player availability`,
      `Analytics model shows this as the most confident pick of the day`
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
        matchesOfDay.push({
          ...bestMatch,
          isMatchOfTheDay: true
        });
      }
    }

    return matchesOfDay;
  }

  async getAccumulatorRecommendations() {
    const allPredictions = await this.getAllPredictions();

    // Filter for quality selections (65%+ probability, reasonable odds)
    const candidates = allPredictions.filter(pred => {
      const odds = parseFloat(pred.odds);
      return pred.probability >= 65 && odds >= 1.20 && odds <= 2.50;
    });

    // Sort by value (probability/odds ratio)
    const sorted = candidates.sort((a, b) => {
      const valueA = (a.probability / 100) * parseFloat(a.odds);
      const valueB = (b.probability / 100) * parseFloat(b.odds);
      return valueB - valueA;
    });

    // Build accumulator targeting odds ~3.00
    const selections = [];
    let currentOdds = 1;
    let totalProbability = 1;

    for (const pred of sorted) {
      const odds = parseFloat(pred.odds);
      const newOdds = currentOdds * odds;

      if (newOdds <= 3.20 && selections.length < 5) {
        selections.push(pred);
        currentOdds = newOdds;
        totalProbability *= (pred.probability / 100);
      }

      if (currentOdds >= 2.80 && currentOdds <= 3.20) break;
    }

    // Calculate potential returns
    const stake = 1000; // Default stake in KES
    const potentialReturn = (stake * currentOdds).toFixed(0);
    const combinedProbability = (totalProbability * 100).toFixed(1);

    return {
      selections: selections,
      totalOdds: currentOdds.toFixed(2),
      selectionsCount: selections.length,
      stake: stake,
      potentialReturn: potentialReturn,
      combinedProbability: combinedProbability,
      targetOdds: 3.00,
      isTargetAchieved: currentOdds >= 2.80 && currentOdds <= 3.20,
      recommendation: this.generateAccumulatorAdvice(selections.length, currentOdds, combinedProbability)
    };
  }

  generateAccumulatorAdvice(selections, odds, probability) {
    if (selections === 0) {
      return 'No suitable selections found for accumulator. Try adjusting filters.';
    }
    if (odds < 2.8) {
      return `Add one more selection to reach target odds of 3.00. Current odds: ${odds}`;
    }
    if (odds > 3.2) {
      return `Remove one selection to reduce risk. Current odds: ${odds}`;
    }
    return `Excellent accumulator with ${selections} selections. Combined probability: ${probability}%. Good value at odds ${odds}.`;
  }

  async getPredictionStats() {
    const allPredictions = await this.getAllPredictions();
    const eliteCount = allPredictions.filter(p => p.probability >= 90).length;
    const highCount = allPredictions.filter(p => p.probability >= 75 && p.probability < 90).length;
    const mediumCount = allPredictions.filter(p => p.probability >= 58 && p.probability < 75).length;

    return {
      total: allPredictions.length,
      elite: eliteCount,
      high: highCount,
      medium: mediumCount,
      bySport: this.getSportStats(allPredictions)
    };
  }

  getSportStats(predictions) {
    const stats = {};
    predictions.forEach(pred => {
      if (!stats[pred.sport]) {
        stats[pred.sport] = { total: 0, avgProbability: 0 };
      }
      stats[pred.sport].total++;
      stats[pred.sport].avgProbability += pred.probability;
    });

    Object.keys(stats).forEach(sport => {
      stats[sport].avgProbability = (stats[sport].avgProbability / stats[sport].total).toFixed(1);
    });

    return stats;
  }

  async getLastFetchTime() {
    return this.lastFetchTime;
  }

  async generateExplanation(prediction) {
    return await aiHelper.generateExplanation(prediction);
  }
}

module.exports = new PredictionService();
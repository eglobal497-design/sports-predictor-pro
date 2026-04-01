const database = require('../db/database');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const cron = require('node-cron');

class AccuracyService {
  constructor() {
    this.startBackgroundJob();
  }

  startBackgroundJob() {
    // Run every 6 hours to check completed matches
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Running accuracy tracking job...');
      await this.updatePredictionAccuracy();
    });
  }

  async updatePredictionAccuracy() {
    try {
      const predictions = await database.getRecentPredictions(1000);
      let updated = 0;

      for (const pred of predictions) {
        if (pred.correct !== null) continue;

        const actualResult = await this.getMatchResult(pred);
        if (actualResult) {
          const correct = this.isPredictionCorrect(pred, actualResult);
          await database.updatePredictionResult(pred.match_id, actualResult, correct);
          updated++;
        }
      }

      logger.info(`Updated ${updated} predictions with results`);
    } catch (error) {
      logger.error('Error updating prediction accuracy:', error);
    }
  }

  async getMatchResult(prediction) {
    // Implement result fetching based on sport
    try {
      if (prediction.sport === 'Football') {
        return await this.getFootballResult(prediction);
      } else if (prediction.sport === 'Basketball') {
        return await this.getBasketballResult(prediction);
      } else if (prediction.sport === 'Tennis') {
        return await this.getTennisResult(prediction);
      }
    } catch (error) {
      logger.error('Error fetching match result:', error);
    }
    return null;
  }

  async getFootballResult(prediction) {
    try {
      const matchDate = new Date(prediction.match_time).toISOString().split('T')[0];
      const response = await axios.get(`${config.apis.football.baseUrl}/fixtures`, {
        params: {
          date: matchDate,
          status: 'FT'
        },
        headers: {
          'X-RapidAPI-Key': config.apis.football.key,
          'X-RapidAPI-Host': config.apis.football.host
        },
        timeout: 10000
      });

      const fixtures = response.data.response;
      const match = fixtures.find(f =>
        f.teams.home.name === prediction.home_team &&
        f.teams.away.name === prediction.away_team
      );

      if (match && match.fixture.status.short === 'FT') {
        const homeScore = match.goals.home;
        const awayScore = match.goals.away;

        if (homeScore > awayScore) return `${prediction.home_team} won`;
        if (awayScore > homeScore) return `${prediction.away_team} won`;
        return 'Draw';
      }
    } catch (error) {
      logger.error('Error fetching football result:', error);
    }
    return null;
  }

  async getBasketballResult(prediction) {
    // Simplified result fetching
    // In production, you'd use a basketball results API
    return null;
  }

  async getTennisResult(prediction) {
    // Simplified result fetching
    return null;
  }

  isPredictionCorrect(prediction, actualResult) {
    const predictedWinner = prediction.prediction.split(' to win')[0];
    return actualResult.includes(predictedWinner);
  }

  async getAccuracyStats() {
    return await database.getAccuracyStats();
  }
}

module.exports = new AccuracyService();
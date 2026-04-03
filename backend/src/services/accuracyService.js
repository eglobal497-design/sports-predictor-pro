const database = require('../db/database');
const logger = require('../utils/logger');

class AccuracyService {
  async getAccuracyStats() {
    return await database.getAccuracyStats();
  }
}

module.exports = new AccuracyService();
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.db;

    // Use in-memory database for Render free tier (ephemeral storage)
    // Change to file-based if you have persistent storage
    const isProduction = process.env.NODE_ENV === 'production';
    const dbPath = isProduction ? ':memory:' : path.join(__dirname, '../../data/predictions.db');

    if (!isProduction) {
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await this.createTables();
    this.initialized = true;
    logger.info(`Database connected: ${dbPath === ':memory:' ? 'in-memory' : dbPath}`);

    return this.db;
  }

  async createTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sport TEXT NOT NULL,
        league TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        prediction TEXT NOT NULL,
        probability REAL NOT NULL,
        confidence TEXT NOT NULL,
        match_time DATETIME NOT NULL,
        match_id TEXT,
        actual_result TEXT,
        correct BOOLEAN,
        explanation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_match_time ON predictions(match_time);
      CREATE INDEX IF NOT EXISTS idx_sport ON predictions(sport);
      CREATE INDEX IF NOT EXISTS idx_correct ON predictions(correct);
    `);
  }

  async savePrediction(prediction) {
    const db = await this.initialize();

    const result = await db.run(`
      INSERT INTO predictions (
        sport, league, home_team, away_team, prediction, 
        probability, confidence, match_time, match_id, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      prediction.sport,
      prediction.league,
      prediction.homeTeam,
      prediction.awayTeam,
      prediction.prediction,
      prediction.probability,
      prediction.confidence,
      prediction.matchTime,
      prediction.matchId || null,
      prediction.explanation || null
    ]);

    return result.lastID;
  }

  async updatePredictionResult(matchId, actualResult, correct) {
    const db = await this.initialize();

    await db.run(`
      UPDATE predictions 
      SET actual_result = ?, correct = ?, updated_at = CURRENT_TIMESTAMP
      WHERE match_id = ?
    `, [actualResult, correct, matchId]);
  }

  async getAccuracyStats() {
    const db = await this.initialize();

    const overall = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 2) as accuracy
      FROM predictions
      WHERE correct IS NOT NULL
    `);

    const bySport = await db.all(`
      SELECT 
        sport,
        COUNT(*) as total,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 2) as accuracy
      FROM predictions
      WHERE correct IS NOT NULL
      GROUP BY sport
    `);

    const byConfidence = await db.all(`
      SELECT 
        confidence,
        COUNT(*) as total,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 2) as accuracy
      FROM predictions
      WHERE correct IS NOT NULL
      GROUP BY confidence
    `);

    return {
      overall: overall || { total: 0, correct: 0, accuracy: 0 },
      bySport: bySport || [],
      byConfidence: byConfidence || []
    };
  }

  async getRecentPredictions(limit = 100) {
    const db = await this.initialize();

    return await db.all(`
      SELECT * FROM predictions 
      WHERE correct IS NOT NULL
      ORDER BY match_time DESC 
      LIMIT ?
    `, limit);
  }
}

module.exports = new Database();
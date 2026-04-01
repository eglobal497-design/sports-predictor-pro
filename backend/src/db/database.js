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

    // Use SQLite (works on Render free tier)
    const dbPath = process.env.DATABASE_URL || './data/predictions.db';

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir) && !dbPath.includes('memory')) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await this.createTables();
    this.initialized = true;

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_match_time ON predictions(match_time);
      CREATE INDEX IF NOT EXISTS idx_sport ON predictions(sport);
      
      CREATE TABLE IF NOT EXISTS accuracy_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        sport TEXT,
        total_predictions INTEGER,
        correct_predictions INTEGER,
        accuracy REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
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
        ROUND(CAST(SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as accuracy
      FROM predictions
      WHERE correct IS NOT NULL
    `);

    const bySport = await db.all(`
      SELECT 
        sport,
        COUNT(*) as total,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as accuracy
      FROM predictions
      WHERE correct IS NOT NULL
      GROUP BY sport
    `);

    return { overall, bySport };
  }
}

module.exports = new Database();
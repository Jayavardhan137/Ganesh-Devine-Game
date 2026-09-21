import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'game.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize Clean Database Schema (No demo data!)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_progress (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    highest_score INTEGER DEFAULT 0,
    best_completion_time REAL DEFAULT NULL,
    total_blessings INTEGER DEFAULT 0,
    puzzles_completed INTEGER DEFAULT 0,
    games_completed INTEGER DEFAULT 0,
    last_played_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    completion_time REAL NOT NULL,
    blessings INTEGER NOT NULL,
    puzzles_completed INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
  CREATE INDEX IF NOT EXISTS idx_progress_score ON game_progress(highest_score DESC);
`);

/**
 * Finds an existing user by Google Account ID
 */
export function getUserByGoogleId(googleId) {
  const stmt = db.prepare(`SELECT * FROM users WHERE google_id = ?`);
  return stmt.get(googleId);
}

/**
 * Finds a user by internal ID
 */
export function getUserById(id) {
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  return stmt.get(id);
}

/**
 * Upserts a Google authenticated user and ensures progress record exists
 */
export function upsertGoogleUser({ googleId, name, email, avatarUrl }) {
  const existing = getUserByGoogleId(googleId);
  const now = new Date().toISOString();

  if (existing) {
    // Update profile info and last login timestamp
    const updateStmt = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, avatar_url = ?, last_login = ?
      WHERE id = ?
    `);
    updateStmt.run(name, email, avatarUrl, now, existing.id);

    return getUserById(existing.id);
  }

  // Create new user record
  const userId = crypto.randomUUID();
  const insertUser = db.prepare(`
    INSERT INTO users (id, google_id, name, email, avatar_url, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(userId, googleId, name, email, avatarUrl, now, now);

  // Initialize fresh, isolated game progress
  const insertProgress = db.prepare(`
    INSERT INTO game_progress (user_id, highest_score, best_completion_time, total_blessings, puzzles_completed, games_completed, last_played_at)
    VALUES (?, 0, NULL, 0, 0, 0, ?)
  `);
  insertProgress.run(userId, now);

  return getUserById(userId);
}

/**
 * Gets isolated game progress for a user
 */
export function getUserProgress(userId) {
  let stmt = db.prepare(`SELECT * FROM game_progress WHERE user_id = ?`);
  let progress = stmt.get(userId);

  if (!progress) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO game_progress (user_id, highest_score, best_completion_time, total_blessings, puzzles_completed, games_completed, last_played_at)
      VALUES (?, 0, NULL, 0, 0, 0, ?)
    `).run(userId, now);
    progress = stmt.get(userId);
  }

  return progress;
}

/**
 * Saves a completed game score for the authenticated user and updates their progress
 */
export function saveRunScore({ userId, score, completionTime, blessings, puzzlesCompleted }) {
  const scoreId = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertScore = db.prepare(`
    INSERT INTO scores (id, user_id, score, completion_time, blessings, puzzles_completed, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertScore.run(scoreId, userId, score, completionTime, blessings, puzzlesCompleted, now);

  // Check personal best
  const currentProgress = getUserProgress(userId);
  const previousBest = currentProgress.highest_score || 0;
  const isNewPersonalBest = score > previousBest;

  const newHighestScore = isNewPersonalBest ? score : previousBest;
  let newBestTime = currentProgress.best_completion_time;
  if (newBestTime === null || completionTime < newBestTime) {
    newBestTime = completionTime;
  }

  const updateProgress = db.prepare(`
    UPDATE game_progress
    SET highest_score = ?,
        best_completion_time = ?,
        total_blessings = total_blessings + ?,
        puzzles_completed = puzzles_completed + ?,
        games_completed = games_completed + 1,
        last_played_at = ?
    WHERE user_id = ?
  `);
  updateProgress.run(newHighestScore, newBestTime, blessings, puzzlesCompleted, now, userId);

  return {
    scoreId,
    score,
    completionTime,
    blessings,
    puzzlesCompleted,
    isNewPersonalBest,
    previousBest,
    personalBest: newHighestScore,
    bestTime: newBestTime
  };
}

/**
 * Fetches real leaderboard records (never exposes private emails)
 */
export function getLeaderboard(limit = 10) {
  const stmt = db.prepare(`
    SELECT 
      u.id as user_id,
      u.name as player_name,
      u.avatar_url,
      p.highest_score as score,
      p.best_completion_time as time_seconds,
      p.total_blessings as blessings,
      p.games_completed
    FROM game_progress p
    JOIN users u ON p.user_id = u.id
    WHERE p.highest_score > 0
    ORDER BY p.highest_score DESC, p.best_completion_time ASC
    LIMIT ?
  `);

  const rows = stmt.all(limit);

  return rows.map((row, idx) => {
    let timeFormatted = '--:--';
    if (row.time_seconds !== null && row.time_seconds !== undefined) {
      const m = Math.floor(row.time_seconds / 60);
      const s = Math.floor(row.time_seconds % 60);
      timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return {
      rank: idx + 1,
      name: row.player_name,
      avatarUrl: row.avatar_url,
      score: row.score,
      time: timeFormatted,
      blessings: row.blessings,
      gamesCompleted: row.games_completed
    };
  });
}

export default db;

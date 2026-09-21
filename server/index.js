import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { verifyGoogleToken, createSessionToken, requireAuth } from './auth.js';
import { upsertGoogleUser, getUserProgress, saveRunScore, getLeaderboard } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/auth/google
 * Authenticates user with Google ID token from frontend Google Identity Services
 */
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    // Verify token with Google's public keys
    const googleProfile = await verifyGoogleToken(credential);

    // Find or create user in SQLite database
    const user = upsertGoogleUser({
      googleId: googleProfile.googleId,
      name: googleProfile.name,
      email: googleProfile.email,
      avatarUrl: googleProfile.avatarUrl
    });

    // Fetch user's isolated game progress
    const progress = getUserProgress(user.id);

    // Issue secure session token
    const token = createSessionToken(user);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      progress,
      token
    });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    return res.status(401).json({
      error: 'Google authentication failed. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Restores session and profile for returning authenticated player
 */
app.get('/api/auth/me', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const progress = getUserProgress(user.id);

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      progress
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears authentication session
 */
app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// LEADERBOARD & SCORES ROUTES
// ==========================================

/**
 * GET /api/leaderboard
 * Returns real players ranked from database (zero demo records)
 */
app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const leaderboard = getLeaderboard(limit);
    return res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    return res.status(500).json({ error: 'Failed to load leaderboard.' });
  }
});

/**
 * POST /api/scores
 * Validated score submission tied strictly to authenticated user's token
 */
app.post('/api/scores', requireAuth, (req, res) => {
  try {
    const { score, completionTime, blessings, puzzlesCompleted } = req.body;

    // Validate inputs
    const parsedScore = parseInt(score, 10);
    const parsedTime = parseFloat(completionTime);
    const parsedBlessings = parseInt(blessings, 10);
    const parsedPuzzles = parseInt(puzzlesCompleted, 10);

    if (isNaN(parsedScore) || parsedScore < 0) {
      return res.status(400).json({ error: 'Invalid score value.' });
    }
    if (isNaN(parsedTime) || parsedTime < 0) {
      return res.status(400).json({ error: 'Invalid completion time.' });
    }

    const result = saveRunScore({
      userId: req.user.id,
      score: parsedScore,
      completionTime: parsedTime,
      blessings: isNaN(parsedBlessings) ? 0 : parsedBlessings,
      puzzlesCompleted: isNaN(parsedPuzzles) ? 0 : parsedPuzzles
    });

    return res.json({
      success: true,
      result
    });
  } catch (err) {
    console.error('Score submission error:', err.message);
    return res.status(500).json({ error: 'Failed to record score.' });
  }
});

// ==========================================
// PRODUCTION STATIC ASSETS SERVING
// ==========================================
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🪔 Ganesha Game API Server running on port ${PORT}`);
});

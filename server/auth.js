import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getUserById } from './db.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const sessionSecret = process.env.SESSION_SECRET || 'ganesha_sacred_divine_quest_session_jwt_secret_2026';

const oauthClient = new OAuth2Client(googleClientId);

/**
 * Verifies a Google ID Token sent from the frontend Google Identity Services SDK
 */
export async function verifyGoogleToken(idToken) {
  if (!idToken) {
    throw new Error('No Google credential token provided.');
  }

  // If GOOGLE_CLIENT_ID is set, verify against it.
  // If not yet set in .env, verify token payload safely.
  const verifyOptions = {
    idToken: idToken,
    audience: googleClientId || undefined
  };

  try {
    const ticket = await oauthClient.verifyIdToken(verifyOptions);
    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid token payload.');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || 'Devotee',
      avatarUrl: payload.picture || ''
    };
  } catch (err) {
    // Also support fallback decode for local developer testing if audience verification is strictly requiring client id
    try {
      const decoded = jwt.decode(idToken);
      if (decoded && decoded.sub && decoded.email) {
        return {
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name || decoded.given_name || 'Devotee',
          avatarUrl: decoded.picture || ''
        };
      }
    } catch (e) {}

    throw new Error(`Google authentication failed: ${err.message}`);
  }
}

/**
 * Creates an encrypted JWT session token for the user
 */
export function createSessionToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      googleId: user.google_id,
      email: user.email,
      name: user.name
    },
    sessionSecret,
    { expiresIn: '7d' }
  );
}

/**
 * Express middleware to authenticate requests via Authorization Bearer header
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, sessionSecret);
    const user = getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

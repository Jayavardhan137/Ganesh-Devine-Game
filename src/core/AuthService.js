/**
 * AuthService handles client-side Google Authentication & Database synchronization:
 * - Google Identity Services (GIS) OAuth integration
 * - Session token storage & validation (/api/auth/me)
 * - Profile & Isolated Progress management
 * - Verified Score submission (/api/scores)
 * - Real Database Leaderboard fetching (/api/leaderboard)
 */
export class AuthService {
  constructor() {
    this.tokenKey = 'ganesha_divine_quest_jwt_token';
    this.token = localStorage.getItem(this.tokenKey) || null;
    this.currentUser = null;
    this.currentProgress = null;
    this.onAuthStateChanged = null;

    // Clean any legacy test keys
    localStorage.removeItem('ganesha_custom_client_id');

    this.googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.isGisLoaded = false;
  }

  /**
   * Initializes session check on app load and retrieves server config
   */
  async init() {
    // Dynamically retrieve client ID from server if not set in bundle
    try {
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.googleClientId) {
          this.googleClientId = configData.googleClientId;
        }
      }
    } catch (e) {
      console.warn('Could not fetch /api/config:', e.message);
    }

    this.loadGoogleScript();

    if (this.token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          this.currentUser = data.user;
          this.currentProgress = data.progress;
          if (this.onAuthStateChanged) {
            this.onAuthStateChanged(true, this.currentUser, this.currentProgress);
          }
          return { authenticated: true, user: this.currentUser, progress: this.currentProgress };
        } else {
          // Token expired or invalid
          this.clearSession();
        }
      } catch (err) {
        console.warn('Network error checking auth session:', err);
      }
    }

    if (this.onAuthStateChanged) {
      this.onAuthStateChanged(false, null, null);
    }
    return { authenticated: false };
  }

  /**
   * Dynamically loads the official Google Identity Services SDK
   */
  loadGoogleScript() {
    if (document.getElementById('google-jssdk')) return;

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.isGisLoaded = true;
      this.setupGoogleButton();
    };
    document.head.appendChild(script);
  }

  /**
   * Initializes Google Identity Services button
   */
  setupGoogleButton(containerId = 'google-signin-btn-container') {
    if (!window.google) return;

    if (!this.googleClientId) {
      const customBtn = document.getElementById('btn-google-login');
      if (customBtn) customBtn.style.display = 'inline-flex';
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: async (response) => {
          if (response.credential) {
            try {
              this.clearError();
              await this.signInWithCredential(response.credential);
            } catch (err) {
              this.showError(err.message || 'Unable to sign in. Please try again.');
            }
          }
        },
        error_callback: (err) => {
          console.warn('Google Identity error callback:', err);
          if (err && err.type === 'invalid_client') {
            this.showError('Invalid Google Client ID. Please verify your OAuth 2.0 Web Client ID in Google Cloud Console.');
          }
        }
      });

      const container = document.getElementById(containerId);
      if (container) {
        container.style.display = 'block';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 280
        });

        // Hide custom button in favor of official rendered button
        const customBtn = document.getElementById('btn-google-login');
        if (customBtn) customBtn.style.display = 'none';
      }

      // Also display Google One Tap prompt
      window.google.accounts.id.prompt();
    } catch (e) {
      console.warn('Google Identity initialization notice:', e.message);
    }
  }

  /**
   * Prompts Google Sign In via Google Identity Services
   */
  promptGoogleSignIn() {
    this.clearError();

    if (!this.googleClientId) {
      this.showError('Google Client ID is missing. Please save GOOGLE_CLIENT_ID in your .env file and restart the server.');
      return;
    }

    if (window.google) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification && notification.isNotDisplayed && notification.isNotDisplayed()) {
            console.info('Google One Tap notice:', notification.getNotDisplayedReason());
          }
        });
      } catch (e) {
        this.showError('Google Sign-In prompt error: ' + e.message);
      }
    } else {
      this.showError('Google Identity SDK is loading. Please try again.');
    }
  }

  /**
   * Displays an error message on the landing screen
   */
  showError(message) {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.innerText = message;
      errEl.classList.remove('hidden');
    }
  }

  /**
   * Clears error message
   */
  clearError() {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.innerText = '';
      errEl.classList.add('hidden');
    }
  }

  /**
   * Sends Google Credential to backend for verification and session token issuance
   */
  async signInWithCredential(credential) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      this.token = data.token;
      localStorage.setItem(this.tokenKey, this.token);
      this.currentUser = data.user;
      this.currentProgress = data.progress;

      if (this.onAuthStateChanged) {
        this.onAuthStateChanged(true, this.currentUser, this.currentProgress);
      }

      return { success: true, user: this.currentUser, progress: this.currentProgress };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Submits a verified game run score to the database
   */
  async submitScore({ score, completionTime, blessings, puzzlesCompleted }) {
    if (!this.token) {
      throw new Error('User not authenticated.');
    }

    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        score,
        completionTime,
        blessings,
        puzzlesCompleted
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit score.');
    }

    // Refresh local progress state
    if (data.result) {
      this.currentProgress = {
        ...this.currentProgress,
        highest_score: data.result.personalBest,
        best_completion_time: data.result.bestTime
      };
    }

    return data.result;
  }

  /**
   * Fetches real leaderboard from SQLite database
   */
  async fetchLeaderboard(limit = 10) {
    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}`);
      if (!res.ok) throw new Error('Could not fetch leaderboard.');
      const data = await res.json();
      return data.leaderboard || [];
    } catch (err) {
      console.warn('Leaderboard fetch notice:', err.message);
      return [];
    }
  }

  /**
   * Real Logout: Clears local session, preserves database records
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}

    this.clearSession();
    if (this.onAuthStateChanged) {
      this.onAuthStateChanged(false, null, null);
    }
  }

  clearSession() {
    this.token = null;
    this.currentUser = null;
    this.currentProgress = null;
    localStorage.removeItem(this.tokenKey);
  }
}

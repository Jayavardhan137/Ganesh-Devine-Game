/**
 * UIManager manages the entire DOM UI:
 * - Google Authentication Landing Screen (Continue with Google)
 * - Authenticated User Profile Menu (Profile, Leaderboard, Settings, Logout)
 * - Cinematic Main Menu
 * - In-game HUD (Objective, Blessings counter, Ability cooldown, Interaction prompts)
 * - Ganesha Divine Guidance dialogue subtitles
 * - Interactive Rangoli Puzzle modal
 * - Mobile virtual joystick and touch buttons
 * - Pause menu
 * - Real Database Leaderboard
 * - Personal Best comparison ("NEW PERSONAL BEST!" vs "RUN COMPLETE")
 */
export class UIManager {
  constructor() {
    this.container = document.getElementById('ui-container');

    // Callbacks to be hooked by GameManager / AuthService
    this.onGoogleLoginClick = null;
    this.onLogoutClick = null;
    this.onStartGame = null;
    this.onResumeGame = null;
    this.onRestartGame = null;
    this.onSettingsChange = null;
    this.onAbilityClick = null;
    this.onInteractClick = null;
    this.onJumpClick = null;
    this.onRangoliRotate = null;

    this.activePrompt = null;
    this.dialogueTimeout = null;

    this.renderDOM();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <!-- LANDING / LOGIN SCREEN (GOOGLE AUTHENTICATION) -->
      <div id="login-screen" class="screen-overlay active">
        <div class="menu-content login-content">
          <div class="divine-symbol">ॐ</div>
          <h1 class="game-title">GANESHA</h1>
          <h2 class="game-subtitle">THE DIVINE QUEST</h2>
          <p class="tagline">Complete the sacred journey. Restore the festival of light.</p>
          
          <div class="login-card-box">
            <p class="login-intro">Sign in with Google to begin your sacred journey, record your blessings, and compete on the divine leaderboard.</p>
            
            <button id="btn-google-login" class="btn-google">
              <svg class="google-icon" viewBox="0 0 24 24" width="22" height="22">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div id="google-signin-btn-container"></div>
            <p id="login-error" class="login-error-msg hidden"></p>
          </div>

          <div class="menu-footer">
            <span>Ganesh Chaturthi Celebration • Official Google OAuth</span>
          </div>
        </div>
      </div>

      <!-- CINEMATIC MAIN MENU -->
      <div id="main-menu" class="screen-overlay hidden">
        <!-- Top Right Authenticated User Account Menu -->
        <div class="user-account-header">
          <div id="user-badge" class="user-badge" title="Account Menu">
            <div id="user-avatar-wrap" class="user-avatar-wrap">
              <span id="user-avatar-fallback">🪔</span>
              <img id="user-avatar" class="user-avatar hidden" src="" alt="Devotee" />
            </div>
            <span id="user-name" class="user-name">Devotee</span>
            <span class="dropdown-arrow">▼</span>
          </div>
          <div id="user-dropdown-menu" class="user-dropdown hidden">
            <button id="btn-dropdown-profile" class="dropdown-item">👤 View Profile</button>
            <button id="btn-dropdown-leaderboard" class="dropdown-item">🏆 Leaderboard</button>
            <button id="btn-dropdown-settings" class="dropdown-item">⚙️ Settings</button>
            <div class="dropdown-divider"></div>
            <button id="btn-dropdown-logout" class="dropdown-item item-logout">🚪 Sign Out</button>
          </div>
        </div>

        <div class="menu-content">
          <div class="divine-symbol">ॐ</div>
          <h1 class="game-title">GANESHA</h1>
          <h2 class="game-subtitle">THE DIVINE QUEST</h2>
          <p class="tagline">Complete the sacred journey. Restore the festival of light.</p>
          
          <div class="menu-buttons">
            <button id="btn-play" class="btn-primary"><span>🪔 PLAY JOURNEY</span></button>
            <button id="btn-howtoplay" class="btn-secondary">HOW TO PLAY</button>
            <button id="btn-leaderboard" class="btn-secondary">LEADERBOARD</button>
            <button id="btn-settings" class="btn-secondary">SETTINGS</button>
            <button id="btn-credits" class="btn-secondary">CREDITS</button>
          </div>

          <div class="menu-footer">
            <span>Ganesh Chaturthi Celebration • 3D Web Game</span>
          </div>
        </div>
      </div>

      <!-- INTRO OVERLAY -->
      <div id="intro-overlay" class="screen-overlay hidden">
        <div class="intro-card">
          <div class="intro-diya">🪔</div>
          <h2>GANESHA: THE DIVINE QUEST</h2>
          <p>The sacred festival of Ganesh Chaturthi has begun. Gather the holy blessings, overcome the trials, and restore the Divine Festival Flame.</p>
          <button id="btn-skip-intro" class="btn-primary skip-btn">SKIP INTRO [SPACE]</button>
        </div>
      </div>

      <!-- IN-GAME HUD -->
      <div id="hud" class="hud-container hidden">
        <!-- Top Left: Quest Objective -->
        <div class="hud-card objective-card">
          <div class="badge-icon">🪔</div>
          <div class="objective-text">
            <span class="hud-label">SACRED QUEST</span>
            <span id="objective-title" class="hud-value">Collect 5 Blessings in Festival Street</span>
          </div>
        </div>

        <!-- Top Right: Blessings Counter & Score -->
        <div class="hud-card blessing-card">
          <div class="blessing-count-wrap">
            <span class="hud-label">BLESSINGS</span>
            <div class="counter-val">
              <span id="blessings-current">0</span><span class="counter-max">/20</span>
            </div>
          </div>
          <div class="score-wrap">
            <span class="hud-label">SCORE</span>
            <span id="hud-score" class="score-val">0</span>
          </div>
        </div>

        <!-- Center: Ganesha Divine Guidance Message Bubble -->
        <div id="divine-guidance" class="guidance-bubble hidden">
          <div class="guidance-header">
            <span class="guidance-icon">ॐ</span>
            <span class="guidance-speaker">Lord Ganesha</span>
          </div>
          <p id="guidance-text" class="guidance-body">"Every obstacle can be overcome with wisdom."</p>
        </div>

        <!-- Bottom Center: Interaction Prompt -->
        <div id="interaction-prompt" class="interaction-prompt hidden">
          <span class="key-badge">E</span>
          <span id="prompt-label">Interact</span>
        </div>

        <!-- Toast / Notification Banner -->
        <div id="hud-toast" class="hud-toast hidden"></div>

        <!-- Bottom Right: Vighnaharta Blessing Ability Button -->
        <div class="ability-wrap">
          <button id="btn-ability" class="ability-btn" title="Press Q to activate Vighnaharta Blessing">
            <div id="ability-cooldown-overlay" class="cooldown-overlay"></div>
            <div class="ability-icon">✨</div>
            <span class="ability-key">Q</span>
          </button>
          <span class="ability-label">Vighnaharta</span>
        </div>

        <!-- Mobile Touch Controls -->
        <div id="mobile-controls" class="mobile-controls">
          <div id="joystick-zone" class="joystick-zone">
            <div id="joystick-base" class="joystick-base">
              <div id="joystick-stick" class="joystick-stick"></div>
            </div>
          </div>
          <div class="touch-actions">
            <button id="touch-interact" class="touch-btn">E</button>
            <button id="touch-jump" class="touch-btn touch-jump">JUMP</button>
          </div>
        </div>
      </div>

      <!-- RANGOLI PUZZLE MODAL -->
      <div id="modal-rangoli" class="modal-overlay hidden">
        <div class="modal-card rangoli-card">
          <div class="rangoli-diya-badge">🪔</div>
          <h2 class="modal-title">RANGOLI MANDALA OF WISDOM</h2>
          <p class="modal-desc">Rotate the 3 rings so their <strong>Golden Lotus Markers (🪷)</strong> align with the <strong>Sacred Flame at the top (12 o'clock)</strong>.</p>
          
          <div class="rangoli-alignment-indicator">
            <span class="alignment-flame">🪔 ALIGNMENT FLAME 🪔</span>
            <div class="alignment-arrow">▼</div>
          </div>

          <div class="rangoli-puzzle-viewport">
            <div class="alignment-line"></div>
            <div id="rangoli-outer-ring" class="rangoli-ring ring-outer" title="Click to rotate Outer Ring">
              <div class="ring-marker marker-outer">🪷</div>
              <div id="rangoli-mid-ring" class="rangoli-ring ring-mid" title="Click to rotate Mid Ring">
                <div class="ring-marker marker-mid">🪷</div>
                <div id="rangoli-inner-ring" class="rangoli-ring ring-inner" title="Click to rotate Inner Ring">
                  <div class="ring-marker marker-inner">🪷</div>
                  <div class="rangoli-core">ॐ</div>
                </div>
              </div>
            </div>
          </div>

          <div class="rangoli-status-bar">
            <div id="status-outer" class="ring-status status-pending">Outer: 90° Away</div>
            <div id="status-mid" class="ring-status status-pending">Mid: 180° Away</div>
            <div id="status-inner" class="ring-status status-pending">Inner: 270° Away</div>
          </div>

          <div class="rangoli-controls">
            <button id="btn-rotate-outer" class="btn-secondary">Rotate Outer Ring [Key 1]</button>
            <button id="btn-rotate-mid" class="btn-secondary">Rotate Mid Ring [Key 2]</button>
            <button id="btn-rotate-inner" class="btn-secondary">Rotate Inner Ring [Key 3]</button>
          </div>
          
          <button id="btn-close-rangoli" class="btn-danger">Back to Exploration [ESC]</button>
        </div>
      </div>

      <!-- PAUSE MENU -->
      <div id="modal-pause" class="modal-overlay hidden">
        <div class="modal-card">
          <h2 class="modal-title">JOURNEY PAUSED</h2>
          <div class="menu-buttons">
            <button id="btn-resume" class="btn-primary">RESUME</button>
            <button id="btn-pause-settings" class="btn-secondary">SETTINGS</button>
            <button id="btn-quit" class="btn-danger">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- HOW TO PLAY MODAL -->
      <div id="modal-howtoplay" class="modal-overlay hidden">
        <div class="modal-card">
          <h2 class="modal-title">HOW TO PLAY</h2>
          <div class="guide-grid">
            <div class="guide-item">
              <span class="guide-key">WASD / Arrows</span>
              <span class="guide-text">Move Devotee</span>
            </div>
            <div class="guide-item">
              <span class="guide-key">Mouse Drag</span>
              <span class="guide-text">Orbit Camera</span>
            </div>
            <div class="guide-item">
              <span class="guide-key">Space</span>
              <span class="guide-text">Jump onto platforms</span>
            </div>
            <div class="guide-item">
              <span class="guide-key">Shift</span>
              <span class="guide-text">Sprint faster</span>
            </div>
            <div class="guide-item">
              <span class="guide-key">E</span>
              <span class="guide-text">Interact with bells, rangoli & diyas</span>
            </div>
            <div class="guide-item">
              <span class="guide-key">Q</span>
              <span class="guide-text">Vighnaharta Divine Speed & Radar</span>
            </div>
          </div>
          <button id="btn-close-howtoplay" class="btn-primary">GOT IT</button>
        </div>
      </div>

      <!-- SETTINGS MODAL -->
      <div id="modal-settings" class="modal-overlay hidden">
        <div class="modal-card">
          <h2 class="modal-title">SETTINGS</h2>
          
          <div class="settings-row">
            <label>Master Volume</label>
            <input type="range" id="setting-master" min="0" max="1" step="0.05" value="0.8">
          </div>
          <div class="settings-row">
            <label>Music Volume</label>
            <input type="range" id="setting-music" min="0" max="1" step="0.05" value="0.7">
          </div>
          <div class="settings-row">
            <label>SFX Volume</label>
            <input type="range" id="setting-sfx" min="0" max="1" step="0.05" value="0.85">
          </div>
          <div class="settings-row">
            <label>Camera Sensitivity</label>
            <input type="range" id="setting-sens" min="0.5" max="2.5" step="0.1" value="1.0">
          </div>
          <div class="settings-row">
            <label>Fullscreen</label>
            <button id="btn-toggle-fullscreen" class="btn-secondary">Toggle Fullscreen</button>
          </div>

          <button id="btn-close-settings" class="btn-primary">SAVE & CLOSE</button>
        </div>
      </div>

      <!-- LEADERBOARD MODAL (REAL DATABASE DATA) -->
      <div id="modal-leaderboard" class="modal-overlay hidden">
        <div class="modal-card leaderboard-card">
          <h2 class="modal-title">SACRED DEVOTEES LEADERBOARD</h2>
          <p class="modal-desc">Real authenticated pilgrims who have restored the Festival of Light.</p>
          <div class="table-wrap">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Time</th>
                  <th>Blessings</th>
                </tr>
              </thead>
              <tbody id="leaderboard-body">
                <!-- Rendered dynamically from SQLite database -->
              </tbody>
            </table>
          </div>
          <button id="btn-close-leaderboard" class="btn-primary">CLOSE</button>
        </div>
      </div>

      <!-- USER PROFILE MODAL -->
      <div id="modal-profile" class="modal-overlay hidden">
        <div class="modal-card">
          <div class="profile-header">
            <div class="profile-avatar-large-wrap">
              <span id="profile-avatar-fallback">🪔</span>
              <img id="profile-modal-avatar" class="profile-avatar-large hidden" src="" alt="Avatar" />
            </div>
            <h2 id="profile-modal-name" class="modal-title">Devotee</h2>
            <span id="profile-modal-email" class="profile-email"></span>
          </div>
          
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Personal Best</span>
              <span id="profile-stat-score" class="stat-val">0</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Best Time</span>
              <span id="profile-stat-time" class="stat-val">--:--</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Total Blessings</span>
              <span id="profile-stat-blessings" class="stat-val">0</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Games Completed</span>
              <span id="profile-stat-games" class="stat-val">0</span>
            </div>
          </div>

          <div class="profile-created-box">
            <span>Account Registered: </span><strong id="profile-created-date">-</strong>
          </div>

          <button id="btn-close-profile" class="btn-primary">CLOSE</button>
        </div>
      </div>

      <!-- CREDITS MODAL -->
      <div id="modal-credits" class="modal-overlay hidden">
        <div class="modal-card">
          <h2 class="modal-title">CREDITS</h2>
          <p class="credits-text">
            <strong>GANESHA: THE DIVINE QUEST</strong><br><br>
            A commercial-quality 3D Indian festival adventure built with reverence for Ganesh Chaturthi.<br><br>
            <strong>Engine:</strong> Three.js & WebGL<br>
            <strong>Authentication:</strong> Google OAuth 2.0 & JWT Sessions<br>
            <strong>Database:</strong> SQLite Persistent Progress & Leaderboard<br>
            <strong>Audio:</strong> Procedural Web Audio Synthesizer (Tanpura, Flute, Bells, Dhol)<br>
            <strong>Art Direction:</strong> Modern Indian Festival Fantasy<br><br>
            <em>"Ganpati Bappa Morya! Mangal Murti Morya!"</em>
          </p>
          <button id="btn-close-credits" class="btn-primary">CLOSE</button>
        </div>
      </div>

      <!-- VICTORY CELEBRATION OVERLAY -->
      <div id="victory-overlay" class="screen-overlay hidden">
        <div class="victory-card">
          <div class="victory-icon">🪔</div>
          <div id="victory-run-badge" class="run-status-badge">RUN COMPLETE</div>
          <h1 class="victory-title">THE FESTIVAL LIGHTS AGAIN!</h1>
          <h2 class="victory-subtitle">Ganpati Bappa Morya!</h2>
          <p class="victory-blessing">Lord Ganesha has bestowed His divine grace upon you. You have restored light and joy to the world.</p>

          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Current Score</span>
              <span id="stat-score" class="stat-val">0</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Personal Best</span>
              <span id="stat-personal-best" class="stat-val">0</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Completion Time</span>
              <span id="stat-time" class="stat-val">--:--</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Blessings Collected</span>
              <span id="stat-blessings" class="stat-val">0/20</span>
            </div>
          </div>

          <div class="victory-buttons">
            <button id="btn-play-again" class="btn-primary">PLAY AGAIN</button>
            <button id="btn-victory-leaderboard" class="btn-secondary">VIEW LEADERBOARD</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Google Sign-In button click
    document.getElementById('btn-google-login').addEventListener('click', () => {
      if (this.onGoogleLoginClick) this.onGoogleLoginClick();
    });

    // User Account Menu Dropdown Toggle
    const userBadge = document.getElementById('user-badge');
    const userDropdown = document.getElementById('user-dropdown-menu');
    userBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', () => {
      userDropdown.classList.add('hidden');
    });

    // Dropdown Items
    document.getElementById('btn-dropdown-profile').addEventListener('click', () => {
      userDropdown.classList.add('hidden');
      this.showModal('modal-profile');
    });

    document.getElementById('btn-dropdown-leaderboard').addEventListener('click', () => {
      userDropdown.classList.add('hidden');
      if (this.onViewLeaderboard) this.onViewLeaderboard();
      this.showModal('modal-leaderboard');
    });

    document.getElementById('btn-dropdown-settings').addEventListener('click', () => {
      userDropdown.classList.add('hidden');
      this.showModal('modal-settings');
    });

    document.getElementById('btn-dropdown-logout').addEventListener('click', () => {
      userDropdown.classList.add('hidden');
      if (this.onLogoutClick) this.onLogoutClick();
    });

    document.getElementById('btn-close-profile').addEventListener('click', () => {
      this.hideModal('modal-profile');
    });

    // Main Menu Buttons
    document.getElementById('btn-play').addEventListener('click', () => {
      if (this.onStartGame) this.onStartGame();
    });

    document.getElementById('btn-howtoplay').addEventListener('click', () => {
      this.showModal('modal-howtoplay');
    });

    document.getElementById('btn-close-howtoplay').addEventListener('click', () => {
      this.hideModal('modal-howtoplay');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showModal('modal-settings');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.hideModal('modal-settings');
    });

    document.getElementById('btn-leaderboard').addEventListener('click', () => {
      if (this.onViewLeaderboard) this.onViewLeaderboard();
      this.showModal('modal-leaderboard');
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
      this.hideModal('modal-leaderboard');
    });

    document.getElementById('btn-credits').addEventListener('click', () => {
      this.showModal('modal-credits');
    });

    document.getElementById('btn-close-credits').addEventListener('click', () => {
      this.hideModal('modal-credits');
    });

    // Pause Menu Buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      if (this.onResumeGame) this.onResumeGame();
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      this.showModal('modal-settings');
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
      window.location.reload();
    });

    // Settings Sliders
    document.getElementById('setting-master').addEventListener('input', (e) => {
      if (this.onSettingsChange) this.onSettingsChange('master', parseFloat(e.target.value));
    });

    document.getElementById('setting-music').addEventListener('input', (e) => {
      if (this.onSettingsChange) this.onSettingsChange('music', parseFloat(e.target.value));
    });

    document.getElementById('setting-sfx').addEventListener('input', (e) => {
      if (this.onSettingsChange) this.onSettingsChange('sfx', parseFloat(e.target.value));
    });

    document.getElementById('setting-sens').addEventListener('input', (e) => {
      if (this.onSettingsChange) this.onSettingsChange('sens', parseFloat(e.target.value));
    });

    document.getElementById('btn-toggle-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Ability Button Click
    document.getElementById('btn-ability').addEventListener('click', () => {
      if (this.onAbilityClick) this.onAbilityClick();
    });

    // Mobile Action buttons
    document.getElementById('touch-jump').addEventListener('click', () => {
      if (this.onJumpClick) this.onJumpClick();
    });

    document.getElementById('touch-interact').addEventListener('click', () => {
      if (this.onInteractClick) this.onInteractClick();
    });

    // Rangoli Puzzle Buttons & Direct Ring Clicks
    const rotateOuter = () => { if (this.onRangoliRotate) this.onRangoliRotate('outer'); };
    const rotateMid = () => { if (this.onRangoliRotate) this.onRangoliRotate('mid'); };
    const rotateInner = () => { if (this.onRangoliRotate) this.onRangoliRotate('inner'); };

    document.getElementById('btn-rotate-outer').addEventListener('click', rotateOuter);
    document.getElementById('btn-rotate-mid').addEventListener('click', rotateMid);
    document.getElementById('btn-rotate-inner').addEventListener('click', rotateInner);

    document.getElementById('rangoli-outer-ring').addEventListener('click', (e) => {
      if (e.target.closest('#rangoli-mid-ring')) return;
      rotateOuter();
    });
    document.getElementById('rangoli-mid-ring').addEventListener('click', (e) => {
      if (e.target.closest('#rangoli-inner-ring')) return;
      rotateMid();
    });
    document.getElementById('rangoli-inner-ring').addEventListener('click', () => {
      rotateInner();
    });

    // Keyboard 1, 2, 3 shortcuts while modal is open
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modal-rangoli');
      if (modal && !modal.classList.contains('hidden')) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') rotateOuter();
        else if (e.code === 'Digit2' || e.code === 'Numpad2') rotateMid();
        else if (e.code === 'Digit3' || e.code === 'Numpad3') rotateInner();
        else if (e.code === 'Escape') this.closeRangoliModal();
      }
    });

    document.getElementById('btn-close-rangoli').addEventListener('click', () => {
      this.closeRangoliModal();
    });

    // Victory Buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('btn-victory-leaderboard').addEventListener('click', () => {
      if (this.onViewLeaderboard) this.onViewLeaderboard();
      this.showModal('modal-leaderboard');
    });

    // Mobile Virtual Joystick Setup
    this.initTouchJoystick();
  }

  initTouchJoystick() {
    const zone = document.getElementById('joystick-zone');
    const stick = document.getElementById('joystick-stick');
    if (!zone || !stick) return;

    let touchId = null;
    let originX = 0;
    let originY = 0;
    const maxRadius = 40;

    zone.addEventListener('touchstart', (e) => {
      if (touchId === null) {
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = zone.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
      }
    }, { passive: true });

    zone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          let dx = touch.clientX - originX;
          let dy = touch.clientY - originY;
          const dist = Math.hypot(dx, dy);

          if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
          }

          stick.style.transform = `translate(${dx}px, ${dy}px)`;
          if (this.onJoystickMove) {
            this.onJoystickMove(dx / maxRadius, dy / maxRadius);
          }
        }
      }
    }, { passive: true });

    const endJoystick = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          stick.style.transform = 'translate(0px, 0px)';
          if (this.onJoystickMove) this.onJoystickMove(0, 0);
        }
      }
    };

    zone.addEventListener('touchend', endJoystick, { passive: true });
    zone.addEventListener('touchcancel', endJoystick, { passive: true });
  }

  showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  hideLoginScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('hidden');
  }

  showMainMenu() {
    this.hideLoginScreen();
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('main-menu').classList.add('active');
    document.getElementById('hud').classList.add('hidden');
  }

  hideMainMenu() {
    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  updateUserProfile(user, progress) {
    if (!user) return;

    // Header user badge
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.innerText = user.name || 'Devotee';

    const avatarImg = document.getElementById('user-avatar');
    const avatarFallback = document.getElementById('user-avatar-fallback');
    if (user.avatarUrl && avatarImg) {
      avatarImg.src = user.avatarUrl;
      avatarImg.classList.remove('hidden');
      if (avatarFallback) avatarFallback.classList.add('hidden');
    }

    // Profile modal
    const pName = document.getElementById('profile-modal-name');
    if (pName) pName.innerText = user.name || 'Devotee';

    const pEmail = document.getElementById('profile-modal-email');
    if (pEmail) pEmail.innerText = user.email || '';

    const pAvatar = document.getElementById('profile-modal-avatar');
    const pFallback = document.getElementById('profile-avatar-fallback');
    if (user.avatarUrl && pAvatar) {
      pAvatar.src = user.avatarUrl;
      pAvatar.classList.remove('hidden');
      if (pFallback) pFallback.classList.add('hidden');
    }

    if (progress) {
      const pScore = document.getElementById('profile-stat-score');
      if (pScore) pScore.innerText = progress.highest_score || 0;

      const pTime = document.getElementById('profile-stat-time');
      if (pTime) {
        if (progress.best_completion_time) {
          const m = Math.floor(progress.best_completion_time / 60);
          const s = Math.floor(progress.best_completion_time % 60);
          pTime.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
          pTime.innerText = '--:--';
        }
      }

      const pBlessings = document.getElementById('profile-stat-blessings');
      if (pBlessings) pBlessings.innerText = progress.total_blessings || 0;

      const pGames = document.getElementById('profile-stat-games');
      if (pGames) pGames.innerText = progress.games_completed || 0;
    }

    const pDate = document.getElementById('profile-created-date');
    if (pDate && user.createdAt) {
      pDate.innerText = new Date(user.createdAt).toLocaleDateString();
    }
  }

  showIntroOverlay(onSkip) {
    const intro = document.getElementById('intro-overlay');
    intro.classList.remove('hidden');
    intro.classList.add('active');

    const skipBtn = document.getElementById('btn-skip-intro');
    const handleSkip = () => {
      intro.classList.remove('active');
      intro.classList.add('hidden');
      if (onSkip) onSkip();
      skipBtn.removeEventListener('click', handleSkip);
    };
    skipBtn.addEventListener('click', handleSkip);
  }

  hideIntroOverlay() {
    const intro = document.getElementById('intro-overlay');
    intro.classList.remove('active');
    intro.classList.add('hidden');
  }

  showEndingOverlay() {
    document.getElementById('hud').classList.add('hidden');
  }

  showVictory({ score, personalBest, isNewPersonalBest, timeFormatted, blessings }) {
    const badge = document.getElementById('victory-run-badge');
    if (badge) {
      badge.innerText = isNewPersonalBest ? '🌟 NEW PERSONAL BEST! 🌟' : 'RUN COMPLETE';
      badge.className = isNewPersonalBest ? 'run-status-badge badge-record' : 'run-status-badge';
    }

    const scoreEl = document.getElementById('stat-score');
    if (scoreEl) scoreEl.innerText = score;

    const pbEl = document.getElementById('stat-personal-best');
    if (pbEl) pbEl.innerText = personalBest;

    const timeEl = document.getElementById('stat-time');
    if (timeEl) timeEl.innerText = timeFormatted;

    const bEl = document.getElementById('stat-blessings');
    if (bEl) bEl.innerText = `${blessings}/20`;

    const overlay = document.getElementById('victory-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('active');
  }

  showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  showPauseMenu() {
    this.showModal('modal-pause');
  }

  hidePauseMenu() {
    this.hideModal('modal-pause');
  }

  openRangoliModal() {
    this.showModal('modal-rangoli');
  }

  closeRangoliModal() {
    this.hideModal('modal-rangoli');
  }

  updateRangoliVisual(innerAngle, midAngle, outerAngle) {
    const outerEl = document.getElementById('rangoli-outer-ring');
    const midEl = document.getElementById('rangoli-mid-ring');
    const innerEl = document.getElementById('rangoli-inner-ring');

    if (outerEl) outerEl.style.transform = `rotate(${outerAngle}deg)`;
    if (midEl) midEl.style.transform = `rotate(${midAngle}deg)`;
    if (innerEl) innerEl.style.transform = `rotate(${innerAngle}deg)`;

    const isOuterAligned = outerAngle % 360 === 0;
    const isMidAligned = midAngle % 360 === 0;
    const isInnerAligned = innerAngle % 360 === 0;

    const sOuter = document.getElementById('status-outer');
    if (sOuter) {
      sOuter.className = `ring-status ${isOuterAligned ? 'status-aligned' : 'status-pending'}`;
      sOuter.innerText = isOuterAligned ? 'Outer: ALIGNED ✓' : `Outer: ${(360 - outerAngle) % 360}° Away`;
    }
    if (outerEl) {
      if (isOuterAligned) outerEl.classList.add('ring-aligned');
      else outerEl.classList.remove('ring-aligned');
    }

    const sMid = document.getElementById('status-mid');
    if (sMid) {
      sMid.className = `ring-status ${isMidAligned ? 'status-aligned' : 'status-pending'}`;
      sMid.innerText = isMidAligned ? 'Mid: ALIGNED ✓' : `Mid: ${(360 - midAngle) % 360}° Away`;
    }
    if (midEl) {
      if (isMidAligned) midEl.classList.add('ring-aligned');
      else midEl.classList.remove('ring-aligned');
    }

    const sInner = document.getElementById('status-inner');
    if (sInner) {
      sInner.className = `ring-status ${isInnerAligned ? 'status-aligned' : 'status-pending'}`;
      sInner.innerText = isInnerAligned ? 'Inner: ALIGNED ✓' : `Inner: ${(360 - innerAngle) % 360}° Away`;
    }
    if (innerEl) {
      if (isInnerAligned) innerEl.classList.add('ring-aligned');
      else innerEl.classList.remove('ring-aligned');
    }
  }

  setObjective(text) {
    const el = document.getElementById('objective-title');
    if (el) el.innerText = text;
  }

  updateBlessings(current, total, score) {
    const bCurrent = document.getElementById('blessings-current');
    const sEl = document.getElementById('hud-score');
    if (bCurrent) bCurrent.innerText = current;
    if (sEl) sEl.innerText = score;
  }

  updateAbilityUI(isActive, activeProgress, cooldownProgress) {
    const overlay = document.getElementById('ability-cooldown-overlay');
    const btn = document.getElementById('btn-ability');
    if (!overlay || !btn) return;

    if (isActive) {
      btn.classList.add('active-surge');
      overlay.style.height = '0%';
    } else {
      btn.classList.remove('active-surge');
      if (cooldownProgress > 0) {
        overlay.style.height = `${cooldownProgress * 100}%`;
        btn.disabled = true;
      } else {
        overlay.style.height = '0%';
        btn.disabled = false;
      }
    }
  }

  showPrompt(label) {
    const p = document.getElementById('interaction-prompt');
    const l = document.getElementById('prompt-label');
    if (p && l) {
      l.innerText = label;
      p.classList.remove('hidden');
    }
  }

  hidePrompt() {
    const p = document.getElementById('interaction-prompt');
    if (p) p.classList.add('hidden');
  }

  showToast(message, duration = 2500) {
    const t = document.getElementById('hud-toast');
    if (!t) return;
    t.innerText = message;
    t.classList.remove('hidden');
    t.classList.add('toast-active');

    setTimeout(() => {
      t.classList.remove('toast-active');
      t.classList.add('hidden');
    }, duration);
  }

  showBanner(message, duration = 3500) {
    this.showToast(`✨ ${message}`, duration);
  }

  showDivineGuidance(message, duration = 5000) {
    const el = document.getElementById('divine-guidance');
    const txt = document.getElementById('guidance-text');
    if (!el || !txt) return;

    if (this.dialogueTimeout) clearTimeout(this.dialogueTimeout);

    txt.innerText = `"${message}"`;
    el.classList.remove('hidden');
    el.classList.add('guidance-active');

    this.dialogueTimeout = setTimeout(() => {
      el.classList.remove('guidance-active');
      el.classList.add('hidden');
    }, duration);
  }

  showLoginError(message) {
    const el = document.getElementById('login-error');
    if (el) {
      el.innerText = message;
      el.classList.remove('hidden');
    }
  }

  renderLeaderboard(entries) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    if (!entries || entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 20px; color: #AAA; font-style: italic;">
            No sacred journey records yet. Be the first devotee to complete the quest!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = entries.map((entry) => `
      <tr>
        <td>#${entry.rank}</td>
        <td>
          <div class="leaderboard-player-cell">
            ${entry.avatarUrl ? `<img class="leaderboard-avatar" src="${entry.avatarUrl}" alt="Avatar" />` : `<span class="leaderboard-avatar-fallback">🪔</span>`}
            <span class="leaderboard-player-name">${entry.name}</span>
          </div>
        </td>
        <td><strong>${entry.score}</strong></td>
        <td>${entry.time}</td>
        <td>${entry.blessings}</td>
      </tr>
    `).join('');
  }
}

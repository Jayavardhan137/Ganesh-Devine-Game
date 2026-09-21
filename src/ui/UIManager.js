/**
 * UIManager manages the entire DOM UI:
 * - Cinematic Main Menu (Play, How to Play, Leaderboard, Settings, Credits)
 * - In-game HUD (Objective, Blessings counter, Ability cooldown, Interaction prompts)
 * - Ganesha Divine Guidance dialogue subtitles
 * - Interactive Rangoli Puzzle modal
 * - Mobile virtual joystick and touch buttons
 * - Pause menu
 * - Victory celebration screen with statistics and leaderboard entry
 */
export class UIManager {
  constructor() {
    this.container = document.getElementById('ui-container');

    // Callbacks to be hooked by GameManager
    this.onStartGame = null;
    this.onResumeGame = null;
    this.onRestartGame = null;
    this.onSettingsChange = null;
    this.onLeaderboardSubmit = null;
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
      <!-- CINEMATIC MAIN MENU -->
      <div id="main-menu" class="screen-overlay active">
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

      <!-- LEADERBOARD MODAL -->
      <div id="modal-leaderboard" class="modal-overlay hidden">
        <div class="modal-card">
          <h2 class="modal-title">SACRED DEVOTEES LEADERBOARD</h2>
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Devotee Name</th>
                <th>Blessings</th>
                <th>Time</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
          <button id="btn-close-leaderboard" class="btn-primary">CLOSE</button>
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
          <h1 class="victory-title">THE FESTIVAL LIGHTS AGAIN!</h1>
          <h2 class="victory-subtitle">Ganpati Bappa Morya!</h2>
          <p class="victory-blessing">Lord Ganesha has bestowed His divine grace upon you. You have restored light and joy to the world.</p>

          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Blessings Collected</span>
              <span id="stat-blessings" class="stat-val">20/20</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Completion Time</span>
              <span id="stat-time" class="stat-val">04:32</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Puzzles Completed</span>
              <span id="stat-puzzles" class="stat-val">3/3</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Total Score</span>
              <span id="stat-score" class="stat-val">4250</span>
            </div>
          </div>

          <div class="name-entry-wrap">
            <input type="text" id="player-name-input" placeholder="Enter Devotee Name" maxlength="16" value="Devotee">
            <button id="btn-submit-score" class="btn-primary">SUBMIT SCORE</button>
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
    // Menu Buttons
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
      this.showModal('modal-leaderboard');
    });

    document.getElementById('btn-submit-score').addEventListener('click', () => {
      const name = document.getElementById('player-name-input').value.trim() || 'Devotee';
      if (this.onLeaderboardSubmit) this.onLeaderboardSubmit(name);
      document.getElementById('btn-submit-score').innerText = 'SUBMITTED! ✓';
      document.getElementById('btn-submit-score').disabled = true;
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

  showMainMenu() {
    document.getElementById('main-menu').classList.add('active');
    document.getElementById('hud').classList.add('hidden');
  }

  hideMainMenu() {
    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('hud').classList.remove('hidden');
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

  showVictory(stats) {
    document.getElementById('stat-blessings').innerText = `${stats.blessings}/20`;
    document.getElementById('stat-time').innerText = stats.timeFormatted;
    document.getElementById('stat-puzzles').innerText = `${stats.puzzles}/3`;
    document.getElementById('stat-score').innerText = stats.score;

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

    // Outer Ring Feedback
    const sOuter = document.getElementById('status-outer');
    if (sOuter) {
      sOuter.className = `ring-status ${isOuterAligned ? 'status-aligned' : 'status-pending'}`;
      sOuter.innerText = isOuterAligned ? 'Outer: ALIGNED ✓' : `Outer: ${(360 - outerAngle) % 360}° Away`;
    }
    if (outerEl) {
      if (isOuterAligned) outerEl.classList.add('ring-aligned');
      else outerEl.classList.remove('ring-aligned');
    }

    // Mid Ring Feedback
    const sMid = document.getElementById('status-mid');
    if (sMid) {
      sMid.className = `ring-status ${isMidAligned ? 'status-aligned' : 'status-pending'}`;
      sMid.innerText = isMidAligned ? 'Mid: ALIGNED ✓' : `Mid: ${(360 - midAngle) % 360}° Away`;
    }
    if (midEl) {
      if (isMidAligned) midEl.classList.add('ring-aligned');
      else midEl.classList.remove('ring-aligned');
    }

    // Inner Ring Feedback
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

  renderLeaderboard(entries) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    tbody.innerHTML = entries.map((entry, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.blessings}/20</td>
        <td>${entry.time}</td>
        <td><strong>${entry.score}</strong></td>
      </tr>
    `).join('');
  }
}

/**
 * AbilityManager controls the "Vighnaharta Blessing" divine power:
 * - 8 seconds duration
 * - 20 seconds cooldown
 * - Speed surge (1.5x)
 * - Highlights distant collectibles
 * - Slows rotating/moving obstacles
 * - Golden particle trail & divine audio
 */
export class AbilityManager {
  constructor(audio, particles, collectibles, environment, ui) {
    this.audio = audio;
    this.particles = particles;
    this.collectibles = collectibles;
    this.env = environment;
    this.ui = ui;

    this.duration = 8.0;
    this.cooldown = 20.0;

    this.isActive = false;
    this.activeTimer = 0;
    this.cooldownTimer = 0;
  }

  canActivate() {
    return !this.isActive && this.cooldownTimer <= 0;
  }

  activate() {
    if (!this.canActivate()) return false;

    this.isActive = true;
    this.activeTimer = this.duration;
    this.cooldownTimer = this.cooldown;

    this.audio.playAbilityActive();
    this.ui.showToast('✨ Vighnaharta Blessing Activated! (Speed + Radar)', 2500);

    // Slow moving obstacles by 50%
    for (let p of this.env.movingPlatforms) {
      p.origSpeed = p.rotSpeed;
      p.rotSpeed *= 0.4;
    }

    return true;
  }

  update(delta, playerPos) {
    // Active timer countdown
    if (this.isActive) {
      this.activeTimer -= delta;

      // Golden trail and highlight collectibles
      this.particles.emitTrail(playerPos);
      this.collectibles.highlightNearby(playerPos, 50);

      if (this.activeTimer <= 0) {
        this.deactivate();
      }
    }

    // Cooldown timer countdown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer < 0) this.cooldownTimer = 0;
    }

    // Update UI button cooldown indicator
    this.ui.updateAbilityUI(this.isActive, this.activeTimer / this.duration, this.cooldownTimer / this.cooldown);
  }

  deactivate() {
    this.isActive = false;
    this.activeTimer = 0;
    this.particles.hideTrail();
    this.collectibles.resetHighlights();

    // Restore obstacle speeds
    for (let p of this.env.movingPlatforms) {
      if (p.origSpeed !== undefined) {
        p.rotSpeed = p.origSpeed;
      }
    }
  }
}

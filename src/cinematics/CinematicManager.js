import * as THREE from 'three';

/**
 * CinematicManager handles:
 * - 15-second Intro sequence sweeping down the festival street with title card & skip button
 * - 20-second Grand Ending Climax with 3D fireworks, marigold blizzard, Ganesha blessing, and victory fanfare
 */
export class CinematicManager {
  constructor(cameraController, ganeshaModel, particleEngine, audioManager, uiManager) {
    this.cam = cameraController;
    this.ganesha = ganeshaModel;
    this.particles = particleEngine;
    this.audio = audioManager;
    this.ui = uiManager;

    this.isPlaying = false;
    this.cinematicType = null; // 'intro' or 'ending'
    this.timer = 0;
    this.duration = 15;
    this.onCompleteCallback = null;

    this.fireworkTimer = 0;
  }

  playIntro(onComplete) {
    this.isPlaying = true;
    this.cinematicType = 'intro';
    this.timer = 0;
    this.duration = 14.0;
    this.onCompleteCallback = onComplete;

    this.cam.setCinematic(true);
    this.audio.playShankha();
    this.audio.playTempleBell(1.0);

    this.ui.showIntroOverlay(() => this.skip());
  }

  playEnding(onComplete) {
    this.isPlaying = true;
    this.cinematicType = 'ending';
    this.timer = 0;
    this.duration = 20.0;
    this.onCompleteCallback = onComplete;

    this.cam.setCinematic(true);
    this.audio.setCelebrationMode(true);
    this.audio.playShankha();
    this.ganesha.triggerBlessingGesture();

    this.ui.showEndingOverlay();
  }

  skip() {
    if (!this.isPlaying) return;
    this.finish();
  }

  finish() {
    this.isPlaying = false;
    this.cam.setCinematic(false);
    this.ui.hideIntroOverlay();

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  update(delta) {
    if (!this.isPlaying) return;

    this.timer += delta;

    if (this.cinematicType === 'intro') {
      // Intro camera path: swoops from entrance (z: -12) toward temple gate (z: 38)
      const progress = Math.min(1.0, this.timer / this.duration);
      const camZ = -10 + progress * 48;
      const camY = 4.5 + Math.sin(progress * Math.PI) * 1.5;
      const camX = Math.sin(progress * 4) * 2.0;

      this.cam.camera.position.set(camX, camY, camZ);
      this.cam.camera.lookAt(0, 2.5, camZ + 14);

      if (this.timer >= this.duration) {
        this.finish();
      }
    } else if (this.cinematicType === 'ending') {
      // Ending camera path: cinematic orbit around grand Lord Ganesha shrine (x: 0, z: 185)
      const progress = Math.min(1.0, this.timer / this.duration);
      const orbitAngle = this.timer * 0.45;
      const radius = 16.0;

      const camX = Math.sin(orbitAngle) * radius;
      const camZ = 184 + Math.cos(orbitAngle) * radius;
      const camY = 7.0 + Math.sin(this.timer * 0.6) * 2.0;

      this.cam.camera.position.set(camX, camY, camZ);
      this.cam.camera.lookAt(0, 4.0, 185);

      // Launch continuous 3D fireworks
      this.fireworkTimer += delta;
      if (this.fireworkTimer >= 0.45) {
        this.fireworkTimer = 0;
        const fx = (Math.random() - 0.5) * 40;
        const fy = 18 + Math.random() * 12;
        const fz = 175 + Math.random() * 25;
        const colors = [0xFFD700, 0xFF3366, 0x00F5D4, 0xFF9F1C, 0x9B5DE5];
        const col = colors[Math.floor(Math.random() * colors.length)];
        this.particles.launchFirework(fx, fy, fz, col);
        this.audio.playFirework();
      }

      if (this.timer >= this.duration) {
        this.finish();
      }
    }
  }
}

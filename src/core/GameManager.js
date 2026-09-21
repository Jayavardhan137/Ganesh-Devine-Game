import * as THREE from 'three';
import { TextureFactory } from '../engine/TextureFactory.js';
import { ParticleEngine } from '../engine/ParticleEngine.js';
import { AudioManager } from '../audio/AudioManager.js';
import { GaneshaModel } from '../models/GaneshaModel.js';
import { DevoteeModel } from '../models/DevoteeModel.js';
import { EnvironmentBuilder } from '../world/EnvironmentBuilder.js';
import { CameraController } from '../player/CameraController.js';
import { PlayerController } from '../player/PlayerController.js';
import { AbilityManager } from '../player/AbilityManager.js';
import { CollectibleManager } from '../gameplay/CollectibleManager.js';
import { PuzzleManager } from '../gameplay/PuzzleManager.js';
import { SaveManager } from './SaveManager.js';
import { UIManager } from '../ui/UIManager.js';
import { CinematicManager } from '../cinematics/CinematicManager.js';

export const GameState = {
  MENU: 'MENU',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  PUZZLE: 'PUZZLE',
  PAUSED: 'PAUSED',
  ENDING: 'ENDING',
  VICTORY: 'VICTORY'
};

/**
 * GameManager is the master orchestrator coordinating:
 * - Three.js WebGL rendering loop
 * - State machine (MENU -> INTRO -> PLAYING -> PUZZLE -> ENDING -> VICTORY)
 * - Level progression across 4 Sacred Zones
 * - Scoring & Time bonus
 * - Checkpoints & Respawning
 */
export class GameManager {
  constructor() {
    this.state = GameState.MENU;
    this.stage = 1;

    this.score = 0;
    this.startTime = 0;
    this.completionTime = 0;
    this.puzzlesSolvedCount = 0;

    this.clock = new THREE.Clock();

    this.initCore();
    this.setupProgression();
    this.bindUI();

    // Start rendering loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCore() {
    // 1. Scene & Camera & Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x180D2B, 0.007);

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    // 2. Core Subsystems
    this.saveManager = new SaveManager();
    this.textures = new TextureFactory();
    this.particles = new ParticleEngine(this.scene);
    this.audio = new AudioManager();
    this.ui = new UIManager();

    // Apply saved settings
    const saved = this.saveManager.data.settings;
    if (saved) {
      this.audio.setMasterVolume(saved.masterVolume);
      this.audio.setMusicVolume(saved.musicVolume);
      this.audio.setSfxVolume(saved.sfxVolume);
    }

    // 3. Environment & Models
    this.environment = new EnvironmentBuilder(this.scene, this.textures, this.particles);

    // Lord Ganesha 3D Model seated majestically on Festival Stage
    this.ganesha = new GaneshaModel();
    this.ganesha.group.position.set(0, 1.8, 185); // Grand shrine
    this.ganesha.group.rotation.y = Math.PI; // facing devotees
    this.scene.add(this.ganesha.group);

    // Devotee Player Character
    this.devotee = new DevoteeModel();
    this.scene.add(this.devotee.group);

    // 4. Controllers
    this.camController = new CameraController(this.camera, this.renderer.domElement);
    this.player = new PlayerController(this.devotee, this.camController, this.environment, this.audio);
    this.player.setCheckpoint(this.environment.checkpoints[0]);

    // 5. Gameplay Managers
    this.collectibles = new CollectibleManager(this.scene, this.particles, this.audio);
    this.ability = new AbilityManager(this.audio, this.particles, this.collectibles, this.environment, this.ui);
    this.puzzles = new PuzzleManager(this.environment, this.audio, this.ui);
    this.cinematics = new CinematicManager(this.camController, this.ganesha, this.particles, this.audio, this.ui);

    // Resize listener
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Populate Leaderboard
    this.ui.renderLeaderboard(this.saveManager.getLeaderboard());

    // Menu Camera idle placement
    this.camera.position.set(0, 6, -14);
    this.camera.lookAt(0, 3, 20);
  }

  bindUI() {
    this.ui.onStartGame = () => this.startGame();
    this.ui.onResumeGame = () => this.resumeGame();
    this.ui.onAbilityClick = () => this.ability.activate();
    this.ui.onJumpClick = () => this.player.jump();
    this.ui.onInteractClick = () => this.handlePlayerInteraction();

    this.ui.onJoystickMove = (x, y) => {
      this.player.joystickInput.x = x;
      this.player.joystickInput.y = y;
    };

    this.ui.onRangoliRotate = (ring) => {
      this.puzzles.rotateRangoliRing(ring);
      this.ui.updateRangoliVisual(
        this.puzzles.rangoli.innerAngle,
        this.puzzles.rangoli.midAngle,
        this.puzzles.rangoli.outerAngle
      );
    };

    this.ui.onSettingsChange = (type, val) => {
      if (type === 'master') this.audio.setMasterVolume(val);
      if (type === 'music') this.audio.setMusicVolume(val);
      if (type === 'sfx') this.audio.setSfxVolume(val);
      if (type === 'sens') this.camController.sensitivity = 0.0032 * val;
    };

    this.ui.onLeaderboardSubmit = (name) => {
      const list = this.saveManager.addLeaderboardEntry(
        name,
        this.score,
        this.completionTime,
        this.collectibles.collectedCount
      );
      this.ui.renderLeaderboard(list);
    };

    // ESC to pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state === GameState.PLAYING) this.pauseGame();
        else if (this.state === GameState.PAUSED) this.resumeGame();
      } else if (e.code === 'KeyQ') {
        if (this.state === GameState.PLAYING) this.ability.activate();
      } else if (e.code === 'KeyE') {
        if (this.state === GameState.PLAYING) this.handlePlayerInteraction();
      }
    });
  }

  setupProgression() {
    // Collectible pickup callback (+100 score)
    this.collectibles.onCollectCallback = (count, total, item) => {
      this.score += 100;
      this.ui.updateBlessings(count, total, this.score);
      this.ui.showToast(`✨ Picked up ${item.name}! (+100)`);

      // Stage progression checks
      if (this.stage === 1 && count >= 5) {
        this.stage = 2;
        this.ui.setObjective('Stage 2: Solve the Rangoli Mandala to open Temple Gate');
        this.ui.showDivineGuidance('Look carefully. The path is hidden in plain sight.');
      } else if (this.stage === 3 && count >= 10) {
        this.ui.setObjective('Stage 3: Strike the 4 Sacred Bells (Om → Lotus → Trishul → Swastika)');
      }
    };

    // Puzzle solved callback (+500 score)
    this.puzzles.onPuzzleSolvedCallback = (puzzleIndex, puzzleName) => {
      this.score += 500;
      this.puzzlesSolvedCount++;
      this.ui.updateBlessings(this.collectibles.collectedCount, this.collectibles.totalCount, this.score);

      if (puzzleIndex === 1) {
        this.stage = 3;
        this.ui.setObjective('Stage 3: Cross the Sacred Garden & ring the 4 Sacred Bells');
        this.ui.showDivineGuidance('Your devotion and patience light the way.');
      } else if (puzzleIndex === 2) {
        this.stage = 4;
        this.ui.setObjective('Stage 4: Reach the Festival Stage & Light the 5 Sacred Diyas');
        this.ui.showDivineGuidance('Every obstacle has been overcome. The sacred shrine awaits.');
      } else if (puzzleIndex === 3) {
        this.ui.setObjective('Final Quest: Restore the Divine Festival Flame!');
      }
    };
  }

  startGame() {
    this.audio.init();
    this.audio.startMusic();
    this.ui.hideMainMenu();

    this.state = GameState.INTRO;
    this.cinematics.playIntro(() => {
      this.state = GameState.PLAYING;
      this.startTime = performance.now();
      this.player.position.set(0, 0, 0);
      this.ui.setObjective('Stage 1: Collect 5 Blessings in Festival Street');
      this.ui.showDivineGuidance('Every obstacle can be overcome with wisdom.');
    });
  }

  pauseGame() {
    this.state = GameState.PAUSED;
    this.ui.showPauseMenu();
  }

  resumeGame() {
    this.state = GameState.PLAYING;
    this.ui.hidePauseMenu();
  }

  handlePlayerInteraction() {
    const playerPos = this.player.position;

    // Check interaction with Environment interactables (bells, rangoli, diyas, altar)
    for (let item of this.environment.interactables) {
      if (item.position && playerPos.distanceTo(item.position) <= (item.radius || 2.8)) {
        if (item.type === 'puzzle_trigger' && !this.puzzles.rangoli.isSolved) {
          this.ui.openRangoliModal();
          this.ui.updateRangoliVisual(
            this.puzzles.rangoli.innerAngle,
            this.puzzles.rangoli.midAngle,
            this.puzzles.rangoli.outerAngle
          );
          return;
        } else if (item.type === 'bell') {
          this.puzzles.ringBell(item);
          return;
        } else if (item.type === 'sacred_diya') {
          this.puzzles.lightDiya(item);
          return;
        }
      }
    }

    // Check if player is near the Divine Flame Altar to restore the flame!
    if (this.puzzles.diyaPuzzleSolved && !this.environment.flameAltarObj.isIgnited) {
      const distToAltar = playerPos.distanceTo(this.environment.flameAltarObj.position);
      if (distToAltar <= 4.0) {
        this.triggerGrandFinale();
      }
    }
  }

  triggerGrandFinale() {
    this.environment.flameAltarObj.ignite();
    this.audio.playLightDiya();
    this.state = GameState.ENDING;

    this.completionTime = (performance.now() - this.startTime) / 1000;
    const timeBonus = Math.max(0, Math.floor(1800 - this.completionTime * 3));
    this.score += 1000 + timeBonus;

    const mins = Math.floor(this.completionTime / 60);
    const secs = Math.floor(this.completionTime % 60);
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Play 20-second cinematic finale
    this.cinematics.playEnding(() => {
      this.state = GameState.VICTORY;
      this.ui.showVictory({
        blessings: this.collectibles.collectedCount,
        timeFormatted,
        puzzles: this.puzzlesSolvedCount,
        score: this.score
      });
      this.saveManager.updateProgress(
        this.score,
        this.completionTime,
        this.collectibles.collectedCount,
        4
      );
    });
  }

  checkCheckpoints() {
    const playerPos = this.player.position;
    for (let cp of this.environment.checkpoints) {
      if (!cp.reached && playerPos.distanceTo(cp.position) <= cp.radius) {
        cp.reached = true;
        this.player.setCheckpoint(cp);
        this.audio.playCheckpoint();
        this.ui.showBanner(`Checkpoint Reached: ${cp.name}`);
      }
    }
  }

  updateInteractionPrompts() {
    const playerPos = this.player.position;
    let foundPrompt = null;

    // Check environment triggers
    for (let item of this.environment.interactables) {
      if (item.position && playerPos.distanceTo(item.position) <= (item.radius || 2.8)) {
        if (item.type === 'puzzle_trigger' && !this.puzzles.rangoli.isSolved) {
          foundPrompt = item.prompt;
          break;
        } else if (item.type === 'bell') {
          foundPrompt = item.prompt;
          break;
        } else if (item.type === 'sacred_diya' && !item.isLit) {
          foundPrompt = item.prompt;
          break;
        }
      }
    }

    // Check Altar prompt
    if (this.puzzles.diyaPuzzleSolved && !this.environment.flameAltarObj.isIgnited) {
      if (playerPos.distanceTo(this.environment.flameAltarObj.position) <= 4.0) {
        foundPrompt = '[E] Restore the Divine Festival Flame!';
      }
    }

    if (foundPrompt) {
      this.ui.showPrompt(foundPrompt);
    } else {
      this.ui.hidePrompt();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Ganesha and Environment Animations
    this.ganesha.update(delta, time);
    this.environment.update(delta, time);
    this.particles.update(delta, time);

    // 2. State-specific Updates
    if (this.state === GameState.PLAYING) {
      this.player.update(delta, this.ability.isActive);
      this.camController.update(delta, this.player.position, this.player.keys.sprint, this.ability.isActive);
      this.collectibles.update(delta, time, this.player.position);
      this.ability.update(delta, this.player.position);
      this.checkCheckpoints();
      this.updateInteractionPrompts();
    } else if (this.state === GameState.INTRO || this.state === GameState.ENDING) {
      this.cinematics.update(delta);
    } else if (this.state === GameState.MENU) {
      // Gentle orbit camera in menu
      this.camera.position.x = Math.sin(time * 0.15) * 12;
      this.camera.position.z = -12 + Math.cos(time * 0.15) * 6;
      this.camera.position.y = 5.5 + Math.sin(time * 0.2) * 1.0;
      this.camera.lookAt(0, 2.5, 20);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

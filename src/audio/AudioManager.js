/**
 * AudioManager provides a rich, self-contained Indian classical & festival soundscape using the Web Audio API.
 * Features:
 * - Meditative Tanpura drone with rich harmonics
 * - Bansuri (Indian bamboo flute) modal melodies in Raga Bhoopali / Bilawal
 * - Dholak / Tabla rhythmic festival percussion
 * - Resonant struck bronze temple bells
 * - Conch shell (Shankha) auspicious call
 * - Interactive SFX: footsteps, blessing chime, diya flame, puzzle solves, fireworks, ability activation
 * - Master, Music, and SFX volume controls
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    this.masterVolume = 0.8;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.85;

    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.isMusicPlaying = false;
    this.tanpuraOscs = [];
    this.musicInterval = null;
    this.isCelebrationMode = false;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // =====================
  // MUSIC GENERATION
  // =====================

  startMusic() {
    if (!this.isInitialized) this.init();
    this.resume();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    this.startTanpuraDrone();
    this.scheduleBansuriMelody();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.stopTanpuraDrone();
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /**
   * Starts a continuous, resonant Tanpura drone tuned to C# (approx 138.6 Hz) + G# (approx 207.65 Hz)
   */
  startTanpuraDrone() {
    if (!this.ctx) return;
    const baseFreq = 138.59; // C#3
    const freqs = [
      baseFreq * 1.5, // Pa (G#3)
      baseFreq * 2.0, // Sa high (C#4)
      baseFreq * 2.0, // Sa high second string
      baseFreq        // Kharaj Sa (C#3)
    ];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Lowpass filter for warm, woody resonance
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700 + idx * 100, this.ctx.currentTime);

      // Gentle pulsating envelope for traditional tanpura pluck rhythm
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      this.tanpuraOscs.push({ osc, gain, baseGain: 0.025 });
    });

    // Animate tanpura string plucking cycle (Pa - Sa - Sa - Kharaj Sa)
    let stringIndex = 0;
    this.tanpuraInterval = setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const target = this.tanpuraOscs[stringIndex % this.tanpuraOscs.length];
      if (target) {
        const now = this.ctx.currentTime;
        target.gain.gain.cancelScheduledValues(now);
        target.gain.gain.setValueAtTime(0.06, now);
        target.gain.gain.exponentialRampToValueAtTime(0.015, now + 1.6);
      }
      stringIndex++;
    }, 900);
  }

  stopTanpuraDrone() {
    if (this.tanpuraInterval) {
      clearInterval(this.tanpuraInterval);
      this.tanpuraInterval = null;
    }
    this.tanpuraOscs.forEach(({ osc }) => {
      try { osc.stop(); } catch (e) {}
    });
    this.tanpuraOscs = [];
  }

  /**
   * Generates bansuri (flute) phrases and rhythmic tabla beats
   */
  scheduleBansuriMelody() {
    // Raga Bhoopali scale in C#: C#, D#, F, G#, A#
    const ragaNotes = [
      138.59 * 2, // C#4
      155.56 * 2, // D#4
      174.61 * 2, // F4
      207.65 * 2, // G#4
      233.08 * 2, // A#4
      138.59 * 4, // C#5
      155.56 * 4, // D#5
      174.61 * 4  // F5
    ];

    let beat = 0;
    this.musicInterval = setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx) return;

      // Play percussion beat
      if (beat % 2 === 0) {
        this.playTablaBeat(beat % 4 === 0 ? 'dha' : 'ge');
      }
      if (this.isCelebrationMode && beat % 1 === 0) {
        this.playDholBeat();
      }

      // Play flute note occasionally
      if (Math.random() < 0.65 || (this.isCelebrationMode && Math.random() < 0.85)) {
        const note = ragaNotes[Math.floor(Math.random() * ragaNotes.length)];
        const duration = (Math.random() > 0.5 ? 0.8 : 1.4);
        this.playFluteNote(note, duration);
      }

      beat++;
    }, 450);
  }

  playFluteNote(frequency, duration = 1.0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    // Subtle breath vibrato (5 Hz)
    vibrato.frequency.setValueAtTime(5.2, now);
    vibratoGain.gain.setValueAtTime(frequency * 0.015, now);
    vibrato.connect(osc.frequency);

    // Warm breath filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3.5, now);

    // Flute attack, breath swell, gentle release
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.045, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    vibrato.start(now);
    osc.stop(now + duration + 0.05);
    vibrato.stop(now + duration + 0.05);
  }

  playTablaBeat(type = 'dha') {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonant low bayan (bass drum)
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.frequency.setValueAtTime(type === 'dha' ? 95 : 120, now);
    bassOsc.frequency.exponentialRampToValueAtTime(55, now + 0.25);

    bassGain.gain.setValueAtTime(0.12, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    bassOsc.connect(bassGain);
    bassGain.connect(this.musicGain);

    bassOsc.start(now);
    bassOsc.stop(now + 0.3);

    // Crisp dayan high slap if 'dha'
    if (type === 'dha') {
      const slapOsc = this.ctx.createOscillator();
      const slapGain = this.ctx.createGain();
      slapOsc.type = 'sine';
      slapOsc.frequency.setValueAtTime(280, now);
      slapOsc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      slapGain.gain.setValueAtTime(0.09, now);
      slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      slapOsc.connect(slapGain);
      slapGain.connect(this.musicGain);

      slapOsc.start(now);
      slapOsc.stop(now + 0.15);
    }
  }

  playDholBeat() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  setCelebrationMode(enable) {
    this.isCelebrationMode = enable;
  }

  // =====================
  // SOUND EFFECTS (SFX)
  // =====================

  /**
   * Authentic Temple Bronze Bell with metallic partials & long reverberant decay
   */
  playTempleBell(pitch = 1.0) {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 520 * pitch; // C5 range

    // Physical partials of Indian bronze temple bells
    const partials = [
      { mult: 1.0, gain: 0.35, decay: 3.2 },
      { mult: 2.02, gain: 0.25, decay: 2.5 },
      { mult: 2.76, gain: 0.18, decay: 2.0 },
      { mult: 4.14, gain: 0.12, decay: 1.5 },
      { mult: 5.43, gain: 0.08, decay: 1.1 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.mult, now);

      gain.gain.setValueAtTime(p.gain * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    });
  }

  /**
   * Conch Shell (Shankha) auspicious fanfare
   */
  playShankha() {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.linearRampToValueAtTime(235, now + 0.5);
    osc.frequency.exponentialRampToValueAtTime(220, now + 2.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.linearRampToValueAtTime(900, now + 0.6);
    filter.frequency.linearRampToValueAtTime(500, now + 2.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 2.5);
  }

  /**
   * Divine Blessing Collectible pickup sound
   */
  playCollectBlessing() {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Ascending celebratory chime
    const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.5);
    });
  }

  /**
   * Diya lighting whoosh and sacred flame ignite
   */
  playLightDiya() {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Warm whoosh
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    // Warm resonant chime
    this.playTempleBell(1.4);
  }

  /**
   * Puzzle Solved Chord
   */
  playPuzzleSolved() {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Sacred major chord swell
    const chord = [277.18, 349.23, 415.30, 554.37]; // C#4, F4, G#4, C#5
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.1 + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  }

  /**
   * Checkpoint Reached sound
   */
  playCheckpoint() {
    this.playTempleBell(1.2);
  }

  /**
   * "Vighnaharta Blessing" Power Activation
   */
  playAbilityActive() {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.85);

    this.playTempleBell(1.5);
  }

  /**
   * Jump sound
   */
  playJump() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Footstep sound
   */
  playFootstep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Fireworks launch and explosion
   */
  playFirework() {
    if (!this.ctx) this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Launch whistle
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(400, now);
    whistle.frequency.exponentialRampToValueAtTime(1400, now + 0.35);

    whistleGain.gain.setValueAtTime(0.06, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whistle.connect(whistleGain);
    whistleGain.connect(this.sfxGain);
    whistle.start(now);
    whistle.stop(now + 0.36);

    // Boom explosion after whistle
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(120, t);
      boom.frequency.exponentialRampToValueAtTime(35, t + 0.4);

      boomGain.gain.setValueAtTime(0.25, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      boom.connect(boomGain);
      boomGain.connect(this.sfxGain);
      boom.start(t);
      boom.stop(t + 0.6);
    }, 340);
  }
}

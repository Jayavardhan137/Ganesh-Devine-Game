/**
 * PuzzleManager manages the 3 sacred puzzles:
 * 1. Rangoli Mandala Puzzle (Rotate concentric rings to align the sacred pattern -> opens Gate 1)
 * 2. Temple Bell Sequence Puzzle (Strike 4 sacred bells in the clue sequence: Om -> Lotus -> Trishul -> Swastika -> opens Gate 2)
 * 3. Sacred Diya Lighting Puzzle (Light 5 standing lamps around the stage -> opens the Divine Flame Altar & triggers Finale)
 */
export class PuzzleManager {
  constructor(environment, audio, ui) {
    this.env = environment;
    this.audio = audio;
    this.ui = ui;

    // Puzzle 1 State: Rangoli Mandala (3 rings: inner, mid, outer, target angle 0)
    this.rangoli = {
      innerAngle: 90,
      midAngle: 180,
      outerAngle: 270,
      isSolved: false
    };

    // Puzzle 2 State: Bell Sequence (Om -> Lotus -> Trishul -> Swastika)
    this.bellTargetSequence = ['om', 'lotus', 'trishul', 'swastika'];
    this.bellCurrentSequence = [];
    this.bellPuzzleSolved = false;

    // Puzzle 3 State: 5 Sacred Diyas (0 to 4)
    this.litDiyas = new Set();
    this.diyaPuzzleSolved = false;

    this.onPuzzleSolvedCallback = null;
  }

  // ===================================
  // PUZZLE 1: RANGOLI MANDALA
  // ===================================
  rotateRangoliRing(ringName) {
    if (this.rangoli.isSolved) return;

    if (ringName === 'inner') {
      this.rangoli.innerAngle = (this.rangoli.innerAngle + 90) % 360;
    } else if (ringName === 'mid') {
      this.rangoli.midAngle = (this.rangoli.midAngle + 90) % 360;
    } else if (ringName === 'outer') {
      this.rangoli.outerAngle = (this.rangoli.outerAngle + 90) % 360;
    }

    this.audio.playTempleBell(1.1);

    // Check if all rings are aligned (e.g. all 0 deg)
    if (this.rangoli.innerAngle === 0 && this.rangoli.midAngle === 0 && this.rangoli.outerAngle === 0) {
      this.solveRangoliPuzzle();
    }
  }

  solveRangoliPuzzle() {
    if (this.rangoli.isSolved) return;
    this.rangoli.isSolved = true;

    this.audio.playPuzzleSolved();

    // Open Gate 1
    const gate = this.env.interactables.find(i => i.id === 'gate_1');
    if (gate && gate.open) gate.open();

    this.ui.showBanner('Rangoli Aligned! Temple Gate Unlocked', 4000);
    this.ui.closeRangoliModal();

    if (this.onPuzzleSolvedCallback) {
      this.onPuzzleSolvedCallback(1, 'Rangoli Mandala');
    }
  }

  // ===================================
  // PUZZLE 2: TEMPLE BELL SEQUENCE
  // ===================================
  ringBell(bellObj) {
    if (this.bellPuzzleSolved) {
      this.audio.playTempleBell(1.0 + bellObj.index * 0.15);
      bellObj.ring();
      return;
    }

    bellObj.ring();
    this.audio.playTempleBell(1.0 + bellObj.index * 0.15);

    const expected = this.bellTargetSequence[this.bellCurrentSequence.length];

    if (bellObj.symbol === expected) {
      this.bellCurrentSequence.push(bellObj.symbol);
      this.ui.showToast(`Bell ${bellObj.symbol.toUpperCase()} Chimed! (${this.bellCurrentSequence.length}/4)`);

      if (this.bellCurrentSequence.length === this.bellTargetSequence.length) {
        this.solveBellPuzzle();
      }
    } else {
      // Wrong sequence - gentle feedback and reset
      this.bellCurrentSequence = [];
      this.ui.showToast('Sequence reset! Clue: 1. Om → 2. Lotus → 3. Trishul → 4. Swastika', 3000);
      this.audio.playTempleBell(0.6);
    }
  }

  solveBellPuzzle() {
    if (this.bellPuzzleSolved) return;
    this.bellPuzzleSolved = true;

    this.audio.playPuzzleSolved();

    // Open Gate 2 (Sacred Garden Gate)
    const gate = this.env.interactables.find(i => i.id === 'gate_2');
    if (gate && gate.open) gate.open();

    this.ui.showBanner('Sacred Bells Resonated! Sacred Garden Unlocked', 4000);

    if (this.onPuzzleSolvedCallback) {
      this.onPuzzleSolvedCallback(2, 'Sacred Bells');
    }
  }

  // ===================================
  // PUZZLE 3: SACRED DIYA LIGHTING
  // ===================================
  lightDiya(diyaObj) {
    if (diyaObj.isLit) return;

    diyaObj.light();
    this.audio.playLightDiya();
    this.litDiyas.add(diyaObj.index);

    this.ui.showToast(`Sacred Diya #${diyaObj.index + 1} Lit! (${this.litDiyas.size}/5)`);

    if (this.litDiyas.size === 5 && !this.diyaPuzzleSolved) {
      this.solveDiyaPuzzle();
    }
  }

  solveDiyaPuzzle() {
    this.diyaPuzzleSolved = true;
    this.audio.playPuzzleSolved();

    // Open Gate 3 or activate Divine Flame
    const gate = this.env.interactables.find(i => i.id === 'gate_3');
    if (gate && gate.open) gate.open();

    this.ui.showBanner('All 5 Sacred Diyas Lit! Divine Flame Ready', 4000);

    if (this.onPuzzleSolvedCallback) {
      this.onPuzzleSolvedCallback(3, '5 Sacred Diyas');
    }
  }
}

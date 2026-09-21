/**
 * SaveManager handles client preferences and isolated user progress caching.
 * ALL demo/mock players, fake leaderboard entries, and sample scores have been completely removed.
 */
export class SaveManager {
  constructor(userId = 'guest') {
    this.userId = userId;
    this.storageKey = `ganesha_divine_quest_save_${this.userId}`;
    this.settingsKey = 'ganesha_divine_quest_settings';
    this.data = this.load();
    this.settings = this.loadSettings();
  }

  setUserId(newUserId) {
    if (this.userId === newUserId) return;
    this.userId = newUserId || 'guest';
    this.storageKey = `ganesha_divine_quest_save_${this.userId}`;
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load save data:', e);
    }

    // Clean initial progress for authenticated player
    return {
      bestScore: 0,
      bestTime: null,
      unlockedStage: 1,
      totalBlessingsCollected: 0
    };
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.settingsKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.85,
      sensitivity: 1.0,
      quality: 'high',
      cameraShake: true
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not persist save data:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (e) {}
  }

  updateProgress(score, time, blessings, stage) {
    if (score > this.data.bestScore) this.data.bestScore = score;
    if (this.data.bestTime === null || time < this.data.bestTime) this.data.bestTime = time;
    if (blessings > this.data.totalBlessingsCollected) this.data.totalBlessingsCollected = blessings;
    if (stage > this.data.unlockedStage) this.data.unlockedStage = stage;
    this.save();
  }
}

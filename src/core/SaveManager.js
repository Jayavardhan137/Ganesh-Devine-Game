/**
 * SaveManager handles LocalStorage persistence for:
 * - Best score & time
 * - Total blessings collected
 * - Unlocked stages
 * - Settings (volumes, sensitivity, graphics quality)
 * - Leaderboard high scores
 */
export class SaveManager {
  constructor() {
    this.storageKey = 'ganesha_divine_quest_save';
    this.leaderboardKey = 'ganesha_divine_quest_leaderboard';
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load save data:', e);
    }

    return {
      bestScore: 0,
      bestTime: null,
      unlockedStage: 1,
      totalBlessingsCollected: 0,
      settings: {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.85,
        sensitivity: 1.0,
        quality: 'high',
        cameraShake: true
      }
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not persist save data:', e);
    }
  }

  updateProgress(score, time, blessings, stage) {
    if (score > this.data.bestScore) this.data.bestScore = score;
    if (this.data.bestTime === null || time < this.data.bestTime) this.data.bestTime = time;
    if (blessings > this.data.totalBlessingsCollected) this.data.totalBlessingsCollected = blessings;
    if (stage > this.data.unlockedStage) this.data.unlockedStage = stage;
    this.save();
  }

  getLeaderboard() {
    try {
      const saved = localStorage.getItem(this.leaderboardKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load leaderboard:', e);
    }

    // Default default entries celebrating Ganesh Chaturthi
    return [
      { name: 'Aarav Devotee', score: 3850, time: '04:12', blessings: 20 },
      { name: 'Ananya Guardian', score: 3600, time: '04:45', blessings: 19 },
      { name: 'Rohan Seeker', score: 3200, time: '05:18', blessings: 18 },
      { name: 'Pooja Pilgrim', score: 2900, time: '05:50', blessings: 17 }
    ];
  }

  addLeaderboardEntry(name, score, timeSeconds, blessings) {
    const list = this.getLeaderboard();
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    list.push({
      name: name || 'Devotee',
      score,
      time: timeFormatted,
      blessings
    });

    list.sort((a, b) => b.score - a.score);
    const top10 = list.slice(0, 10);

    try {
      localStorage.setItem(this.leaderboardKey, JSON.stringify(top10));
    } catch (e) {
      console.warn('Could not save leaderboard:', e);
    }

    return top10;
  }
}

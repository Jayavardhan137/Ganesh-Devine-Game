import { GameManager } from './core/GameManager.js';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize and launch game
  const game = new GameManager();
  window.__GANESHA_GAME__ = game;
});

import * as THREE from 'three';

/**
 * TextureFactory generates procedural high-res textures with authentic Indian festival aesthetics.
 * This ensures crystal clear visuals, zero network download delays, and rich cultural motifs.
 */
export class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generates an intricate multi-colored Rangoli mandala texture.
   */
  createRangoliTexture(size = 512, patternType = 1) {
    const key = `rangoli_${patternType}_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Outer ring - Saffron & Deep Pink
    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, cx - 10);
    grad.addColorStop(0, '#FFE066');
    grad.addColorStop(0.3, '#FF6B6B');
    grad.addColorStop(0.6, '#4ECDC4');
    grad.addColorStop(0.85, '#FF9F1C');
    grad.addColorStop(1, '#9B5DE5');

    ctx.fillStyle = '#1A0826';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 12, 0, Math.PI * 2);
    ctx.fill();

    // Petal rings
    const petals = patternType === 1 ? 16 : 12;
    for (let r = cx - 20; r > 30; r -= 40) {
      ctx.strokeStyle = (r % 80 === 0) ? '#FFE66D' : '#FF6B6B';
      ctx.lineWidth = 3;
      for (let i = 0; i < petals; i++) {
        const angle = (i * Math.PI * 2) / petals;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = (i % 2 === 0) ? '#FF9F1C' : '#F15BB5';
        ctx.fill();
        ctx.stroke();
      }
    }

    // Sacred Lotus in the center
    ctx.fillStyle = '#FF4081';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    const centerPetals = 8;
    for (let i = 0; i < centerPetals; i++) {
      const angle = (i * Math.PI * 2) / centerPetals;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(angle) * 26, cy + Math.sin(angle) * 26, 18, 9, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Golden center core
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates Marigold Garland texture with alternating orange and golden yellow flowers.
   */
  createMarigoldTexture(width = 256, height = 64) {
    const key = `marigold_${width}_${height}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    const count = 8;
    const step = width / count;
    for (let i = 0; i < count; i++) {
      const cx = i * step + step / 2;
      const cy = height / 2;
      const isOrange = i % 2 === 0;

      // Flower petals
      const r = step * 0.44;
      ctx.fillStyle = isOrange ? '#FF6700' : '#FFBF00';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Flower depth ruffled layers
      ctx.fillStyle = isOrange ? '#E65100' : '#FF9900';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (r * 0.5), cy + Math.sin(a) * (r * 0.5), r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flower center
      ctx.fillStyle = isOrange ? '#FFB703' : '#CC5500';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Stone Temple Carving texture for sandstone pillars and courtyard tiles.
   */
  createStoneTexture(size = 512) {
    const key = `stone_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Warm Indian Sandstone base
    ctx.fillStyle = '#C49A6C';
    ctx.fillRect(0, 0, size, size);

    // Subtle stone flecks & noise
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = Math.random();
      ctx.fillStyle = v > 0.5 ? 'rgba(80, 50, 30, 0.08)' : 'rgba(255, 230, 200, 0.12)';
      ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    // Flagstone grid with beveled borders
    const tileSize = size / 4;
    ctx.strokeStyle = 'rgba(70, 45, 25, 0.35)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= size; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Subtle traditional floral relief in center of each tile
    ctx.strokeStyle = 'rgba(255, 240, 210, 0.2)';
    ctx.lineWidth = 1.5;
    for (let x = tileSize / 2; x < size; x += tileSize) {
      for (let y = tileSize / 2; y < size; y += tileSize) {
        ctx.beginPath();
        ctx.arc(x, y, tileSize * 0.25, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Traditional Terracotta Roof Tile texture for street houses.
   */
  createRoofTileTexture(size = 256) {
    const key = `roof_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#A84323';
    ctx.fillRect(0, 0, size, size);

    const rowH = size / 8;
    for (let y = 0; y < size; y += rowH) {
      ctx.fillStyle = (y / rowH) % 2 === 0 ? '#9B391C' : '#B84C2A';
      ctx.fillRect(0, y, size, rowH);

      // Tile curves
      ctx.strokeStyle = 'rgba(50, 15, 5, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + rowH);
      ctx.lineTo(size, y + rowH);
      ctx.stroke();

      // Individual tile seams
      const colW = size / 6;
      const offset = ((y / rowH) % 2) * (colW / 2);
      for (let x = offset; x < size; x += colW) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Carved Wood texture with warm Indian rosewood / teak tones.
   */
  createWoodTexture(size = 256) {
    const key = `wood_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5A2A18';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(130, 65, 35, 0.4)';
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.sin(y * 0.1) * 3));
      ctx.lineTo(size, y + (Math.cos(y * 0.08) * 3));
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Festival Banner / Toran cloth texture.
   */
  createBannerTexture(width = 256, height = 128) {
    const key = `banner_${width}_${height}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#D9381E';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, width, 12);
    ctx.fillRect(0, height - 12, width, 12);

    const triW = 32;
    for (let x = 0; x < width; x += triW) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + triW / 2, 28);
      ctx.lineTo(x + triW, 0);
      ctx.fill();
    }

    ctx.fillStyle = '#FFE66D';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('卐  ॐ  卐', width / 2, height / 2 + 6);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Sacred Symbol texture for Temple Bell puzzle (om, lotus, trishul, swastika, diya).
   */
  createSacredSymbolTexture(symbolType) {
    const key = `symbol_${symbolType}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2A1810';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, 224, 224);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 110px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let char = 'ॐ';
    if (symbolType === 'lotus') char = '🪷';
    else if (symbolType === 'trishul') char = '🔱';
    else if (symbolType === 'swastika') char = '卐';
    else if (symbolType === 'diya') char = '🪔';

    ctx.fillText(char, 128, 134);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }
}

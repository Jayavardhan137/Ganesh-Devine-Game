import * as THREE from 'three';

/**
 * CollectibleManager manages the 20 sacred Blessings across 5 distinct types:
 * 1. Modak of Wisdom
 * 2. Lotus of Purity
 * 3. Golden Bell
 * 4. Sacred Diya
 * 5. Festival Flower
 */
export class CollectibleManager {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;

    this.collectibles = [];
    this.collectedCount = 0;
    this.totalCount = 20;

    this.onCollectCallback = null;
    this.initBlessings();
  }

  initBlessings() {
    // 20 Strategic Placements across 4 Zones:
    const placements = [
      // ZONE 1: Festival Street (5 Blessings)
      { type: 'modak', pos: [0, 1.2, 4], name: 'Modak of Wisdom' },
      { type: 'flower', pos: [-3.5, 1.2, 10], name: 'Festival Flower' },
      { type: 'diya', pos: [3.5, 1.2, 18], name: 'Sacred Diya' },
      { type: 'bell', pos: [-2.0, 1.2, 28], name: 'Golden Bell' },
      { type: 'lotus', pos: [2.0, 1.2, 38], name: 'Lotus of Purity' },

      // ZONE 2: Temple Courtyard (5 Blessings)
      { type: 'bell', pos: [-7, 1.4, 52], name: 'Golden Bell' },
      { type: 'modak', pos: [7, 1.4, 52], name: 'Modak of Wisdom' },
      { type: 'lotus', pos: [0, 1.8, 64], name: 'Lotus of Purity' }, // center pond
      { type: 'flower', pos: [-6, 1.4, 74], name: 'Festival Flower' },
      { type: 'diya', pos: [6, 1.4, 74], name: 'Sacred Diya' },

      // ZONE 3: Sacred Garden (5 Blessings)
      { type: 'lotus', pos: [0, 1.4, 96], name: 'Lotus of Purity' },
      { type: 'modak', pos: [-6, 1.6, 106], name: 'Modak of Wisdom' }, // on moving lotus platform
      { type: 'flower', pos: [6, 1.6, 106], name: 'Festival Flower' }, // on moving lotus platform
      { type: 'bell', pos: [0, 1.4, 115], name: 'Golden Bell' },
      { type: 'diya', pos: [0, 1.4, 130], name: 'Sacred Diya' },

      // ZONE 4: Festival Stage (5 Blessings)
      { type: 'modak', pos: [-6, 2.0, 154], name: 'Modak of Wisdom' },
      { type: 'lotus', pos: [6, 2.0, 154], name: 'Lotus of Purity' },
      { type: 'flower', pos: [-8, 2.2, 168], name: 'Festival Flower' },
      { type: 'bell', pos: [8, 2.2, 168], name: 'Golden Bell' },
      { type: 'diya', pos: [0, 2.4, 182], name: 'Sacred Diya' }
    ];

    placements.forEach((item, idx) => {
      const mesh = this.createBlessingMesh(item.type);
      mesh.position.set(item.pos[0], item.pos[1], item.pos[2]);

      // Subtle point light for each blessing
      const pLight = new THREE.PointLight(this.getColorByType(item.type), 1.2, 4, 2);
      mesh.add(pLight);

      this.scene.add(mesh);

      this.collectibles.push({
        id: `blessing_${idx}`,
        type: item.type,
        name: item.name,
        mesh,
        basePos: new THREE.Vector3(item.pos[0], item.pos[1], item.pos[2]),
        collected: false,
        attracting: false,
        attractProgress: 0,
        light: pLight
      });
    });
  }

  getColorByType(type) {
    switch (type) {
      case 'modak': return 0xFFD700; // Gold
      case 'lotus': return 0xFF69B4; // Sacred Pink
      case 'bell': return 0xFFAA00;  // Brass Amber
      case 'diya': return 0xFF5400;  // Flame Orange
      case 'flower': return 0xFF9E00;// Marigold
      default: return 0xFFD700;
    }
  }

  createBlessingMesh(type) {
    const group = new THREE.Group();

    if (type === 'modak') {
      // Modak of Wisdom: Golden tear shape with pleated folds
      const modakGeo = new THREE.ConeGeometry(0.35, 0.65, 12);
      const modakMat = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x553300,
        emissiveIntensity: 0.3
      });
      const m = new THREE.Mesh(modakGeo, modakMat);
      group.add(m);
    } else if (type === 'lotus') {
      // Lotus of Purity: Layered blossom
      const lotusMat = new THREE.MeshStandardMaterial({
        color: 0xFF69B4,
        emissive: 0x440022,
        roughness: 0.3
      });
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 5), lotusMat);
        petal.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2);
        petal.rotation.x = Math.PI / 4;
        petal.rotation.y = -a;
        group.add(petal);
      }
    } else if (type === 'bell') {
      // Golden Bell
      const bellGeo = new THREE.ConeGeometry(0.32, 0.55, 12);
      const bellMat = new THREE.MeshStandardMaterial({
        color: 0xFFAA00,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x442200
      });
      const b = new THREE.Mesh(bellGeo, bellMat);
      group.add(b);
    } else if (type === 'diya') {
      // Sacred Diya
      const diyaMat = new THREE.MeshStandardMaterial({
        color: 0xE05A20,
        roughness: 0.6,
        emissive: 0x331100
      });
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.22, 12), diyaMat);
      group.add(d);
      // Tiny flame inside
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.25, 6),
        new THREE.MeshBasicMaterial({ color: 0xFFDD33 })
      );
      flame.position.y = 0.2;
      group.add(flame);
    } else {
      // Festival Flower (Marigold bloom)
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xFF9E00,
        emissive: 0x442200,
        roughness: 0.5
      });
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), flowerMat);
      f.scale.set(1.1, 0.7, 1.1);
      group.add(f);
    }

    // Outer sparkling celestial halo ring
    const ringGeo = new THREE.TorusGeometry(0.48, 0.025, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFF275 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  update(delta, time, playerPos) {
    const collectDistance = 1.7;
    const magnetDistance = 4.0;

    for (let item of this.collectibles) {
      if (item.collected) continue;

      // Gentle floating bob & rotation
      item.mesh.rotation.y = time * 2.2;
      item.mesh.position.y = item.basePos.y + Math.sin(time * 3.0 + item.basePos.z) * 0.15;

      const dist = item.mesh.position.distanceTo(playerPos);

      // Magnet attraction if player is close
      if (dist < magnetDistance) {
        item.mesh.position.lerp(playerPos, 4.5 * delta);
      }

      // Collect when close enough
      if (dist < collectDistance) {
        this.collect(item);
      }
    }
  }

  collect(item) {
    if (item.collected) return;
    item.collected = true;
    this.collectedCount++;

    // Collection Audio & Particles
    this.audio.playCollectBlessing();
    this.particles.createBlessingBurst(item.mesh.position, this.getColorByType(item.type));

    // Remove from 3D scene
    this.scene.remove(item.mesh);
    item.mesh.visible = false;

    if (this.onCollectCallback) {
      this.onCollectCallback(this.collectedCount, this.totalCount, item);
    }
  }

  highlightNearby(origin, radius = 45) {
    // Used by Vighnaharta Blessing ability: temporarily brightens nearby uncollected blessings
    for (let item of this.collectibles) {
      if (!item.collected && item.mesh.position.distanceTo(origin) <= radius) {
        if (item.light) {
          item.light.intensity = 4.0;
          item.light.distance = 12;
        }
      }
    }
  }

  resetHighlights() {
    for (let item of this.collectibles) {
      if (item.light) {
        item.light.intensity = 1.2;
        item.light.distance = 4;
      }
    }
  }
}

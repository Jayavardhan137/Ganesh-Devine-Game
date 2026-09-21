import * as THREE from 'three';

/**
 * ParticleEngine manages optimized 3D particle systems:
 * - Diya flames & embers
 * - Swirling marigold flower petals
 * - Sacred garden fireflies
 * - Divine Ganesha aura particles
 * - Vighnaharta blessing trails
 * - Blessing collection bursts
 * - 3D festival fireworks for the grand finale
 */
export class ParticleEngine {
  constructor(scene) {
    this.scene = scene;
    this.flames = [];
    this.fireflies = null;
    this.petals = null;
    this.bursts = [];
    this.fireworks = [];
    this.trailParticles = null;
    this.trailIndex = 0;

    this.initPetals();
    this.initFireflies();
    this.initPlayerTrail();
  }

  /**
   * Floating Marigold Petals across the festival
   */
  initPetals(count = 200) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const orange = new THREE.Color(0xFF7A00);
    const yellow = new THREE.Color(0xFFD700);

    for (let i = 0; i < count; i++) {
      // Spread across the world (-40 to 40 x, 1 to 15 y, -20 to 180 z)
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 12 + 1;
      positions[i * 3 + 2] = Math.random() * 180 - 10;

      velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 1] = -Math.random() * 0.5 - 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      const col = Math.random() > 0.4 ? orange : yellow;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Petal particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(16, 16, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.petals = new THREE.Points(geo, mat);
    this.petals.userData = { velocities, count };
    this.scene.add(this.petals);
  }

  /**
   * Sacred Garden Fireflies
   */
  initFireflies(count = 120) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const initialPos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Centered in Sacred Garden zone (z around 80 to 130)
      const x = (Math.random() - 0.5) * 35;
      const y = Math.random() * 5 + 0.8;
      const z = Math.random() * 45 + 75;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPos[i * 3] = x;
      initialPos[i * 3 + 1] = y;
      initialPos[i * 3 + 2] = z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, 'rgba(230, 255, 120, 1)');
    grad.addColorStop(0.5, 'rgba(180, 255, 60, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xDFFF80
    });

    this.fireflies = new THREE.Points(geo, mat);
    this.fireflies.userData = { initialPos, count };
    this.scene.add(this.fireflies);
  }

  /**
   * Vighnaharta Blessing golden speed trail
   */
  initPlayerTrail(count = 100) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(opacities, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      color: 0xFFD700,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.trailParticles = new THREE.Points(geo, mat);
    this.trailParticles.visible = false;
    this.scene.add(this.trailParticles);
  }

  emitTrail(playerPos) {
    if (!this.trailParticles) return;
    this.trailParticles.visible = true;
    const pos = this.trailParticles.geometry.attributes.position.array;
    const idx = this.trailIndex * 3;
    pos[idx] = playerPos.x + (Math.random() - 0.5) * 0.3;
    pos[idx + 1] = playerPos.y + 0.3 + Math.random() * 0.4;
    pos[idx + 2] = playerPos.z + (Math.random() - 0.5) * 0.3;

    this.trailIndex = (this.trailIndex + 1) % 100;
    this.trailParticles.geometry.attributes.position.needsUpdate = true;
  }

  hideTrail() {
    if (this.trailParticles) this.trailParticles.visible = false;
  }

  /**
   * Creates a Diya flame particle and warm flicker point light
   */
  createDiyaFlame(position, scale = 1.0) {
    const flameGroup = new THREE.Group();
    flameGroup.position.copy(position);

    // Warm glowing flame mesh
    const flameGeo = new THREE.ConeGeometry(0.12 * scale, 0.35 * scale, 8);
    flameGeo.translate(0, 0.17 * scale, 0);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA11,
      transparent: true,
      opacity: 0.95
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameGroup.add(flameMesh);

    // Inner bright white-yellow core
    const coreGeo = new THREE.ConeGeometry(0.06 * scale, 0.22 * scale, 8);
    coreGeo.translate(0, 0.11 * scale, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    flameGroup.add(coreMesh);

    // Warm point light
    const light = new THREE.PointLight(0xFFAA33, 2.0 * scale, 6 * scale, 2);
    light.position.set(0, 0.25 * scale, 0);
    flameGroup.add(light);

    this.scene.add(flameGroup);
    this.flames.push({
      group: flameGroup,
      flameMesh,
      light,
      baseIntensity: 2.0 * scale,
      seed: Math.random() * 100
    });

    return flameGroup;
  }

  /**
   * Blessing Collection burst (+1 Blessing effect)
   */
  createBlessingBurst(pos, colorHex = 0xFFD700) {
    const count = 35;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      const vy = Math.random() * 4 + 1;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = vy;
      velocities[i * 3 + 2] = Math.sin(angle) * speed;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.35,
      color: colorHex,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const burst = new THREE.Points(geo, mat);
    this.scene.add(burst);
    this.bursts.push({
      mesh: burst,
      velocities,
      life: 0.8,
      age: 0
    });
  }

  /**
   * 3D Fireworks for Grand Festival Finale
   */
  launchFirework(x, y, z, colorHex) {
    const count = 150;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = Math.random() * 9 + 4;

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.55,
      color: colorHex || (Math.random() > 0.5 ? 0xFF9900 : 0xFF3366),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const firework = new THREE.Points(geo, mat);
    this.scene.add(firework);
    this.fireworks.push({
      mesh: firework,
      velocities,
      life: 1.8,
      age: 0
    });
  }

  update(delta, time) {
    // 1. Update Diya flames flicker
    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i];
      const flicker = Math.sin(time * 12 + f.seed) * 0.2 + Math.cos(time * 24 + f.seed) * 0.15;
      f.flameMesh.scale.set(1 + flicker * 0.2, 1 + flicker * 0.35, 1 + flicker * 0.2);
      f.light.intensity = Math.max(0.5, f.baseIntensity * (1 + flicker * 0.25));
    }

    // 2. Update Petals
    if (this.petals) {
      const pos = this.petals.geometry.attributes.position.array;
      const vel = this.petals.userData.velocities;
      const count = this.petals.userData.count;

      for (let i = 0; i < count; i++) {
        pos[i * 3] += vel[i * 3] * delta + Math.sin(time + i) * 0.02;
        pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
        pos[i * 3 + 2] += vel[i * 3 + 2] * delta;

        // Wrap around if below ground or out of bounds
        if (pos[i * 3 + 1] < 0.2) {
          pos[i * 3 + 1] = 12 + Math.random() * 3;
          pos[i * 3] = (Math.random() - 0.5) * 60;
        }
      }
      this.petals.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Fireflies
    if (this.fireflies) {
      const pos = this.fireflies.geometry.attributes.position.array;
      const init = this.fireflies.userData.initialPos;
      const count = this.fireflies.userData.count;

      for (let i = 0; i < count; i++) {
        pos[i * 3] = init[i * 3] + Math.sin(time * 1.5 + i) * 1.2;
        pos[i * 3 + 1] = init[i * 3 + 1] + Math.cos(time * 2.0 + i * 2) * 0.6;
        pos[i * 3 + 2] = init[i * 3 + 2] + Math.sin(time * 1.2 + i * 0.5) * 1.2;
      }
      this.fireflies.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Update Blessing Bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.age += delta;
      const progress = b.age / b.life;

      if (progress >= 1.0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        this.bursts.splice(i, 1);
        continue;
      }

      b.mesh.material.opacity = 1.0 - progress;
      const pos = b.mesh.geometry.attributes.position.array;
      for (let j = 0; j < b.velocities.length / 3; j++) {
        pos[j * 3] += b.velocities[j * 3] * delta;
        pos[j * 3 + 1] += b.velocities[j * 3 + 1] * delta;
        pos[j * 3 + 2] += b.velocities[j * 3 + 2] * delta;
        b.velocities[j * 3 + 1] -= 9.8 * delta * 0.4; // subtle gravity
      }
      b.mesh.geometry.attributes.position.needsUpdate = true;
    }

    // 5. Update Fireworks
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      fw.age += delta;
      const progress = fw.age / fw.life;

      if (progress >= 1.0) {
        this.scene.remove(fw.mesh);
        fw.mesh.geometry.dispose();
        fw.mesh.material.dispose();
        this.fireworks.splice(i, 1);
        continue;
      }

      fw.mesh.material.opacity = Math.pow(1.0 - progress, 1.5);
      const pos = fw.mesh.geometry.attributes.position.array;
      for (let j = 0; j < fw.velocities.length / 3; j++) {
        pos[j * 3] += fw.velocities[j * 3] * delta;
        pos[j * 3 + 1] += fw.velocities[j * 3 + 1] * delta;
        pos[j * 3 + 2] += fw.velocities[j * 3 + 2] * delta;
        fw.velocities[j * 3 + 1] -= 4.5 * delta; // firework gravity
      }
      fw.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }
}

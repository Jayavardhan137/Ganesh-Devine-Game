import * as THREE from 'three';

/**
 * EnvironmentBuilder constructs the 4 rich festival zones:
 * 1. Festival Street: Decorated houses, rangoli paths, sweet stalls, marigold garlands, lanterns
 * 2. Temple Courtyard: Sandstone pillars, mandapa, hanging bells, reflection pond
 * 3. Sacred Garden: Banyan trees, lotus pond, stepping stones, 4 sacred chime bells
 * 4. Festival Stage: Royal pandal, 5 sacred standing diyas, Divine Flame altar, Ganesha shrine
 */
export class EnvironmentBuilder {
  constructor(scene, textureFactory, particleEngine) {
    this.scene = scene;
    this.textures = textureFactory;
    this.particles = particleEngine;

    this.colliders = []; // AABB bounding boxes for solid walls/buildings
    this.interactables = []; // Triggers for puzzle interactables, gates, bells, diyas
    this.movingPlatforms = []; // Platforms that rotate or translate
    this.checkpoints = []; // Checkpoint diya locations
    this.lights = [];

    // Shared materials
    this.stoneMat = new THREE.MeshStandardMaterial({
      map: this.textures.createStoneTexture(512),
      roughness: 0.8,
      metalness: 0.1
    });

    this.roofMat = new THREE.MeshStandardMaterial({
      map: this.textures.createRoofTileTexture(256),
      roughness: 0.7
    });

    this.woodMat = new THREE.MeshStandardMaterial({
      map: this.textures.createWoodTexture(256),
      roughness: 0.6
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.85,
      roughness: 0.25
    });

    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.8,
      roughness: 0.3
    });

    this.marigoldMat = new THREE.MeshStandardMaterial({
      map: this.textures.createMarigoldTexture(256, 64),
      transparent: true,
      roughness: 0.6
    });

    this.buildWorld();
  }

  buildWorld() {
    this.buildGroundAndSky();
    this.buildArea1Street();
    this.buildArea2Courtyard();
    this.buildArea3Garden();
    this.buildArea4Stage();
  }

  buildGroundAndSky() {
    // Sky Dome - Warm evening sunset/dusk gradient
    const skyGeo = new THREE.SphereGeometry(260, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x180D2B, // Deep festive indigo dusk
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Distant stars / celestial specks
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xFFF2D1,
      size: 0.8,
      transparent: true,
      opacity: 0.85
    });
    this.scene.add(new THREE.Points(starsGeo, starsMat));

    // Warm Sunset Directional Light
    const sunLight = new THREE.DirectionalLight(0xFFB066, 1.6);
    sunLight.position.set(25, 45, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 280;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);

    // Warm Ambient Light
    const ambLight = new THREE.AmbientLight(0x52355C, 1.2);
    this.scene.add(ambLight);

    // Main Street Pavement (Ground Plane)
    const groundGeo = new THREE.PlaneGeometry(80, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.createStoneTexture(512),
      roughness: 0.85
    });
    groundMat.map.repeat.set(8, 24);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 90);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // ==========================================
  // AREA 1: FESTIVAL STREET (Z: -10 to 45)
  // ==========================================
  buildArea1Street() {
    // Street curb walls (boundaries)
    this.addCollider(-12, 2, 20, 2, 4, 65); // Left boundary wall
    this.addCollider(12, 2, 20, 2, 4, 65);  // Right boundary wall

    // Traditional Houses along the street
    for (let i = 0; i < 4; i++) {
      const z = i * 14 - 4;
      // Left side house
      this.createHouse(-14, z, 'left');
      // Right side house
      this.createHouse(14, z, 'right');
    }

    // Street Rangolis on the ground
    const rangoliMat = new THREE.MeshStandardMaterial({
      map: this.textures.createRangoliTexture(512, 1),
      transparent: true,
      roughness: 0.6
    });

    const rangoli1 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), rangoliMat);
    rangoli1.rotation.x = -Math.PI / 2;
    rangoli1.position.set(0, 0.02, 5);
    this.scene.add(rangoli1);

    const rangoli2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), rangoliMat);
    rangoli2.rotation.x = -Math.PI / 2;
    rangoli2.position.set(0, 0.02, 22);
    this.scene.add(rangoli2);

    // Festival Street Stalls
    this.createStreetStall(-7.5, 12, 'sweets');
    this.createStreetStall(7.5, 26, 'flowers');

    // Overhead Marigold Garlands & Lanterns
    for (let z = 2; z <= 36; z += 10) {
      this.createOverheadGarland(z);
    }

    // Street Curbside Diyas
    for (let z = 0; z <= 40; z += 6) {
      this.createCurbsideDiya(-4.8, 0, z);
      this.createCurbsideDiya(4.8, 0, z);
    }

    // Checkpoint 1 Diya at Street Start
    this.createCheckpointDiya(0, 0, 0, 1, 'Street Entrance');

    // Gate 1: Temple Brass Gate (Unlocked by Rangoli Puzzle)
    this.createGate1(44);
  }

  createHouse(x, z, side) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Building Wall
    const wallColor = side === 'left' ? 0xF2E3C6 : 0xEAD2AC;
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
    const houseMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 6.5, 10), wallMat);
    houseMesh.position.y = 3.25;
    houseMesh.castShadow = true;
    group.add(houseMesh);

    // Roof
    const roofGeo = new THREE.ConeGeometry(5.2, 2.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMesh = new THREE.Mesh(roofGeo, this.roofMat);
    roofMesh.position.y = 7.6;
    roofMesh.scale.set(1.1, 1.0, 1.6);
    group.add(roofMesh);

    // Wooden Veranda & Jharokha Balcony
    const balconyX = side === 'left' ? 3.1 : -3.1;
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 2.5), this.woodMat);
    balcony.position.set(balconyX, 4.0, 0);
    group.add(balcony);

    // Hanging Toran Banner
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 1.4),
      new THREE.MeshStandardMaterial({
        map: this.textures.createBannerTexture(256, 128),
        roughness: 0.6,
        side: THREE.DoubleSide
      })
    );
    banner.position.set(balconyX * 0.9, 2.8, 0);
    banner.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    group.add(banner);

    this.scene.add(group);
    this.addCollider(x, 3.25, z, 6, 6.5, 10);
  }

  createStreetStall(x, z, type) {
    const stallGroup = new THREE.Group();
    stallGroup.position.set(x, 0, z);

    // Wooden Counter Table
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 3.2), this.woodMat);
    table.position.y = 0.5;
    stallGroup.add(table);

    // Canopy Roof
    const canopyColor = type === 'sweets' ? 0xDD2D4A : 0xFF9F1C;
    const canopyMat = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.6 });
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.6, 4), canopyMat);
    canopy.position.y = 2.4;
    canopy.rotation.y = Math.PI / 4;
    stallGroup.add(canopy);

    // Pillars supporting canopy
    for (let px of [-0.9, 0.9]) {
      for (let pz of [-1.3, 1.3]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), this.woodMat);
        pole.position.set(px, 1.4, pz);
        stallGroup.add(pole);
      }
    }

    // Stall offerings (Modak pyramid or Marigold baskets)
    if (type === 'sweets') {
      const modakStack = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 8), this.goldMat);
      modakStack.position.set(0, 1.25, 0);
      stallGroup.add(modakStack);
    } else {
      const flowerBasket = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.35, 12), this.marigoldMat);
      flowerBasket.position.set(0, 1.15, 0);
      stallGroup.add(flowerBasket);
    }

    this.scene.add(stallGroup);
    this.addCollider(x, 1, z, 2.6, 2.5, 3.4);
  }

  createOverheadGarland(z) {
    // Hanging curve garland
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-6, 4.2, z),
      new THREE.Vector3(0, 3.3, z),
      new THREE.Vector3(6, 4.2, z)
    );
    const points = curve.getPoints(16);
    const garlandGeo = new THREE.TubeGeometry(curve, 16, 0.08, 6, false);
    const garlandMesh = new THREE.Mesh(garlandGeo, this.marigoldMat);
    this.scene.add(garlandMesh);

    // Festive lantern in the center of the arch
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.45, 6),
      new THREE.MeshStandardMaterial({ color: 0xFFB703, emissive: 0xFF7A00, emissiveIntensity: 0.6 })
    );
    lantern.position.set(0, 3.0, z);
    this.scene.add(lantern);

    const light = new THREE.PointLight(0xFF9933, 1.2, 8, 2);
    light.position.set(0, 2.8, z);
    this.scene.add(light);
    this.lights.push(light);
  }

  createCurbsideDiya(x, y, z) {
    const diyaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.12, 0.12, 12),
      this.brassMat
    );
    diyaBase.position.set(x, y + 0.06, z);
    this.scene.add(diyaBase);
    this.particles.createDiyaFlame(new THREE.Vector3(x, y + 0.15, z), 0.7);
  }

  createGate1(z) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, z);

    // Two stone pillars
    const pillarGeo = new THREE.BoxGeometry(1.6, 6, 1.6);
    const leftPillar = new THREE.Mesh(pillarGeo, this.stoneMat);
    leftPillar.position.set(-4.5, 3, 0);
    gateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, this.stoneMat);
    rightPillar.position.set(4.5, 3, 0);
    gateGroup.add(rightPillar);

    // Archway lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.2, 1.8), this.stoneMat);
    lintel.position.set(0, 6.2, 0);
    gateGroup.add(lintel);

    // Brass Toran on Gate
    const gateToran = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 1.4),
      new THREE.MeshStandardMaterial({ map: this.textures.createBannerTexture(256, 128), side: THREE.DoubleSide })
    );
    gateToran.position.set(0, 5.0, 0.1);
    gateGroup.add(gateToran);

    // Left and Right Brass Doors
    const doorGeo = new THREE.BoxGeometry(3.6, 5.2, 0.3);
    const leftDoor = new THREE.Mesh(doorGeo, this.brassMat);
    leftDoor.position.set(-1.8, 2.6, 0);
    gateGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(doorGeo, this.brassMat);
    rightDoor.position.set(1.8, 2.6, 0);
    gateGroup.add(rightDoor);

    this.scene.add(gateGroup);

    // Register Gate Collider and Gate Object for opening
    const gateCollider = { min: new THREE.Vector3(-4.5, 0, z - 1), max: new THREE.Vector3(4.5, 6, z + 1) };
    this.colliders.push(gateCollider);

    this.interactables.push({
      id: 'gate_1',
      type: 'gate',
      group: gateGroup,
      leftDoor,
      rightDoor,
      collider: gateCollider,
      isOpen: false,
      open: () => {
        // Smoothly rotate doors open
        leftDoor.rotation.y = -Math.PI / 2.2;
        leftDoor.position.x = -3.5;
        rightDoor.rotation.y = Math.PI / 2.2;
        rightDoor.position.x = 3.5;
        // Remove collision barrier
        const idx = this.colliders.indexOf(gateCollider);
        if (idx !== -1) this.colliders.splice(idx, 1);
      }
    });
  }

  // ==========================================
  // AREA 2: TEMPLE COURTYARD (Z: 45 to 90)
  // ==========================================
  buildArea2Courtyard() {
    // Courtyard boundaries
    this.addCollider(-18, 3, 68, 2, 6, 45); // Left courtyard boundary
    this.addCollider(18, 3, 68, 2, 6, 45);  // Right courtyard boundary

    // Temple Mandapa Stone Pillars
    for (let x of [-10, -5, 5, 10]) {
      for (let z of [52, 64, 76]) {
        this.createTemplePillar(x, z);
      }
    }

    // Stepped Stone Platform for Courtyard Center
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.4, 20),
      this.stoneMat
    );
    platform.position.set(0, 0.2, 64);
    this.scene.add(platform);

    // Central Sacred Lotus Reflection Pond
    const pondGroup = new THREE.Group();
    pondGroup.position.set(0, 0.2, 64);

    // Stone Pond Rim
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.5, 0.45, 24),
      this.stoneMat
    );
    pondGroup.add(rim);

    // Water Surface
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1A659E,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.4, 24), waterMat);
    water.position.y = 0.05;
    pondGroup.add(water);

    // Floating Lotus Flowers in Pond
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const lotusFlower = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.4 })
      );
      lotusFlower.position.set(Math.cos(angle) * 3.2, 0.35, Math.sin(angle) * 3.2);
      pondGroup.add(lotusFlower);
    }
    this.scene.add(pondGroup);

    // Checkpoint 2 Diya at Temple Courtyard Entrance
    this.createCheckpointDiya(0, 0, 48, 2, 'Temple Courtyard');

    // Interactive Rangoli Puzzle Board Altar (placed at z = 54)
    this.createRangoliPuzzleStation(0, 0.4, 53);

    // Gate 2 leading to Sacred Garden (z = 88)
    this.createGate2(88);
  }

  createTemplePillar(x, z) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, 0, z);

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.4), this.stoneMat);
    base.position.y = 0.4;
    pillarGroup.add(base);

    // Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 5.4, 12), this.stoneMat);
    shaft.position.y = 3.5;
    pillarGroup.add(shaft);

    // Capital / Floral Bracket
    const capital = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.6), this.stoneMat);
    capital.position.y = 6.4;
    pillarGroup.add(capital);

    // Hanging Brass Bell on Pillar
    const bellMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 12), this.brassMat);
    bellMesh.position.set(0, 5.6, 0.7);
    pillarGroup.add(bellMesh);

    this.scene.add(pillarGroup);
    this.addCollider(x, 3.5, z, 1.5, 7, 1.5);
  }

  createRangoliPuzzleStation(x, y, z) {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(x, y, z);

    // Stone Pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.4, 0.5, 24), this.stoneMat);
    stationGroup.add(pedestal);

    // Interactive Rangoli Mandala Rings (Inner, Mid, Outer)
    const ringMat1 = new THREE.MeshStandardMaterial({
      map: this.textures.createRangoliTexture(512, 1),
      roughness: 0.4
    });
    const rangoliDisk = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 32), ringMat1);
    rangoliDisk.position.y = 0.3;
    stationGroup.add(rangoliDisk);

    // Two guardian diyas
    this.particles.createDiyaFlame(new THREE.Vector3(x - 2.2, y + 0.4, z), 0.8);
    this.particles.createDiyaFlame(new THREE.Vector3(x + 2.2, y + 0.4, z), 0.8);

    this.scene.add(stationGroup);

    // Register Puzzle 1 Trigger
    this.interactables.push({
      id: 'puzzle_rangoli',
      type: 'puzzle_trigger',
      prompt: '[E] Solve Rangoli Puzzle',
      position: new THREE.Vector3(x, y, z),
      radius: 3.5,
      mesh: rangoliDisk
    });
  }

  createGate2(z) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, z);

    // Ancient Sandstone Arch
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 6.5, 1.8), this.stoneMat);
    leftPillar.position.set(-4.5, 3.25, 0);
    gateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 6.5, 1.8), this.stoneMat);
    rightPillar.position.set(4.5, 3.25, 0);
    gateGroup.add(rightPillar);

    const arch = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.4, 2.0), this.stoneMat);
    arch.position.set(0, 6.8, 0);
    gateGroup.add(arch);

    // Stone barrier door
    const stoneDoor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.8, 0.5), this.woodMat);
    stoneDoor.position.set(0, 2.9, 0);
    gateGroup.add(stoneDoor);

    this.scene.add(gateGroup);

    const gateCollider = { min: new THREE.Vector3(-4.5, 0, z - 1), max: new THREE.Vector3(4.5, 7, z + 1) };
    this.colliders.push(gateCollider);

    this.interactables.push({
      id: 'gate_2',
      type: 'gate',
      group: gateGroup,
      door: stoneDoor,
      collider: gateCollider,
      isOpen: false,
      open: () => {
        // Lower stone gate smoothly into the ground
        stoneDoor.position.y = -3.2;
        const idx = this.colliders.indexOf(gateCollider);
        if (idx !== -1) this.colliders.splice(idx, 1);
      }
    });
  }

  // ==========================================
  // AREA 3: SACRED GARDEN (Z: 90 to 140)
  // ==========================================
  buildArea3Garden() {
    // Sacred Garden boundary walls
    this.addCollider(-22, 3, 115, 2, 6, 50);
    this.addCollider(22, 3, 115, 2, 6, 50);

    // Sacred Lotus Water Channel & Moving Bridge (Obstacle)
    const canal = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x145277, roughness: 0.1, metalness: 0.7 })
    );
    canal.position.set(0, -0.1, 106);
    this.scene.add(canal);

    // Rotating Lotus Platforms over water (Obstacle!)
    const p1 = this.createRotatingPlatform(-6, 0.25, 106, 1.8, 1.0);
    const p2 = this.createRotatingPlatform(6, 0.25, 106, 1.8, -1.0);
    const pCenter = this.createRotatingPlatform(0, 0.25, 106, 2.2, 0.6);

    // Stepping Stones
    for (let x of [-10, 10]) {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 12), this.stoneMat);
      stone.position.set(x, 0.2, 106);
      this.scene.add(stone);
    }

    // Sacred Banyan & Champak Trees
    this.createSacredTree(-12, 98);
    this.createSacredTree(12, 98);
    this.createSacredTree(-14, 124);
    this.createSacredTree(14, 124);

    // Checkpoint 3 Diya in Sacred Garden
    this.createCheckpointDiya(0, 0, 93, 3, 'Sacred Garden Entrance');

    // 4 Sacred Temple Chime Bells for Bell Puzzle (Om, Lotus, Trishul, Swastika)
    this.createBellPuzzleStation(0, 122);

    // Gate 3 leading to Festival Stage (z = 138)
    this.createGate3(138);
  }

  createRotatingPlatform(x, y, z, radius, rotSpeed) {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.35, 16),
      this.woodMat
    );
    platform.position.set(x, y, z);

    // Lotus flower pattern carved on platform
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 1.5, radius * 1.5),
      new THREE.MeshStandardMaterial({
        map: this.textures.createRangoliTexture(256, 2),
        transparent: true
      })
    );
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = 0.18;
    platform.add(decal);

    this.scene.add(platform);
    this.movingPlatforms.push({
      mesh: platform,
      rotSpeed,
      update: (delta) => {
        platform.rotation.y += rotSpeed * delta;
      }
    });

    return platform;
  }

  createSacredTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 5.5, 10), this.woodMat);
    trunk.position.y = 2.75;
    tree.add(trunk);

    // Foliage tiers (Lush sacred foliage)
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2D6A4F, roughness: 0.7 });
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 3.5, 8), leafMat);
    c1.position.y = 5.8;
    tree.add(c1);

    const c2 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.8, 8), leafMat);
    c2.position.y = 7.5;
    tree.add(c2);

    this.scene.add(tree);
    this.addCollider(x, 3, z, 2.4, 6, 2.4);
  }

  createBellPuzzleStation(centerX, centerZ) {
    // Mural Stele with the sacred clue sequence
    const steleGroup = new THREE.Group();
    steleGroup.position.set(centerX, 0, centerZ - 5);

    const stele = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.6), this.stoneMat);
    stele.position.y = 1.6;
    steleGroup.add(stele);

    // Clue inscription showing the sacred mantra order: 1: Om, 2: Lotus, 3: Trishul, 4: Swastika
    const bannerClue = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 1.6),
      new THREE.MeshStandardMaterial({ map: this.textures.createBannerTexture(256, 128) })
    );
    bannerClue.position.set(0, 1.8, 0.32);
    steleGroup.add(bannerClue);
    this.scene.add(steleGroup);

    // 4 Hanging Temple Bells positioned in an arc
    const bellSymbols = ['om', 'lotus', 'trishul', 'swastika'];
    const bellPositions = [
      { x: -6, z: centerZ },
      { x: -2, z: centerZ + 1.5 },
      { x: 2, z: centerZ + 1.5 },
      { x: 6, z: centerZ }
    ];

    this.puzzleBells = [];

    bellPositions.forEach((pos, idx) => {
      const bellGroup = new THREE.Group();
      bellGroup.position.set(pos.x, 0, pos.z);

      // Wooden Arch for hanging
      const arch = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.0, 0.4), this.woodMat);
      arch.position.y = 2.0;
      bellGroup.add(arch);

      // Brass Bell
      const bellMesh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 16), this.brassMat);
      bellMesh.position.y = 2.2;
      bellGroup.add(bellMesh);

      // Sacred Symbol Emblem hanging below bell
      const symbolMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.75, 0.75),
        new THREE.MeshStandardMaterial({
          map: this.textures.createSacredSymbolTexture(bellSymbols[idx]),
          side: THREE.DoubleSide
        })
      );
      symbolMesh.position.set(0, 1.4, 0);
      bellGroup.add(symbolMesh);

      // Base stone platform
      const baseStone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.25, 16), this.stoneMat);
      baseStone.position.y = 0.12;
      bellGroup.add(baseStone);

      this.scene.add(bellGroup);

      const bellObj = {
        id: `bell_${idx}`,
        type: 'bell',
        symbol: bellSymbols[idx],
        index: idx,
        position: new THREE.Vector3(pos.x, 1.4, pos.z),
        bellMesh,
        prompt: `[E] Ring Sacred Bell (${bellSymbols[idx].toUpperCase()})`,
        ring: () => {
          // Bell swing animation
          bellMesh.rotation.z = 0.4;
          setTimeout(() => { bellMesh.rotation.z = -0.3; }, 150);
          setTimeout(() => { bellMesh.rotation.z = 0.15; }, 300);
          setTimeout(() => { bellMesh.rotation.z = 0; }, 450);
        }
      };

      this.interactables.push(bellObj);
      this.puzzleBells.push(bellObj);
    });
  }

  createGate3(z) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, z);

    // Floral Arched Portal
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), this.stoneMat);
    leftPillar.position.set(-5, 3.5, 0);
    gateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), this.stoneMat);
    rightPillar.position.set(5, 3.5, 0);
    gateGroup.add(rightPillar);

    const arch = new THREE.Mesh(new THREE.BoxGeometry(12, 1.6, 2.2), this.stoneMat);
    arch.position.set(0, 7.5, 0);
    gateGroup.add(arch);

    // Decorative Marigold Garland Arch
    const garlandCurve = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.2, 8, 24, Math.PI), this.marigoldMat);
    garlandCurve.position.set(0, 5.0, 0.1);
    gateGroup.add(garlandCurve);

    // Sacred Wooden Lattice Gate
    const latticeGate = new THREE.Mesh(new THREE.BoxGeometry(8, 6.2, 0.4), this.woodMat);
    latticeGate.position.set(0, 3.1, 0);
    gateGroup.add(latticeGate);

    this.scene.add(gateGroup);

    const gateCollider = { min: new THREE.Vector3(-5, 0, z - 1), max: new THREE.Vector3(5, 7, z + 1) };
    this.colliders.push(gateCollider);

    this.interactables.push({
      id: 'gate_3',
      type: 'gate',
      group: gateGroup,
      door: latticeGate,
      collider: gateCollider,
      isOpen: false,
      open: () => {
        // Swing doors upward or slide sideways
        latticeGate.position.y = 10;
        const idx = this.colliders.indexOf(gateCollider);
        if (idx !== -1) this.colliders.splice(idx, 1);
      }
    });
  }

  // ==========================================
  // AREA 4: FESTIVAL STAGE (PANDAL) (Z: 140 to 195)
  // ==========================================
  buildArea4Stage() {
    // Grand Pandal Boundaries
    this.addCollider(-22, 4, 168, 2, 8, 55);
    this.addCollider(22, 4, 168, 2, 8, 55);
    this.addCollider(0, 4, 196, 46, 8, 2); // Back wall behind Ganesha

    // Grand Elevated Festival Stage Platform
    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.2, 42),
      this.stoneMat
    );
    stage.position.set(0, 0.6, 170);
    this.scene.add(stage);

    // Stage Front Steps
    const steps = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 4), this.stoneMat);
    steps.position.set(0, 0.3, 147);
    this.scene.add(steps);

    // Grand Royal Pandal Archway (illuminated overhead)
    for (let z of [154, 172, 190]) {
      const archL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9.0, 1.6), this.goldMat);
      archL.position.set(-14, 4.5, z);
      this.scene.add(archL);

      const archR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9.0, 1.6), this.goldMat);
      archR.position.set(14, 4.5, z);
      this.scene.add(archR);

      const roofBeam = new THREE.Mesh(new THREE.BoxGeometry(30, 1.4, 1.8), this.goldMat);
      roofBeam.position.set(0, 9.2, z);
      this.scene.add(roofBeam);
    }

    // Checkpoint 4 Diya at Festival Stage Entrance
    this.createCheckpointDiya(0, 0.6, 150, 4, 'Festival Stage');

    // Central Divine Flame Brazier Altar (The Divine Festival Flame)
    this.createDivineFlameAltar(0, 1.2, 166);

    // 5 Sacred Standing Diyas (Kuthu Vilakku) surrounding the Altar for Puzzle 3
    this.create5SacredDiyas(0, 166);

    // Crowd Silhouettes on sides celebrating
    this.createCrowdCelebrators();
  }

  createDivineFlameAltar(x, y, z) {
    const altarGroup = new THREE.Group();
    altarGroup.position.set(x, y, z);

    // Grand Golden Lotus Altar
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.8, 24), this.goldMat);
    base.position.y = 0.4;
    altarGroup.add(base);

    // Sacred Flame Vessel (Kumbha / Brazier)
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.9, 1.0, 24), this.brassMat);
    vessel.position.y = 1.2;
    altarGroup.add(vessel);

    this.scene.add(altarGroup);

    // Altar point light (initially low, ignites brightly upon completion)
    this.divineFlameLight = new THREE.PointLight(0xFFB703, 0.5, 12, 2);
    this.divineFlameLight.position.set(x, y + 2.2, z);
    this.scene.add(this.divineFlameLight);

    this.flameAltarObj = {
      position: new THREE.Vector3(x, y + 1.2, z),
      isIgnited: false,
      ignite: () => {
        this.flameAltarObj.isIgnited = true;
        this.particles.createDiyaFlame(new THREE.Vector3(x, y + 2.0, z), 2.8);
        this.divineFlameLight.intensity = 8.0;
        this.divineFlameLight.distance = 35;
      }
    };
  }

  create5SacredDiyas(cx, cz) {
    // 5 positions in a sacred crescent around the altar
    const diyaCoords = [
      { x: cx - 4.5, z: cz - 3.5, label: '1' },
      { x: cx - 5.5, z: cz + 1.5, label: '2' },
      { x: cx, z: cz + 5.0, label: '3' },
      { x: cx + 5.5, z: cz + 1.5, label: '4' },
      { x: cx + 4.5, z: cz - 3.5, label: '5' }
    ];

    this.sacredDiyas = [];

    diyaCoords.forEach((coord, idx) => {
      const diyaGroup = new THREE.Group();
      diyaGroup.position.set(coord.x, 1.2, coord.z);

      // Tall ornate brass standing lamp (Deepastambha)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.3, 16), this.brassMat);
      base.position.y = 0.15;
      diyaGroup.add(base);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.8, 12), this.brassMat);
      shaft.position.y = 1.05;
      diyaGroup.add(shaft);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.25, 0.3, 16), this.brassMat);
      bowl.position.y = 2.05;
      diyaGroup.add(bowl);

      this.scene.add(diyaGroup);

      const diyaObj = {
        id: `diya_${idx}`,
        index: idx,
        position: new THREE.Vector3(coord.x, 1.2, coord.z),
        prompt: `[E] Light Sacred Diya #${idx + 1}`,
        isLit: false,
        flameGroup: null,
        light: () => {
          if (diyaObj.isLit) return;
          diyaObj.isLit = true;
          diyaObj.flameGroup = this.particles.createDiyaFlame(
            new THREE.Vector3(coord.x, 3.4, coord.z),
            1.2
          );
        }
      };

      this.interactables.push({
        ...diyaObj,
        type: 'sacred_diya'
      });
      this.sacredDiyas.push(diyaObj);
    });
  }

  createCrowdCelebrators() {
    // Stylized silhouette figures along the sides of the stage
    const crowdMat = new THREE.MeshStandardMaterial({
      color: 0x5C2434,
      roughness: 0.8
    });

    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (13 + Math.random() * 2.5);
      const z = 150 + Math.random() * 32;

      const person = new THREE.Group();
      person.position.set(x, 1.2, z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.6, 8), crowdMat);
      body.position.y = 0.8;
      person.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), crowdMat);
      head.position.y = 1.8;
      person.add(head);

      // Tiny hand-held diya
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), this.goldMat);
      lamp.position.set(0, 1.3, 0.35);
      person.add(lamp);

      this.scene.add(person);
    }
  }

  createCheckpointDiya(x, y, z, index, name) {
    const cpGroup = new THREE.Group();
    cpGroup.position.set(x, y, z);

    // Carved stone pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 16), this.stoneMat);
    pedestal.position.y = 0.2;
    cpGroup.add(pedestal);

    // Checkpoint brass lamp
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.25, 0.35, 12), this.brassMat);
    lamp.position.y = 0.55;
    cpGroup.add(lamp);

    this.scene.add(cpGroup);
    this.particles.createDiyaFlame(new THREE.Vector3(x, y + 0.85, z), 1.0);

    const cpData = {
      index,
      name,
      position: new THREE.Vector3(x, y + 0.5, z),
      radius: 3.0,
      reached: index === 1 // first checkpoint active at start
    };
    this.checkpoints.push(cpData);
  }

  addCollider(x, y, z, width, height, depth) {
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;

    this.colliders.push({
      min: new THREE.Vector3(x - halfW, y - halfH, z - halfD),
      max: new THREE.Vector3(x + halfW, y + halfH, z + halfD)
    });
  }

  update(delta, time) {
    // Update moving platforms
    for (let p of this.movingPlatforms) {
      p.update(delta);
    }
  }
}

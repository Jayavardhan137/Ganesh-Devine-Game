import * as THREE from 'three';

/**
 * GaneshaModel builds a respectful, beautiful, stylized 3D representation of Lord Ganesha.
 * Seated majestically on a golden lotus throne, featuring:
 * - Ornate Golden Mukut (Crown)
 * - Auspicious curved trunk (Vakratunda)
 * - Large serene ears with golden earrings (Kundalas)
 * - Abhaya Mudra (Blessing posture)
 * - Modak in palm
 * - Rotating celestial Prabhavali (Golden Aura Halo)
 * - Animated subtle breathing & blessing gestures
 */
export class GaneshaModel {
  constructor() {
    this.group = new THREE.Group();
    this.blessingHand = null;
    this.trunkBones = [];
    this.haloMesh = null;
    this.auraLight = null;
    this.isBlessing = false;
    this.blessTime = 0;

    this.buildModel();
  }

  buildModel() {
    // Colors & Materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x443300,
      emissiveIntensity: 0.2
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xEDB88B, // warm terracotta / sandalwood tone
      metalness: 0.1,
      roughness: 0.6
    });

    const dhotiMat = new THREE.MeshStandardMaterial({
      color: 0xE63946, // sacred pitambara vermilion / red
      metalness: 0.15,
      roughness: 0.5
    });

    const lotusMat = new THREE.MeshStandardMaterial({
      color: 0xFF69B4, // Sacred pink lotus
      roughness: 0.4
    });

    // 1. LOTUS THRONE (Base)
    const throneGroup = new THREE.Group();
    const baseCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.7, 0.5, 32),
      goldMat
    );
    baseCylinder.position.y = 0.25;
    throneGroup.add(baseCylinder);

    // Lotus petals ring around throne
    const petalCount = 18;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * Math.PI * 2) / petalCount;
      const petalGeo = new THREE.ConeGeometry(0.35, 0.9, 5);
      petalGeo.rotateX(Math.PI / 3);
      const petal = new THREE.Mesh(petalGeo, lotusMat);
      petal.position.set(Math.cos(angle) * 2.5, 0.5, Math.sin(angle) * 2.5);
      petal.rotation.y = -angle;
      throneGroup.add(petal);
    }
    this.group.add(throneGroup);

    // 2. BODY / TORSO (Seated Lambodara)
    const torso = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 24, 24),
      skinMat
    );
    torso.scale.set(1.2, 1.1, 1.1);
    torso.position.set(0, 1.6, 0);
    this.group.add(torso);

    // Dhoti wrap around lower body
    const dhoti = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 0.8, 24),
      dhotiMat
    );
    dhoti.position.set(0, 0.9, 0);
    this.group.add(dhoti);

    // Cross-legged posture (Folded legs)
    const leftLeg = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.35, 12, 24, Math.PI),
      dhotiMat
    );
    leftLeg.rotation.x = Math.PI / 2;
    leftLeg.position.set(0, 0.65, 0.4);
    this.group.add(leftLeg);

    // 3. HEAD & FACE
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.75, 0.1);

    // Head base
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 24, 24),
      skinMat
    );
    headGroup.add(head);

    // Auspicious forehead dome (Kumbha)
    const domeL = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), skinMat);
    domeL.position.set(-0.32, 0.5, 0.2);
    headGroup.add(domeL);

    const domeR = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), skinMat);
    domeR.position.set(0.32, 0.5, 0.2);
    headGroup.add(domeR);

    // Sacred Tilak on forehead
    const tilakGeo = new THREE.BoxGeometry(0.12, 0.35, 0.05);
    const tilakMat = new THREE.MeshBasicMaterial({ color: 0xFF2222 });
    const tilak = new THREE.Mesh(tilakGeo, tilakMat);
    tilak.position.set(0, 0.45, 0.85);
    headGroup.add(tilak);

    const tilakYellow = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xFFD700 })
    );
    tilakYellow.position.set(0, 0.48, 0.86);
    headGroup.add(tilakYellow);

    // Large serene ears (Shurpa-karna)
    const earGeo = new THREE.CylinderGeometry(0.65, 0.4, 0.06, 16);
    earGeo.rotateZ(Math.PI / 2);

    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-1.1, 0.1, -0.1);
    leftEar.rotation.y = 0.35;
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(1.1, 0.1, -0.1);
    rightEar.rotation.y = -0.35;
    headGroup.add(rightEar);

    // Golden earrings (Kundalas)
    const kundalaGeo = new THREE.TorusGeometry(0.16, 0.04, 8, 16);
    const leftKundala = new THREE.Mesh(kundalaGeo, goldMat);
    leftKundala.position.set(-1.3, -0.3, -0.1);
    headGroup.add(leftKundala);

    const rightKundala = new THREE.Mesh(kundalaGeo, goldMat);
    rightKundala.position.set(1.3, -0.3, -0.1);
    headGroup.add(rightKundala);

    // Sacred Golden Mukut (Crown)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.8, 0);

    const crownTier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.45, 24), goldMat);
    crownGroup.add(crownTier1);

    const crownTier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 0.5, 24), goldMat);
    crownTier2.position.y = 0.45;
    crownGroup.add(crownTier2);

    const crownPinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 16), goldMat);
    crownPinnacle.position.y = 0.95;
    crownGroup.add(crownPinnacle);

    headGroup.add(crownGroup);

    // TRUNK (Vakratunda) - graceful segmented curve
    const trunkGroup = new THREE.Group();
    trunkGroup.position.set(0, -0.05, 0.75);

    let prevPart = trunkGroup;
    const trunkSegments = 7;
    for (let s = 0; s < trunkSegments; s++) {
      const radius = 0.28 * (1 - s * 0.1);
      const segGeo = new THREE.CylinderGeometry(radius * 0.88, radius, 0.22, 16);
      segGeo.translate(0, -0.1, 0);
      const segMesh = new THREE.Mesh(segGeo, skinMat);

      // Curve gracefully to the left side (traditional Vamamukhi Ganesha)
      segMesh.rotation.x = 0.28;
      segMesh.rotation.z = s > 2 ? 0.26 : 0.05;
      prevPart.add(segMesh);
      prevPart = segMesh;
      this.trunkBones.push(segMesh);
    }

    // Sacred Modak in trunk tip
    const modakGeo = new THREE.ConeGeometry(0.12, 0.2, 12);
    const modakMesh = new THREE.Mesh(modakGeo, goldMat);
    modakMesh.position.set(0, -0.22, 0.05);
    prevPart.add(modakMesh);

    headGroup.add(trunkGroup);

    // Tusk (Ekadanta - right tusk intact, left sacred broken tusk)
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.3 });
    const rightTusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 12), tuskMat);
    rightTusk.position.set(0.35, -0.3, 0.65);
    rightTusk.rotation.x = -Math.PI / 3;
    rightTusk.rotation.z = -0.2;
    headGroup.add(rightTusk);

    const leftTusk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), tuskMat);
    leftTusk.position.set(-0.35, -0.3, 0.65);
    leftTusk.rotation.x = -Math.PI / 3;
    headGroup.add(leftTusk);

    this.group.add(headGroup);

    // 4. ARMS & HANDS
    // Lower Right Arm: ABHAYA MUDRA (Blessing Hand)
    const blessingArmGroup = new THREE.Group();
    blessingArmGroup.position.set(1.2, 1.8, 0.4);

    const bArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12), skinMat);
    bArm.rotation.z = -Math.PI / 4;
    blessingArmGroup.add(bArm);

    // Forearm raised upright
    const bForearm = new THREE.Group();
    bForearm.position.set(0.4, 0.2, 0.2);

    const bForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.7, 12), skinMat);
    bForearmMesh.rotation.x = -0.3;
    bForearm.add(bForearmMesh);

    // Open Palm facing forward
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.08), skinMat);
    palm.position.set(0, 0.45, 0.1);

    // Golden symbol in palm
    const palmSymbol = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 12),
      new THREE.MeshBasicMaterial({ color: 0xFFD700 })
    );
    palmSymbol.position.set(0, 0, 0.05);
    palm.add(palmSymbol);

    bForearm.add(palm);
    blessingArmGroup.add(bForearm);
    this.blessingHand = bForearm;
    this.group.add(blessingArmGroup);

    // Lower Left Arm: Holding Bowl of Modaks
    const bowlArmGroup = new THREE.Group();
    bowlArmGroup.position.set(-1.2, 1.7, 0.4);
    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12), skinMat);
    lArm.rotation.z = Math.PI / 4;
    bowlArmGroup.add(lArm);

    // Golden Modak Bowl
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
    bowl.position.set(-0.4, -0.1, 0.4);
    bowl.rotation.x = Math.PI;
    bowlArmGroup.add(bowl);
    this.group.add(bowlArmGroup);

    // 5. CELESTIAL PRABHAVALI (Rotating Divine Halo Ring)
    const haloGeo = new THREE.TorusGeometry(2.3, 0.08, 16, 48);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFA500,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.position.set(0, 2.6, -0.5);

    // Halo flame rays
    const raysCount = 16;
    for (let i = 0; i < raysCount; i++) {
      const angle = (i * Math.PI * 2) / raysCount;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), haloMat);
      ray.position.set(Math.cos(angle) * 2.3, Math.sin(angle) * 2.3, 0);
      ray.rotation.z = angle - Math.PI / 2;
      this.haloMesh.add(ray);
    }
    this.group.add(this.haloMesh);

    // Divine Aura Point Light
    this.auraLight = new THREE.PointLight(0xFFD700, 3.5, 16, 2);
    this.auraLight.position.set(0, 2.8, 1.0);
    this.group.add(this.auraLight);
  }

  triggerBlessingGesture() {
    this.isBlessing = true;
    this.blessTime = 0;
  }

  update(delta, time) {
    // Subtle idle breathing
    const breath = Math.sin(time * 1.8) * 0.03;
    this.group.position.y += Math.sin(time * 1.8) * 0.0008;

    // Prabhavali slow divine rotation
    if (this.haloMesh) {
      this.haloMesh.rotation.z = time * 0.25;
    }

    // Gentle trunk sway
    if (this.trunkBones.length > 0) {
      this.trunkBones[this.trunkBones.length - 1].rotation.z =
        0.26 + Math.sin(time * 2.2) * 0.08;
    }

    // Aura light subtle pulsation
    if (this.auraLight) {
      this.auraLight.intensity = 3.2 + Math.sin(time * 3.0) * 0.6;
    }

    // Blessing animation if triggered
    if (this.isBlessing && this.blessingHand) {
      this.blessTime += delta * 2.5;
      const wave = Math.sin(this.blessTime);
      this.blessingHand.rotation.x = -0.3 + wave * 0.35;
      this.blessingHand.rotation.z = wave * 0.15;

      if (this.blessTime > Math.PI * 2) {
        this.isBlessing = false;
        this.blessingHand.rotation.x = -0.3;
        this.blessingHand.rotation.z = 0;
      }
    }
  }
}

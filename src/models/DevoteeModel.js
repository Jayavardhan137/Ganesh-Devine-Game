import * as THREE from 'three';

/**
 * DevoteeModel builds a stylized 3D young Indian devotee character.
 * Features:
 * - Traditional Kurta (saffron/cream) & Dhoti
 * - Angavastram (festive shawl scarf) that flows with movement
 * - Fully articulated procedural skeleton (Head, Torso, Arms, Legs)
 * - State machine: idle, walk, run, sprint, jump, fall, land, interact (namaste), celebrate (arms raised)
 */
export class DevoteeModel {
  constructor() {
    this.group = new THREE.Group();
    this.currentState = 'idle';
    this.animTime = 0;
    this.speed = 0;

    this.parts = {};
    this.buildDevotee();
  }

  buildDevotee() {
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xD4A373, // warm Indian skin tone
      roughness: 0.6
    });

    const kurtaMat = new THREE.MeshStandardMaterial({
      color: 0xFF9E00, // Vibrant festive saffron orange
      roughness: 0.55
    });

    const dhotiMat = new THREE.MeshStandardMaterial({
      color: 0xFAEDCD, // Traditional ivory / cream cotton
      roughness: 0.6
    });

    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xE63946, // Festive red / vermilion scarf
      roughness: 0.5
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.7,
      roughness: 0.3
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1A1423,
      roughness: 0.8
    });

    // Root Root
    const root = new THREE.Group();
    root.position.y = 0;
    this.group.add(root);
    this.parts.root = root;

    // Pelvis / Hips
    const hips = new THREE.Group();
    hips.position.y = 1.05;
    root.add(hips);
    this.parts.hips = hips;

    const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.35), dhotiMat);
    hips.add(hipsMesh);

    // Torso / Kurta
    const torso = new THREE.Group();
    torso.position.y = 0.3;
    hips.add(torso);
    this.parts.torso = torso;

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.38), kurtaMat);
    torso.add(torsoMesh);

    // Kurta gold border hem
    const hemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.4), goldTrimMat);
    hemMesh.position.y = -0.32;
    torso.add(hemMesh);

    // Angavastram (diagonal chest sash & flowing ends)
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.16, 0.42), scarfMat);
    sash.rotation.z = 0.3;
    torso.add(sash);

    const scarfTailL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.06), scarfMat);
    scarfTailL.position.set(-0.25, -0.4, 0.2);
    torso.add(scarfTailL);
    this.parts.scarfTailL = scarfTailL;

    // Neck & Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.55, 0);
    torso.add(headGroup);
    this.parts.head = headGroup;

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 12), skinMat);
    neck.position.y = 0.08;
    headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
    head.position.y = 0.3;
    headGroup.add(head);

    // Hair & Topknot / Kudumi
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), hairMat);
    hair.position.set(0, 0.36, -0.05);
    hair.scale.set(1.02, 0.95, 1.05);
    headGroup.add(hair);

    const topKnot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), hairMat);
    topKnot.position.set(0, 0.58, -0.08);
    headGroup.add(topKnot);

    // Small red forehead tilak
    const tilak = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.09, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xE63946 })
    );
    tilak.position.set(0, 0.34, 0.23);
    headGroup.add(tilak);

    // SHOULDERS & ARMS
    // Left Arm
    const leftArmRoot = new THREE.Group();
    leftArmRoot.position.set(-0.38, 0.28, 0);
    torso.add(leftArmRoot);
    this.parts.leftArm = leftArmRoot;

    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 8), kurtaMat);
    leftArmMesh.position.y = -0.22;
    leftArmRoot.add(leftArmMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.45;
    leftArmRoot.add(leftForearm);
    this.parts.leftForearm = leftForearm;

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8), skinMat);
    leftForearmMesh.position.y = -0.21;
    leftForearm.add(leftForearmMesh);

    // Right Arm
    const rightArmRoot = new THREE.Group();
    rightArmRoot.position.set(0.38, 0.28, 0);
    torso.add(rightArmRoot);
    this.parts.rightArm = rightArmRoot;

    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 8), kurtaMat);
    rightArmMesh.position.y = -0.22;
    rightArmRoot.add(rightArmMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.45;
    rightArmRoot.add(rightForearm);
    this.parts.rightForearm = rightForearm;

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8), skinMat);
    rightForearmMesh.position.y = -0.21;
    rightForearm.add(rightForearmMesh);

    // LEGS
    // Left Leg
    const leftLegRoot = new THREE.Group();
    leftLegRoot.position.set(-0.18, -0.18, 0);
    hips.add(leftLegRoot);
    this.parts.leftLeg = leftLegRoot;

    const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.5, 8), dhotiMat);
    leftThighMesh.position.y = -0.25;
    leftLegRoot.add(leftThighMesh);

    const leftCalf = new THREE.Group();
    leftCalf.position.y = -0.5;
    leftLegRoot.add(leftCalf);
    this.parts.leftCalf = leftCalf;

    const leftCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.5, 8), dhotiMat);
    leftCalfMesh.position.y = -0.25;
    leftCalf.add(leftCalfMesh);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), skinMat);
    leftFoot.position.set(0, -0.52, 0.06);
    leftCalf.add(leftFoot);

    // Right Leg
    const rightLegRoot = new THREE.Group();
    rightLegRoot.position.set(0.18, -0.18, 0);
    hips.add(rightLegRoot);
    this.parts.rightLeg = rightLegRoot;

    const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.5, 8), dhotiMat);
    rightThighMesh.position.y = -0.25;
    rightLegRoot.add(rightThighMesh);

    const rightCalf = new THREE.Group();
    rightCalf.position.y = -0.5;
    rightLegRoot.add(rightCalf);
    this.parts.rightCalf = rightCalf;

    const rightCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.5, 8), dhotiMat);
    rightCalfMesh.position.y = -0.25;
    rightCalf.add(rightCalfMesh);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), skinMat);
    rightFoot.position.set(0, -0.52, 0.06);
    rightCalf.add(rightFoot);

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.45, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.group.add(shadow);
  }

  setState(newState) {
    if (this.currentState === newState) return;
    this.currentState = newState;
  }

  update(delta, moveSpeed = 0, isGrounded = true) {
    this.animTime += delta;
    const { hips, torso, head, leftArm, rightArm, leftForearm, rightForearm, leftLeg, rightLeg, leftCalf, rightCalf, scarfTailL } = this.parts;

    // Reset subtle rotations
    torso.rotation.y = 0;
    torso.rotation.x = 0;
    head.rotation.y = 0;
    head.rotation.x = 0;

    if (!isGrounded) {
      // JUMP / FALL ANIMATION
      hips.position.y = 1.1;
      leftLeg.rotation.x = -0.4;
      rightLeg.rotation.x = 0.3;
      leftCalf.rotation.x = 0.6;
      rightCalf.rotation.x = 0.4;

      leftArm.rotation.x = 1.2;
      rightArm.rotation.x = 1.2;
      leftArm.rotation.z = -0.4;
      rightArm.rotation.z = 0.4;
      leftForearm.rotation.x = -0.5;
      rightForearm.rotation.x = -0.5;
    } else if (this.currentState === 'celebrate') {
      // CELEBRATE VICTORY POSE
      const dance = Math.sin(this.animTime * 8);
      hips.position.y = 1.05 + Math.abs(dance) * 0.12;

      // Arms raised joyfully
      leftArm.rotation.set(0, 0, -2.4 + dance * 0.15);
      rightArm.rotation.set(0, 0, 2.4 - dance * 0.15);
      leftForearm.rotation.set(-0.3, 0, 0);
      rightForearm.rotation.set(-0.3, 0, 0);

      leftLeg.rotation.set(0, 0, -0.15);
      rightLeg.rotation.set(0, 0, 0.15);
      leftCalf.rotation.set(0.2, 0, 0);
      rightCalf.rotation.set(0.2, 0, 0);
    } else if (this.currentState === 'interact') {
      // NAMASTE / PRAYER POSE
      hips.position.y = 1.05;
      torso.rotation.x = 0.12; // respectful bow
      head.rotation.x = 0.15;

      // Palms joined in front of chest
      leftArm.rotation.set(0.6, 0.5, -0.4);
      rightArm.rotation.set(0.6, -0.5, 0.4);
      leftForearm.rotation.set(-1.2, -0.5, 0.3);
      rightForearm.rotation.set(-1.2, 0.5, -0.3);

      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);
      leftCalf.rotation.set(0, 0, 0);
      rightCalf.rotation.set(0, 0, 0);
    } else if (moveSpeed > 0.1) {
      // WALK / RUN / SPRINT ANIMATION
      const frequency = moveSpeed > 7 ? 14 : (moveSpeed > 4 ? 10 : 7);
      const stride = Math.sin(this.animTime * frequency);
      const bob = Math.abs(Math.sin(this.animTime * frequency * 0.5)) * (moveSpeed > 7 ? 0.12 : 0.06);

      hips.position.y = 1.05 + bob;
      torso.rotation.x = moveSpeed > 7 ? 0.25 : 0.1; // forward sprint lean
      torso.rotation.y = -stride * 0.12;

      // Dynamic leg strides
      const legAmplitude = moveSpeed > 7 ? 0.95 : 0.65;
      leftLeg.rotation.x = stride * legAmplitude;
      rightLeg.rotation.x = -stride * legAmplitude;

      // Knee bend on back swing
      leftCalf.rotation.x = stride > 0 ? stride * 0.8 : 0.1;
      rightCalf.rotation.x = stride < 0 ? -stride * 0.8 : 0.1;

      // Opposite arm swings
      const armAmplitude = moveSpeed > 7 ? 1.1 : 0.7;
      leftArm.rotation.set(-stride * armAmplitude, 0, -0.15);
      rightArm.rotation.set(stride * armAmplitude, 0, 0.15);
      leftForearm.rotation.set(-0.35, 0, 0);
      rightForearm.rotation.set(-0.35, 0, 0);

      // Scarf trailing dynamically in wind
      if (scarfTailL) {
        scarfTailL.rotation.x = -0.4 - (moveSpeed / 10) * 0.8 + Math.sin(this.animTime * 15) * 0.15;
      }
    } else {
      // IDLE ANIMATION
      const breath = Math.sin(this.animTime * 2.2);
      hips.position.y = 1.05 + breath * 0.015;
      torso.rotation.x = breath * 0.02;
      head.rotation.x = -breath * 0.02;

      leftLeg.rotation.set(0, 0, -0.05);
      rightLeg.rotation.set(0, 0, 0.05);
      leftCalf.rotation.set(0, 0, 0);
      rightCalf.rotation.set(0, 0, 0);

      leftArm.rotation.set(0, 0, -0.1 + breath * 0.03);
      rightArm.rotation.set(0, 0, 0.1 - breath * 0.03);
      leftForearm.rotation.set(-0.15, 0, 0);
      rightForearm.rotation.set(-0.15, 0, 0);

      if (scarfTailL) {
        scarfTailL.rotation.x = breath * 0.05;
      }
    }
  }
}

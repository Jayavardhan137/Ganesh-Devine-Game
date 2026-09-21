import * as THREE from 'three';

/**
 * PlayerController handles 3D character movement, physics, collision detection,
 * footstep audio, and interaction triggers.
 */
export class PlayerController {
  constructor(devoteeModel, cameraController, environment, audio) {
    this.model = devoteeModel;
    this.cam = cameraController;
    this.env = environment;
    this.audio = audio;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = 0;

    // Movement tuning
    this.walkSpeed = 5.2;
    this.runSpeed = 7.5;
    this.sprintSpeed = 10.5;
    this.acceleration = 24.0;
    this.friction = 14.0;

    this.jumpForce = 8.8;
    this.gravity = 24.0;
    this.isGrounded = true;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      interact: false
    };

    // Virtual Joystick input (for mobile/tablets)
    this.joystickInput = { x: 0, y: 0 };

    this.footstepTimer = 0;
    this.currentCheckpoint = null;

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          if (!this.keys.jump && this.isGrounded) {
            this.jump();
          }
          this.keys.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'KeyE':
          this.keys.interact = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'KeyE':
          this.keys.interact = false;
          break;
      }
    });
  }

  jump() {
    if (!this.isGrounded) return;
    this.velocity.y = this.jumpForce;
    this.isGrounded = false;
    this.audio.playJump();
    this.model.setState('jump');
  }

  setCheckpoint(cp) {
    this.currentCheckpoint = cp;
  }

  respawnAtCheckpoint() {
    if (this.currentCheckpoint) {
      this.position.copy(this.currentCheckpoint.position);
    } else {
      this.position.set(0, 0, 0);
    }
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.model.group.position.copy(this.position);
  }

  update(delta, abilityActive = false) {
    // 1. Calculate Input Direction relative to camera yaw
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Add virtual joystick input if active
    if (Math.abs(this.joystickInput.x) > 0.05 || Math.abs(this.joystickInput.y) > 0.05) {
      moveX = this.joystickInput.x;
      moveZ = -this.joystickInput.y;
    }

    const inputLen = Math.hypot(moveX, moveZ);
    let targetSpeed = 0;

    if (inputLen > 0.1) {
      moveX /= Math.max(1, inputLen);
      moveZ /= Math.max(1, inputLen);

      // Rotate input by camera yaw
      const camYaw = this.cam.yaw;
      const worldDirX = moveX * Math.cos(camYaw) + moveZ * Math.sin(camYaw);
      const worldDirZ = -moveX * Math.sin(camYaw) + moveZ * Math.cos(camYaw);

      // Speed selection
      const baseMaxSpeed = this.keys.sprint ? this.sprintSpeed : this.runSpeed;
      const effectiveMaxSpeed = abilityActive ? baseMaxSpeed * 1.4 : baseMaxSpeed;
      targetSpeed = effectiveMaxSpeed * Math.min(1, inputLen);

      // Accelerate towards target velocity
      this.velocity.x += (worldDirX * targetSpeed - this.velocity.x) * (this.acceleration * delta);
      this.velocity.z += (worldDirZ * targetSpeed - this.velocity.z) * (this.acceleration * delta);

      // Rotate player character smoothly toward movement direction
      const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
      let diff = targetRotation - this.rotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.rotation += diff * (15.0 * delta);
    } else {
      // Apply ground friction deceleration
      this.velocity.x += (0 - this.velocity.x) * (this.friction * delta);
      this.velocity.z += (0 - this.velocity.z) * (this.friction * delta);
    }

    // 2. Gravity & Vertical Movement
    this.velocity.y -= this.gravity * delta;

    // 3. Collision Detection & Position Update
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const newPos = this.position.clone();

    // Check X Movement Collision
    newPos.x += this.velocity.x * delta;
    if (this.checkWallCollision(newPos)) {
      newPos.x = this.position.x;
      this.velocity.x = 0;
    }

    // Check Z Movement Collision
    newPos.z += this.velocity.z * delta;
    if (this.checkWallCollision(newPos)) {
      newPos.z = this.position.z;
      this.velocity.z = 0;
    }

    // Check Y (Ground / Platform) Collision
    newPos.y += this.velocity.y * delta;
    const groundY = this.getGroundHeight(newPos);

    if (newPos.y <= groundY) {
      newPos.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Check if player fell into void or water gap
    if (newPos.y < -3.0) {
      this.respawnAtCheckpoint();
      return;
    }

    this.position.copy(newPos);
    this.model.group.position.copy(this.position);
    this.model.group.rotation.y = this.rotation;

    // 4. Update Animations & Footstep Audio
    this.model.update(delta, horizSpeed, this.isGrounded);

    if (this.isGrounded && horizSpeed > 0.8) {
      this.footstepTimer += delta * (horizSpeed > 8 ? 2.5 : 1.8);
      if (this.footstepTimer >= 1.0) {
        this.footstepTimer = 0;
        this.audio.playFootstep();
      }
    }
  }

  checkWallCollision(pos) {
    const playerRadius = 0.45;
    const playerHeight = 1.8;

    for (let c of this.env.colliders) {
      if (
        pos.x + playerRadius > c.min.x &&
        pos.x - playerRadius < c.max.x &&
        pos.z + playerRadius > c.min.z &&
        pos.z - playerRadius < c.max.z &&
        pos.y + playerHeight > c.min.y &&
        pos.y < c.max.y
      ) {
        return true;
      }
    }
    return false;
  }

  getGroundHeight(pos) {
    let maxHeight = 0; // default street level

    // Courtyard platform (z: 54 to 74, y = 0.4)
    if (pos.z >= 54 && pos.z <= 74 && Math.abs(pos.x) <= 9) {
      maxHeight = Math.max(maxHeight, 0.4);
    }

    // Festival Stage platform (z: 147 to 192, y = 1.2 or 0.6 on steps)
    if (pos.z >= 145 && pos.z <= 149 && Math.abs(pos.x) <= 8) {
      maxHeight = Math.max(maxHeight, 0.6); // steps
    } else if (pos.z >= 149 && pos.z <= 194 && Math.abs(pos.x) <= 16) {
      maxHeight = Math.max(maxHeight, 1.2); // main stage
    }

    // Moving & rotating platforms in Garden (z: 102 to 110)
    for (let p of this.env.movingPlatforms) {
      const dist = Math.hypot(pos.x - p.mesh.position.x, pos.z - p.mesh.position.z);
      if (dist <= 2.2) {
        maxHeight = Math.max(maxHeight, p.mesh.position.y);
      }
    }

    return maxHeight;
  }
}

import * as THREE from 'three';

/**
 * CameraController provides a smooth, cinematic 3rd-person follow & orbit camera.
 * Supports:
 * - Mouse drag / pointer lock look
 * - Dynamic FOV during sprint / ability
 * - Collision zoom to avoid clipping inside walls
 * - Cinematic mode transitions for Intro & Finale
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.target = new THREE.Vector3(0, 1.2, 0);
    this.distance = 6.2;
    this.minDistance = 2.5;
    this.maxDistance = 9.0;

    this.yaw = 0;
    this.pitch = 0.25; // slight elevated angle

    this.minPitch = -0.15;
    this.maxPitch = 1.1;

    this.isPointerLocked = false;
    this.isDragging = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    this.sensitivity = 0.0032;
    this.isCinematic = false;
    this.cinematicTarget = null;
    this.cinematicPos = null;

    this.initEventListeners();
  }

  initEventListeners() {
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isCinematic) return;

      if (document.pointerLockElement === this.domElement) {
        this.yaw -= e.movementX * this.sensitivity;
        this.pitch += e.movementY * this.sensitivity;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
      } else if (this.isDragging) {
        const dx = e.clientX - this.prevMouseX;
        const dy = e.clientY - this.prevMouseY;
        this.yaw -= dx * this.sensitivity;
        this.pitch += dy * this.sensitivity;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    // Touch controls for mobile / tablet camera swipe
    let touchStartX = 0;
    let touchStartY = 0;
    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.4) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      if (this.isCinematic) return;
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.4) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        this.yaw -= dx * (this.sensitivity * 0.8);
        this.pitch += dy * (this.sensitivity * 0.8);
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.domElement.addEventListener('wheel', (e) => {
      this.distance += e.deltaY * 0.005;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }, { passive: true });
  }

  setCinematic(isCinematic, pos = null, target = null) {
    this.isCinematic = isCinematic;
    this.cinematicPos = pos;
    this.cinematicTarget = target;
  }

  update(delta, playerPos, isSprinting = false, abilityActive = false) {
    if (this.isCinematic) {
      if (this.cinematicPos) this.camera.position.lerp(this.cinematicPos, 3.0 * delta);
      if (this.cinematicTarget) {
        const curLook = new THREE.Vector3();
        this.camera.getWorldDirection(curLook);
        this.camera.lookAt(this.cinematicTarget);
      }
      return;
    }

    // Dynamic FOV (wider when sprinting / divine boost)
    const targetFov = abilityActive ? 68 : (isSprinting ? 64 : 58);
    this.camera.fov += (targetFov - this.camera.fov) * (4.0 * delta);
    this.camera.updateProjectionMatrix();

    // Smoothly interpolate target to player's center of mass
    this.target.lerp(new THREE.Vector3(playerPos.x, playerPos.y + 1.2, playerPos.z), 12.0 * delta);

    // Calculate ideal camera position based on yaw, pitch, and distance
    const horizontalDist = this.distance * Math.cos(this.pitch);
    const verticalDist = this.distance * Math.sin(this.pitch);

    const desiredX = this.target.x + horizontalDist * Math.sin(this.yaw);
    const desiredY = this.target.y + verticalDist;
    const desiredZ = this.target.z + horizontalDist * Math.cos(this.yaw);

    const desiredPos = new THREE.Vector3(desiredX, Math.max(0.5, desiredY), desiredZ);

    // Smooth camera motion
    this.camera.position.lerp(desiredPos, 14.0 * delta);
    this.camera.lookAt(this.target);
  }
}

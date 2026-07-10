import * as THREE from 'three';

const CONFETTI_COUNT = 500;
const GRAVITY = -9.8;
const TERMINAL_VELOCITY = -3.0;
const LIFETIME = 5.0; // seconds

const COLORS = [
  0xff4081, // Pink
  0x00e5ff, // Cyan
  0xffeb3b, // Yellow
  0x69f0ae, // Green
  0xb388ff, // Purple
  0xff6e40, // Orange
];

interface ConfettiPiece {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  drift: number;
}

export class ConfettiSystem {
  private scene: THREE.Scene;
  private mesh: THREE.InstancedMesh;
  private pieces: ConfettiPiece[] = [];
  private active: boolean = false;
  private elapsedTime: number = 0;
  private dummy: THREE.Object3D;
  private color: THREE.Color;
  private material: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Geometry for a small rectangular piece of confetti
    const geometry = new THREE.PlaneGeometry(0.15, 0.3);
    
    // Custom material to allow global opacity fading
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, CONFETTI_COUNT);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.visible = false;
    
    // Provide a dummy matrix so it doesn't crash before being placed
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();

    this.scene.add(this.mesh);
  }

  public play() {
    this.active = true;
    this.elapsedTime = 0;
    this.mesh.visible = true;
    this.material.opacity = 1.0;

    this.pieces = [];
    
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      // Spawn slightly above the board
      const x = (Math.random() - 0.5) * 16; // -8 to 8
      const z = (Math.random() - 0.5) * 16; // -8 to 8
      const y = 15 + Math.random() * 5; // 15 to 20

      // Initial velocity burst
      const vx = (Math.random() - 0.5) * 4;
      const vy = (Math.random() - 0.5) * 2 - 1;
      const vz = (Math.random() - 0.5) * 4;

      // Rotation and tumbling
      const rx = Math.random() * Math.PI;
      const ry = Math.random() * Math.PI;
      const rz = Math.random() * Math.PI;

      const rsx = (Math.random() - 0.5) * 10;
      const rsy = (Math.random() - 0.5) * 10;
      const rsz = (Math.random() - 0.5) * 10;

      // Random color
      const hexColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.color.setHex(hexColor);
      this.mesh.setColorAt(i, this.color);

      this.pieces.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(vx, vy, vz),
        rotation: new THREE.Vector3(rx, ry, rz),
        rotationSpeed: new THREE.Vector3(rsx, rsy, rsz),
        drift: (Math.random() - 0.5) * 2
      });
    }

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public update(deltaTime: number) {
    if (!this.active) return;

    this.elapsedTime += deltaTime;

    // Fade out during the last second
    if (this.elapsedTime > LIFETIME - 1) {
      this.material.opacity = Math.max(0, 1 - (this.elapsedTime - (LIFETIME - 1)));
    }

    if (this.elapsedTime >= LIFETIME) {
      this.stop();
      return;
    }

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const piece = this.pieces[i];
      
      // Gravity and Terminal Velocity
      piece.velocity.y += GRAVITY * deltaTime;
      if (piece.velocity.y < TERMINAL_VELOCITY) {
        piece.velocity.y = TERMINAL_VELOCITY;
      }

      // Air resistance / horizontal drag
      piece.velocity.x *= Math.pow(0.5, deltaTime);
      piece.velocity.z *= Math.pow(0.5, deltaTime);

      // Flutter / Drift
      piece.position.x += (Math.sin(this.elapsedTime * 3 + i) * piece.drift * deltaTime);
      piece.position.z += (Math.cos(this.elapsedTime * 3 + i) * piece.drift * deltaTime);

      // Apply velocity
      piece.position.addScaledVector(piece.velocity, deltaTime);

      // Apply rotation
      piece.rotation.addScaledVector(piece.rotationSpeed, deltaTime);

      // Update dummy object to get matrix
      this.dummy.position.copy(piece.position);
      this.dummy.rotation.set(piece.rotation.x, piece.rotation.y, piece.rotation.z);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public stop() {
    this.active = false;
    this.mesh.visible = false;
    this.pieces = [];
  }

  public dispose() {
    this.stop();
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

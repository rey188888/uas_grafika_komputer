import * as THREE from "three";
import { targetGroup, stats } from "./ball.js";

// Fungsi acak posisi
function randomizePosition() {
  targetGroup.position.set(
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 2
  );
}

// Dipanggil saat awal mulai
export function init() {
  randomizePosition();
  stats.spawned++; 
}

// Dipanggil saat bola kena hit
export function onHit(respawnCallback) {
  setTimeout(() => {
    randomizePosition();
    respawnCallback(); 
  }, 100);
}

export function playHitExplosion(scene, sphereVisual, onComplete) {
  const particles = [];
  const origin = new THREE.Vector3();
  sphereVisual.getWorldPosition(origin);

  for (let i = 0; i < 16; i++) {
    const geo = new THREE.SphereGeometry(Math.random() * 0.04 + 0.02, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xffaa00 : 0x888888,
      transparent: true,
      opacity: 1
    });

    const p = new THREE.Mesh(geo, mat);
    p.position.copy(origin);
    p.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.25,
      Math.random() * 0.25,
      (Math.random() - 0.5) * 0.25
    );

    scene.add(p);
    particles.push(p);
  }

  let life = 0;
  (function animate() {
    life++;
    particles.forEach(p => {
      p.position.add(p.userData.vel);
      p.material.opacity -= 0.04;
      p.scale.multiplyScalar(0.95);
    });

    if (life < 25) requestAnimationFrame(animate);
    else {
      particles.forEach(p => scene.remove(p));
      if (onComplete) onComplete();
    }
  })();
}
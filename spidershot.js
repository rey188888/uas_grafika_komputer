import * as THREE from "three";
import { targetGroup, stats } from "./ball.js";

// Fungsi acak posisi - spread across room
function randomizePosition() {
  targetGroup.position.set(
    (Math.random() - 0.5) * 20,  // X: -10 to +10
    (Math.random() - 0.5) * 12,  // Y: -6 to +6
    (Math.random() - 0.5) * 8    // Z: -4 to +4
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

  // 1. Flash effect (expanding sphere)
  const flashGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.8 });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.copy(origin);
  scene.add(flash);

  // 2. Debris particles
  const particleCount = 40;
  const colors = [0xffaa00, 0xff4400, 0xffff00, 0xffffff];

  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(Math.random() * 0.05 + 0.02, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 1
    });

    const p = new THREE.Mesh(geo, mat);
    p.position.copy(origin);
    
    // Random direction outward
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const speed = Math.random() * 0.4 + 0.1;
    
    p.userData.vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).multiplyScalar(speed);

    scene.add(p);
    particles.push(p);
  }

  // Animation loop
  let life = 0;
  const maxLife = 35;
  
  (function animate() {
    life++;
    
    // Update flash
    flash.scale.multiplyScalar(1.15);
    flash.material.opacity *= 0.85;

    // Update particles
    particles.forEach(p => {
      p.position.add(p.userData.vel);
      p.userData.vel.multiplyScalar(0.92); // Drag
      p.userData.vel.y -= 0.01; // Gravity (sedikit)
      p.scale.multiplyScalar(0.95);
      p.material.opacity -= 0.03;
    });

    if (life < maxLife) {
      requestAnimationFrame(animate);
    } else {
      // Cleanup
      scene.remove(flash);
      particles.forEach(p => scene.remove(p));
      
      // Dispose geometries/materials
      flashGeo.dispose();
      flashMat.dispose();
      particles.forEach(p => {
        p.geometry.dispose();
        p.material.dispose();
      });

      if (onComplete) onComplete();
    }
  })();
}

// Version that takes a position directly (for Practice Mode)
export function playHitExplosionAt(scene, position, onComplete) {
  const particles = [];
  const origin = position.clone();

  // 1. Flash effect (expanding sphere)
  const flashGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.8 });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.copy(origin);
  scene.add(flash);

  // 2. Debris particles
  const particleCount = 40;
  const colors = [0xffaa00, 0xff4400, 0xffff00, 0xffffff];

  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(Math.random() * 0.05 + 0.02, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 1
    });

    const p = new THREE.Mesh(geo, mat);
    p.position.copy(origin);
    
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const speed = Math.random() * 0.4 + 0.1;
    
    p.userData.vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).multiplyScalar(speed);

    scene.add(p);
    particles.push(p);
  }

  let life = 0;
  const maxLife = 35;
  
  (function animate() {
    life++;
    
    flash.scale.multiplyScalar(1.15);
    flash.material.opacity *= 0.85;

    particles.forEach(p => {
      p.position.add(p.userData.vel);
      p.userData.vel.multiplyScalar(0.92);
      p.userData.vel.y -= 0.01;
      p.scale.multiplyScalar(0.95);
      p.material.opacity -= 0.03;
    });

    if (life < maxLife) {
      requestAnimationFrame(animate);
    } else {
      scene.remove(flash);
      particles.forEach(p => scene.remove(p));
      
      flashGeo.dispose();
      flashMat.dispose();
      particles.forEach(p => {
        p.geometry.dispose();
        p.material.dispose();
      });

      if (onComplete) onComplete();
    }
  })();
}
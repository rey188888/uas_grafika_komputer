import * as THREE from "three";
import { targetGroup } from "./ball.js";

/* ===================== PRACTICE MODE CONFIG ===================== */
const PRACTICE_CONFIG = {
  targetCount: 30,
  distanceMin: 25,
  distanceMax: 30,
  rangeX: 18,
  rangeY: 10,
  hitboxRadius: 0.6,
  minSpacing: 2.5 // Minimum distance between balls
};

/* ===================== TEXTURES ===================== */
const loader = new THREE.TextureLoader();
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");

/* ===================== TARGET FACTORY ===================== */
function createPracticeTarget() {
  const group = new THREE.Group();
  
  // Visual ball
  const visual = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      normalMap: normal,
      roughnessMap: rough,
      aoMap: rough,
      displacementMap: height,
      roughness: 0.5,
      metalness: 0.1
    })
  );
  
  // Hitbox (larger for easier clicking)
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(PRACTICE_CONFIG.hitboxRadius, 16, 16),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  
  group.add(visual, hitbox);
  return { group, visual, hitbox };
}

/* ===================== STATE ===================== */
let targets = [];
let initialized = false;

/* ===================== FUNCTIONS ===================== */
export function init() {
  cleanup();

  for (let i = 0; i < PRACTICE_CONFIG.targetCount; i++) {
    const t = createPracticeTarget();
    randomizePosition(t.group);
    targetGroup.add(t.group);
    targets.push(t);
  }

  initialized = true;
}

export function cleanup() {
  targets.forEach(t => {
    targetGroup.remove(t.group);
    // Dispose geometry/material to free memory
    t.visual.geometry.dispose();
    t.visual.material.dispose();
    t.hitbox.geometry.dispose();
    t.hitbox.material.dispose();
  });
  targets = [];
  initialized = false;
}

export function update() {
  if (!initialized) return;
  // Rotate all balls
  targets.forEach(t => {
    t.visual.rotation.y += 0.01;
  });
}

export function checkHit(raycaster) {
  // Intersect against all hitboxes
  const hitboxes = targets.map(t => t.hitbox);
  return raycaster.intersectObjects(hitboxes);
}

export function onHit(intersection) {
  const hitObject = intersection.object;
  const targetIndex = targets.findIndex(t => t.hitbox === hitObject);
  
  if (targetIndex !== -1) {
    const t = targets[targetIndex];
    // Move to new random position
    randomizePosition(t.group);
  }
}

function randomizePosition(group) {
  const maxAttempts = 50;
  let attempts = 0;
  let validPosition = false;
  let x, y, z;
  
  while (!validPosition && attempts < maxAttempts) {
    attempts++;
    
    // Generate random position
    const dist = PRACTICE_CONFIG.distanceMin + Math.random() * (PRACTICE_CONFIG.distanceMax - PRACTICE_CONFIG.distanceMin);
    z = 10 - dist;
    x = (Math.random() - 0.5) * 2 * PRACTICE_CONFIG.rangeX;
    y = (Math.random() - 0.5) * 2 * PRACTICE_CONFIG.rangeY;
    
    // Check distance to all other balls
    validPosition = true;
    for (const t of targets) {
      if (t.group === group) continue; // Skip self
      
      const dx = t.group.position.x - x;
      const dy = t.group.position.y - y;
      const dz = t.group.position.z - z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      if (distance < PRACTICE_CONFIG.minSpacing) {
        validPosition = false;
        break;
      }
    }
  }
  
  group.position.set(x, y, z);
}

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
    respawnCallback(); // Panggil callback di ball.js untuk spawn visual
  }, 100);
}
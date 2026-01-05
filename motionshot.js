import { targetGroup, stats } from "./ball.js";

let time = 0;
let speed = 2.0;
let offsetY = 0;

// Dipanggil saat awal mulai
export function init() {
  time = 0;
  speed = 2.0;
  offsetY = 0;
  
  targetGroup.position.set(0, 0, 0);
  stats.spawned++;
}

// Dipanggil setiap frame (Looping)
export function update() {
  time += 0.01 * speed;
  
  // Gerakan Sinus (Kiri-Kanan) & Cosinus (Naik-Turun)
  targetGroup.position.x = Math.sin(time) * 4; 
  targetGroup.position.y = (Math.cos(time * 0.5) * 2) + offsetY;
}

// Dipanggil saat bola kena hit
export function onHit(respawnCallback) {
  speed += 0.05; // Tambah susah

  setTimeout(() => {
    // Reset parameter gerakan agar posisi loncat
    time = Math.random() * 100;
    offsetY = (Math.random() - 0.5) * 3;
    
    respawnCallback(); // Panggil callback di ball.js
  }, 100);
}
import { targetGroup, stats } from "./ball.js";

/* ===================== STATE ===================== */
let time = 0;
let speed = 2.0;
let offsetY = 0;

const START_Z = -3;        
const AMPLITUDE_X = 4;     
const AMPLITUDE_Y = 2;     
const TIME_STEP = 0.01;    

/* ===================== SAFETY FLAG ===================== */
let initialized = false;

/* ===================== DIPANGGIL SAAT AWAL MULAI ===================== */
export function init() {
  time = 0;
  speed = 2.0;
  offsetY = 0;

  targetGroup.position.set(0, 0, START_Z);
  targetGroup.visible = true;

  stats.spawned++;
  initialized = true;
}

/* ===================== DIPANGGIL SETIAP FRAME ===================== */
export function update() {
  // Safety guard: mencegah update sebelum init
  if (!initialized) return;

  time += TIME_STEP * speed;

  // Gerakan Sinus (Kiri-Kanan) & Cosinus (Naik-Turun)
  targetGroup.position.x = Math.sin(time) * AMPLITUDE_X;
  targetGroup.position.y = (Math.cos(time * 0.5) * AMPLITUDE_Y) + offsetY;
}

/* ===================== DIPANGGIL SAAT TARGET KENA HIT ===================== */
export function onHit(respawnCallback) {
  // Scaling difficulty
  speed += 0.05;

  // Sembunyikan sebentar biar terasa respawn
  targetGroup.visible = false;

  setTimeout(() => {
    // Loncat posisi supaya tidak mudah diprediksi
    time = Math.random() * 100;
    offsetY = (Math.random() - 0.5) * 3;

    targetGroup.visible = true;
    respawnCallback(); // Callback dari ball.js (reset timer spawn)
  }, 100);
}

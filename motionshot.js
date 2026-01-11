import { targetGroup, stats } from "./ball.js";

/* ===================== STATE ===================== */
let time = 0;
let speed = 2.0;

// Movement mode
let currentAxis = "horizontal"; // horizontal, vertical, diagonal_1, diagonal_2

const TIME_STEP = 0.02;
let currentZ = -3;

/* ===================== SAFETY FLAG ===================== */
let initialized = false;

function pickRandomAxis() {
  const types = ["horizontal", "vertical", "diagonal_1", "diagonal_2"];
  currentAxis = types[Math.floor(Math.random() * types.length)];
}



/* ===================== DIPANGGIL SAAT AWAL MULAI ===================== */
export function init(configOrDifficulty = "normal") {
  time = -Math.PI / 2; 
  
  // Default values
  // Custom Config
  let speedVal = 1.0;
  let distVal = 13;

  if (typeof configOrDifficulty === 'object') {
     speedVal = configOrDifficulty.speed;
     distVal = configOrDifficulty.distance;
  }

  speed = speedVal;
  
  // Camera is at Z=10. Target Z = CameraZ - Distance
  currentZ = 10 - distVal;  

  pickRandomAxis();
  updatePosition();

  targetGroup.visible = true;
  stats.spawned++;
  initialized = true;
}

/* ===================== DIPANGGIL SETIAP FRAME ===================== */
export function update() {
  if (!initialized) return;

  time += TIME_STEP * speed;
  updatePosition();
}

function updatePosition() {
  const sinVal = Math.sin(time);

  switch (currentAxis) {
    case "horizontal":
      targetGroup.position.set(sinVal * 8, 0, currentZ);
      break;
      
    case "vertical":
      targetGroup.position.set(0, sinVal * 5, currentZ);
      break;
      
    case "diagonal_1": 
      targetGroup.position.set(sinVal * 5, sinVal * 5, currentZ);
      break;
      
    case "diagonal_2": 
      targetGroup.position.set(sinVal * 5, -sinVal * 5, currentZ);
      break;
  }
}

/* ===================== DIPANGGIL SAAT TARGET KENA HIT ===================== */
export function onHit(respawnCallback) {
  // Speed constant based on difficulty
  targetGroup.visible = false;

  setTimeout(() => {
    pickRandomAxis();
    
    // Randomize start phase: either start from "Left/Bottom" (-PI/2) or "Right/Top" (PI/2)
    // so it doesn't always flow in the same initial direction
    time = Math.random() > 0.5 ? -Math.PI / 2 : Math.PI / 2;
    
    targetGroup.visible = true;
    respawnCallback();
  }, 100);
}

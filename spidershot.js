
import * as THREE from "three";
import { sphere, hitSphere, canvas, camera, raycaster, setUpdateCallback, lockPointer } from "./ball.js";

let gameStarted = false;
let score = 0;

// ========================
// RANDOM POSITION
// ========================
function randomizePosition() {
  const x = (Math.random() - 0.5) * 8;
  const y = (Math.random() - 0.5) * 4;
  const z = (Math.random() - 0.5) * 2;
  sphere.position.set(x, y, z);
}

// ========================
// START GAME
// ========================
window.startSpidershot = () => {
  gameStarted = true;
  score = 0;
  sphere.visible = true;
  randomizePosition();
  
  setUpdateCallback(null); 
  lockPointer(); // Lock cursor for FPS feel
  
  console.log("SPIDERSHOT STARTED");
};

// ========================
// CLICK DETECTION
// ========================
canvas.addEventListener("mousedown", (event) => {
  if (!gameStarted || !sphere.visible) return;
  // Use mousedown instead of pointerdown usually better with pointerlock

  // Raycast from camera center (0,0)
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  // Intersect against the larger hitSphere
  const intersects = raycaster.intersectObject(hitSphere);

  if (intersects.length > 0) {
    score++;
    console.log("SPIDERSHOT HIT! SCORE:", score);

    sphere.visible = false;
    hitSphere.visible = false; 

    setTimeout(() => {
      if (gameStarted) {
        randomizePosition();
        sphere.visible = true;
      }
    }, 100);
  }
});

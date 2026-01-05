
import * as THREE from "three";
import { sphere, hitSphere, canvas, camera, raycaster, setUpdateCallback, lockPointer } from "./ball.js";

let gameStarted = false;
let score = 0;
let time = 0;
let speed = 2.0;

// ========================
// MOTION LOGIC
// ========================
let offsetY = 0;

function updateMotion() {
  if (!gameStarted) return;
  
  time += 0.01 * speed;
  
  // Sine movement + Random Y offset
  sphere.position.x = Math.sin(time) * 4; 
  sphere.position.y = (Math.cos(time * 0.5) * 2) + offsetY;
}

// ========================
// START GAME
// ========================
window.startMotionshot = () => {
  gameStarted = true;
  score = 0;
  time = 0;
  offsetY = 0;
  sphere.visible = true;
  
  setUpdateCallback(updateMotion);
  lockPointer();
  
  console.log("MOTIONSHOT STARTED");
};

// ========================
// CLICK DETECTION
// ========================
canvas.addEventListener("mousedown", (event) => {
  if (!gameStarted || !sphere.visible) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObject(hitSphere);

  if (intersects.length > 0) {
    score++;
    console.log("MOTIONSHOT HIT! SCORE:", score);
    
    speed += 0.05; 
    sphere.visible = false;
    hitSphere.visible = false;

    // Randomize next state
    setTimeout(() => {
      if (gameStarted) {
        time = Math.random() * 100;
        offsetY = (Math.random() - 0.5) * 3; 

        sphere.visible = true;
      }
    }, 100);
  }
});

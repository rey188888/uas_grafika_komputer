
import { sphere, hitSphere, canvas, camera, raycaster, mouse, setUpdateCallback } from "./ball.js";

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
  // hitSphere position is synced in ball.js animate loop
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
  
  console.log("SPIDERSHOT STARTED");
};

// ========================
// CLICK DETECTION
// ========================
// Using pointerdown for better mobile/tablet support potentially, though click is fine.
canvas.addEventListener("pointerdown", (event) => {
  if (!gameStarted || !sphere.visible) return;

  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Intersect against the larger hitSphere
  const intersects = raycaster.intersectObject(hitSphere);

  if (intersects.length > 0) {
    score++;
    console.log("SPIDERSHOT HIT! SCORE:", score);

    sphere.visible = false;
    hitSphere.visible = false; // Immediately hide hitbox too

    setTimeout(() => {
      if (gameStarted) {
        randomizePosition();
        sphere.visible = true;
      }
    }, 100);
  }
});

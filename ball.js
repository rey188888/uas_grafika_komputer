import * as THREE from "three";
import * as SpiderLogic from "./spidershot.js";
import * as MotionLogic from "./motionshot.js";

const canvas = document.getElementById("webgl");
const scoreboardContainer = document.getElementById("scoreboard");
const crosshair = document.getElementById("crosshair");

// UI Hasil
const resultOverlay = document.getElementById("result-overlay");
const btnResultBack = document.getElementById("btn-result-back");
const resTime = document.getElementById("res-time");
const resSpawn = document.getElementById("res-spawn");
const resHit = document.getElementById("res-hit");
const resMiss = document.getElementById("res-miss");
const resScore = document.getElementById("res-score");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

/* RENDERER */
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

/* SCENE & CAMERA */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 10;

/* FPS CONTROLS */
let yaw = 0; let pitch = 0; const sensitivity = 0.002; let isLocked = false;

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
});

/* TEXTURES & ASSETS */
const loader = new THREE.TextureLoader();
const albedo = loader.load("./img/metal-roof-unity/metal-roof_albedo.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");
albedo.colorSpace = THREE.SRGBColorSpace;

/* TARGET GROUP */
export const targetGroup = new THREE.Group();
scene.add(targetGroup);

const geometryVisual = new THREE.SphereGeometry(0.1, 64, 64);
const materialVisual = new THREE.MeshStandardMaterial({
  color: 0x00ffff, normalMap: normal, roughnessMap: rough, aoMap: rough, displacementMap: height, roughness: 0.5, metalness: 0.1,
});
const sphereVisual = new THREE.Mesh(geometryVisual, materialVisual);
targetGroup.add(sphereVisual);

const geometryHitbox = new THREE.SphereGeometry(0.25, 16, 16); 
const materialHitbox = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0, depthWrite: false });
const sphereHitbox = new THREE.Mesh(geometryHitbox, materialHitbox);
targetGroup.add(sphereHitbox);

targetGroup.visible = false;

/* LIGHT */
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(2, 5, 5);
scene.add(light);

/* GAME STATE */
let gameStarted = false;
let gamePaused = false; // Status Pause
let currentMode = ""; 
let score = 0;
let timeLeft = 30;
const INITIAL_TIME = 30;
let timer = null;
let spawnTime = 0;

export let stats = { spawned: 0, hit: 0, shots: 0 };

/* FPS MOUSE LOOK */
document.addEventListener('mousemove', (event) => {
  if (!gameStarted || !isLocked || gamePaused) return; // Jangan gerak kalau pause
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;
  const maxPitch = Math.PI / 2 - 0.1;
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
});

// DETEKSI ESCAPE (POINTER UNLOCK)
document.addEventListener('pointerlockchange', () => {
  isLocked = (document.pointerLockElement === canvas);
  
  // Jika mouse lepas (ESC ditekan) DAN game sedang jalan -> Pause Game
  if (!isLocked && gameStarted && !gamePaused) {
      if (window.onGamePause) window.onGamePause();
  }
});

// Helper untuk HTML mengontrol status pause
window.setGamePaused = (status) => {
    gamePaused = status;
};

/* START GAME */
window.startGame = (mode) => {
  currentMode = mode;
  gameStarted = true;
  gamePaused = false;
  score = 0;
  timeLeft = INITIAL_TIME;
  stats = { spawned: 0, hit: 0, shots: 0 };

  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  
  yaw = 0; pitch = 0; camera.rotation.set(0, 0, 0);
  canvas.requestPointerLock();
  
  scoreboardContainer.style.display = "block";
  resultOverlay.style.display = "none";
  crosshair.style.display = "block";
  targetGroup.visible = true;

  if (currentMode === 'spidershot') SpiderLogic.init(); 
  else if (currentMode === 'motionshot') MotionLogic.init();
  
  spawnTime = performance.now();

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    // Hanya kurangi waktu jika TIDAK pause
    if (!gamePaused) {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }
  }, 1000);
};

function endGame() {
  gameStarted = false;
  targetGroup.visible = false;
  clearInterval(timer);
  document.exitPointerLock();
  
  crosshair.style.display = "none";
  scoreboardContainer.style.display = "none";

  const misses = stats.shots - stats.hit;
  const finalMiss = misses < 0 ? 0 : misses; 

  resTime.textContent = `${INITIAL_TIME}s`;
  resSpawn.textContent = stats.spawned;
  resHit.textContent = stats.hit;
  resMiss.textContent = finalMiss;
  resScore.textContent = score;

  resultOverlay.style.display = "flex";
}

btnResultBack.addEventListener("click", () => {
  resultOverlay.style.display = "none";
  const menuOverlay = document.getElementById("menu-overlay");
  if(menuOverlay) {
    menuOverlay.style.opacity = "1";
    menuOverlay.style.pointerEvents = "auto";
  }
});

/* SHOOTING LOGIC */
const raycaster = new THREE.Raycaster();
const centerScreen = new THREE.Vector2(0, 0);

canvas.addEventListener("mousedown", () => {
  // Cek gamePaused juga
  if (!gameStarted || !isLocked || gamePaused) return; 
  
  stats.shots++;
  if (!targetGroup.visible) return;

  raycaster.setFromCamera(centerScreen, camera);
  const hit = raycaster.intersectObject(sphereHitbox);

  if (hit.length) {
    stats.hit++;
    const rt = performance.now() - spawnTime;
    
    const maxScore = 100; const minScore = 10;
    const perfectTime = 400; const slowTime = 2000;   
    let point = 0;
    if (rt <= perfectTime) point = maxScore;
    else if (rt >= slowTime) point = minScore;
    else {
      const percentage = 1 - ((rt - perfectTime) / (slowTime - perfectTime));
      point = Math.round(minScore + (percentage * (maxScore - minScore)));
    }
    score += point;
    scoreEl.textContent = score;

    targetGroup.visible = false;

    const respawnCallback = () => {
      if (!gameStarted) return;
      spawnTime = performance.now();
      targetGroup.visible = true;
      stats.spawned++;
    };

    if (currentMode === 'spidershot') SpiderLogic.onHit(respawnCallback);
    else if (currentMode === 'motionshot') MotionLogic.onHit(respawnCallback);
  }
});

/* ANIMATE LOOP */
function animate() {
  requestAnimationFrame(animate);
  
  // Hentikan update visual/gerakan jika Pause
  if (gamePaused) return;

  sphereVisual.rotation.y += 0.004;

  if (gameStarted) {
    if (currentMode === 'motionshot') {
      MotionLogic.update();
    }
  }

  renderer.render(scene, camera);
}
animate();
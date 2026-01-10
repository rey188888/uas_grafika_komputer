import * as THREE from "three";
import * as SpiderLogic from "./spidershot.js";
import * as MotionLogic from "./motionshot.js";
import * as PracticeLogic from "./practiceshot.js";
import * as Environment from "./background.js";

/* ===================== DOM ELEMENTS ===================== */
const canvas = document.getElementById("webgl");
const scoreboardContainer = document.getElementById("scoreboard");
const crosshair = document.getElementById("crosshair");
const resultOverlay = document.getElementById("result-overlay");
const btnResultBack = document.getElementById("btn-result-back");

// Pause overlay elements
const pauseOverlay = document.getElementById("pause-overlay");
const btnResume = document.getElementById("btn-resume");
const btnRestart = document.getElementById("btn-restart");
const btnExit = document.getElementById("btn-exit");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accuracyEl = document.getElementById("accuracy");
const resAccuracy = document.getElementById("res-accuracy");
const accuracyBar = document.getElementById("accuracy-bar");

const resTime = document.getElementById("res-time");
const resHit = document.getElementById("res-hit");
const resMiss = document.getElementById("res-miss");
const resScore = document.getElementById("res-score");

const comboEl = document.createElement("div");
comboEl.style.position = "absolute";
comboEl.style.top = "70px";
comboEl.style.left = "50%";
comboEl.style.transform = "translateX(-50%)";
comboEl.style.fontSize = "28px";
comboEl.style.fontWeight = "bold";
comboEl.style.color = "#ffcc00";
comboEl.style.textShadow = "0 0 10px #ff9900";
comboEl.style.display = "none";
comboEl.textContent = "";
comboEl.style.zIndex = "9999";
document.body.appendChild(comboEl);

/* ===================== GLOBAL STATE ===================== */
let gameStarted = false;
let gamePaused = false;
let currentMode = "";
let currentDifficulty = "normal";
let score = 0;
let combo = 0;
let timeLeft = 30;
let INITIAL_TIME = 30;
let timer = null;
let spawnTime = 0;

export let stats = { spawned: 0, hit: 0, shots: 0 };

let yaw = 0; 
let pitch = 0;
let isLocked = false;
const sensitivity = 0.002;

const DIFFICULTY_CONFIG = {
  easy:   { scale: 1.2, scoreMultiplier: 0.7, missPenalty: 10, cameraZ: 15, aimCone: 3.5, hitboxScale: 1.4 },
  normal: { scale: 1.0, scoreMultiplier: 1.0, missPenalty: 20, cameraZ: 22, aimCone: 2.5, hitboxScale: 1.0 },
  hard:   { scale: 0.5, scoreMultiplier: 1.5, missPenalty: 40, cameraZ: 28, aimCone: 1.2, hitboxScale: 0.8 }
};

/* ===================== SETUP SCENE ===================== */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 10;

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

// Initialize Environment
Environment.init3DEnvironment(scene);

const raycaster = new THREE.Raycaster();
let currentAimCone = THREE.MathUtils.degToRad(2.5); // Dynamic aim tolerance
const AIM_MAX_DISTANCE = 50;

/* ===================== TARGET ASSETS ===================== */
const loader = new THREE.TextureLoader();
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");

// Visual for Main Ball
const sphereVisual = new THREE.Mesh(
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

// Hitbox for Main Ball (larger than visual for better edge detection)
const geometryHitbox = new THREE.SphereGeometry(0.35, 16, 16);
const sphereHitbox = new THREE.Mesh(
  geometryHitbox,
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
);

export const targetGroup = new THREE.Group();
targetGroup.add(sphereVisual, sphereHitbox);
targetGroup.visible = false;
scene.add(targetGroup);

/* ===================== GAME FUNCTIONS ===================== */
window.setDifficulty = (d) => currentDifficulty = d;

window.startGame = (mode, customTime = 30, difficultyOrConfig = "normal") => {
  INITIAL_TIME = customTime;
  currentMode = mode;
  
  // Scoring default params
  let diffParams = DIFFICULTY_CONFIG["normal"]; 

  if (typeof difficultyOrConfig === 'string') {
    currentDifficulty = difficultyOrConfig;
    diffParams = DIFFICULTY_CONFIG[currentDifficulty];
  } else {
    // Custom config mode (MotionShot) or Practice
    currentDifficulty = "normal"; 
  }

  // RESET STATE
  gameStarted = true;
  gamePaused = false;
  score = 0;
  combo = 0;
  comboEl.style.display = "none";
  timeLeft = INITIAL_TIME;
  stats = { spawned: 0, hit: 0, shots: 0 };
  
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  updateAccuracy(); 

  // RESET CAMERA
  yaw = 0; pitch = 0;
  camera.rotation.set(0, 0, 0);
  canvas.requestPointerLock();

  // RESET UI
  scoreboardContainer.style.display = "block";
  resultOverlay.style.display = "none";
  crosshair.style.display = "block";

  // RESET TARGETS
  targetGroup.clear(); // Remove children
  PracticeLogic.cleanup();

  if (mode === "practice") {
    PracticeLogic.init();
    targetGroup.visible = true; // Setup done by PracticeLogic adding to targetGroup? 
    // Wait, createTarget returns group, need to add to scene or targetGroup
    // practiceshot.js adds to targetGroup? YES.
  } else {
    // Standard Modes
    targetGroup.add(sphereVisual, sphereHitbox);
    
    sphereVisual.scale.setScalar(diffParams.scale);
    sphereHitbox.scale.setScalar(diffParams.scale * diffParams.hitboxScale);

    if (mode === "spidershot") {
      // Apply camera distance and aim settings based on difficulty
      camera.position.z = diffParams.cameraZ;
      currentAimCone = THREE.MathUtils.degToRad(diffParams.aimCone);
      SpiderLogic.init();
    } else {
      MotionLogic.init(difficultyOrConfig);
    }
  }

  targetGroup.visible = true;
  spawnTime = performance.now();

  clearInterval(timer);
  if (mode !== "practice") {
    timer = setInterval(() => {
      if (!gamePaused && --timeLeft <= 0) endGame();
      timeEl.textContent = timeLeft;
    }, 1000);
  } else {
    timeEl.textContent = "∞"; // Infinite
  }
};

function endGame() {
  gameStarted = false;
  combo = 0;
  comboEl.style.display = "none";

  targetGroup.visible = false;
  clearInterval(timer);
  document.exitPointerLock();

  scoreboardContainer.style.display = "none";
  crosshair.style.display = "none";

  const miss = Math.max(stats.shots - stats.hit, 0);
  resTime.textContent = (currentMode === 'practice') ? "∞" : `${INITIAL_TIME}s`;
  resHit.textContent = stats.hit;
  resMiss.textContent = miss;
  resScore.textContent = score;
  updateAccuracy();

  resultOverlay.style.display = "flex";
}

window.onGamePause = (isPaused) => {
   // UI handling is in index.html, this is just for internal state if needed
};
window.setGamePaused = (v) => gamePaused = v;

function updateAccuracy() {
  if (!accuracyEl || !resAccuracy) return;
  const acc = stats.shots === 0 ? 100 : Math.round((stats.hit / stats.shots) * 100);
  accuracyEl.textContent = `${acc}%`;
  resAccuracy.textContent = `${acc}%`;
  
  if (accuracyBar) {
    accuracyBar.style.width = `${acc}%`;
    if (acc >= 80) {
        accuracyBar.style.background = "linear-gradient(90deg, #00ff99, #00ffaa)";
        accuracyEl.style.color = "#00ffaa";
    } else if (acc >= 50) {
        accuracyBar.style.background = "linear-gradient(90deg, #ffd000, #ffaa00)";
        accuracyEl.style.color = "#ffaa00";
    } else {
        accuracyBar.style.background = "linear-gradient(90deg, #ff5555, #ff2222)";
        accuracyEl.style.color = "#ff5555";
    }
  }
}

/* ===================== EVENTS ===================== */
window.addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.updateProjectionMatrix();
});

document.addEventListener("mousemove", e => {
  if (!gameStarted || !isLocked || gamePaused) return;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI/2+0.1, Math.PI/2-0.1);
  camera.rotation.set(pitch, yaw, 0, "YXZ");
});

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  isLocked = locked;
  
  // When pointer lock is lost during active game, show pause
  if (!locked && gameStarted && !gamePaused) {
    showPauseMenu();
  }
});

/* ===================== PAUSE SYSTEM ===================== */
let waitingForResume = false;
const clickContinueOverlay = document.getElementById("click-continue-overlay");

function showPauseMenu() {
  if (!gameStarted) return;
  gamePaused = true;
  waitingForResume = false;
  if (clickContinueOverlay) clickContinueOverlay.style.display = "none";
  if (pauseOverlay) pauseOverlay.style.display = "flex";
}

function prepareResume() {
  // Hide pause overlay, show click-to-continue screen
  if (pauseOverlay) pauseOverlay.style.display = "none";
  if (clickContinueOverlay) clickContinueOverlay.style.display = "flex";
  waitingForResume = true;
}

function completeResume() {
  if (!waitingForResume) return;
  waitingForResume = false;
  gamePaused = false;
  if (clickContinueOverlay) clickContinueOverlay.style.display = "none";
  if (crosshair) crosshair.style.display = "block";
  canvas.requestPointerLock();
}

// Click on overlay or canvas to complete resume
if (clickContinueOverlay) {
  clickContinueOverlay.addEventListener("click", completeResume);
}
canvas.addEventListener("click", () => {
  if (waitingForResume) {
    completeResume();
  }
});

// Resume button starts the resume process
if (btnResume) {
  btnResume.onclick = function(e) {
    e.stopPropagation();
    prepareResume();
  };
}

// Restart with countdown
if (btnRestart) btnRestart.addEventListener("click", () => {
  gamePaused = false;
  if (pauseOverlay) pauseOverlay.style.display = "none";
  
  // Get countdown element
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) {
    // Fallback: just restart immediately
    window.startGame(currentMode, INITIAL_TIME, currentDifficulty);
    return;
  }
  
  // Show countdown
  let t = 3;
  countdownEl.textContent = t;
  countdownEl.style.display = "block";
  
  const interval = setInterval(() => {
    t--;
    if (t > 0) {
      countdownEl.textContent = t;
    } else {
      clearInterval(interval);
      countdownEl.style.display = "none";
      window.startGame(currentMode, INITIAL_TIME, currentDifficulty);
    }
  }, 1000);
});

if (btnExit) btnExit.addEventListener("click", () => location.reload());

// Expose for external use
window.setGamePaused = (v) => gamePaused = v;

btnResultBack.onclick = () => {
  resultOverlay.style.display = "none";
  const menu = document.getElementById("menu-overlay");
  if (menu) {
    menu.style.display = "flex"; // Use flex for proper centering
    menu.style.opacity = "1";
    menu.style.pointerEvents = "auto";
  }
  PracticeLogic.cleanup();
};

/* ===================== SHOOTING LOGIC ===================== */
function playHitExplosion(targetVisual = null) {
  // Use passed visual or default global one
  SpiderLogic.playHitExplosion(scene, targetVisual || sphereVisual, () => {});
}

canvas.addEventListener("mousedown", () => {
  if (!gameStarted || !isLocked || gamePaused) return;
  stats.shots++;

  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  let hitResults = [];

  if (currentMode === "practice") {
    // Use camera direction ray for practice mode (same as look direction)
    raycaster.set(camera.position, camDir);
    hitResults = PracticeLogic.checkHit(raycaster);
    
  } else {
    // Standard Mode Aim Assist
    const targetPos = new THREE.Vector3();
    sphereHitbox.getWorldPosition(targetPos);
    const toTarget = targetPos.clone().sub(camera.position);
    const distance = toTarget.length();
    toTarget.normalize();
    
    let shootDir = camDir.angleTo(toTarget) <= currentAimCone && distance <= AIM_MAX_DISTANCE
       ? toTarget : camDir;
       
    raycaster.set(camera.position, shootDir);
    hitResults = raycaster.intersectObject(sphereHitbox);
  }

  if (hitResults.length > 0) {
    stats.hit++;
    combo++;
    
    // HIT VISUALS & LOGIC
    const hitObj = hitResults[0];
    
    if (currentMode === "practice") {
       // Get the hit position BEFORE moving the ball
       const explosionPos = new THREE.Vector3();
       hitObj.object.getWorldPosition(explosionPos);
       
       // Move ball to new position
       PracticeLogic.onHit(hitObj);
       
       // Play explosion at the ORIGINAL position
       SpiderLogic.playHitExplosionAt(scene, explosionPos, () => {});
    } else {
       playHitExplosion(sphereVisual); // Standard
       const respawn = () => {
          if (!gameStarted) return;
          spawnTime = performance.now();
          targetGroup.visible = true;
       };
       currentMode === "spidershot" 
         ? SpiderLogic.onHit(respawn) 
         : MotionLogic.onHit(respawn);
    }

    // SCORING
    const timeToHit = performance.now() - spawnTime; // Relevant for single target
    // For practice, spawnTime is tricky per ball, so ignore time score for now?
    
    let baseScore = 100;
    if (currentMode !== 'practice') {
       const rt = timeToHit;
       baseScore = THREE.MathUtils.clamp(100 - ((rt - 400) / 1600) * 90, 10, 100);
    }
    
    let comboMul = (combo >= 10) ? 1.5 : (combo >= 5) ? 1.25 : (combo >= 2) ? 1.1 : 1;
    let diffMul = (currentMode === 'practice') ? 1.0 : DIFFICULTY_CONFIG[currentDifficulty].scoreMultiplier;
    
    score += Math.round(baseScore * diffMul * comboMul);
    scoreEl.textContent = score;

    comboEl.textContent = `COMBO x${combo}`;
    comboEl.style.display = "block";
    
    updateAccuracy();

  } else {
    // MISS
    combo = 0;
    comboEl.style.display = "none";
    if (currentMode !== 'practice') {
       score = Math.max(0, score - DIFFICULTY_CONFIG[currentDifficulty].missPenalty);
    }
    scoreEl.textContent = score;
    updateAccuracy();
  }
});

/* ===================== ANIMATION LOOP ===================== */
function animate() {
  requestAnimationFrame(animate);
  if (gamePaused) return;

  if (gameStarted) {
     if (currentMode === "motionshot") MotionLogic.update();
     if (currentMode === "practice") PracticeLogic.update();
     if (currentMode !== "practice") sphereVisual.rotation.y += 0.004;
  }

  renderer.render(scene, camera);
}
animate();
import * as THREE from "three";
import * as SpiderLogic from "./spidershot.js";
import * as MotionLogic from "./motionshot.js";

/* ===================== DOM ===================== */
const canvas = document.getElementById("webgl");
const scoreboardContainer = document.getElementById("scoreboard");
const crosshair = document.getElementById("crosshair");

const resultOverlay = document.getElementById("result-overlay");
const btnResultBack = document.getElementById("btn-result-back");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

const accuracyEl = document.getElementById("accuracy");
const resAccuracy = document.getElementById("res-accuracy");
const accuracyBar = document.getElementById("accuracy-bar");

const resTime = document.getElementById("res-time");
const resHit = document.getElementById("res-hit");
const resMiss = document.getElementById("res-miss");
const resScore = document.getElementById("res-score");

/* ===================== COMBO UI  ===================== */
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

/* ===================== DIFFICULTY ===================== */
let currentDifficulty = "normal";

const DIFFICULTY_CONFIG = {
  easy:   { scale: 1.2, scoreMultiplier: 0.7, missPenalty: 10 },
  normal: { scale: 1.0, scoreMultiplier: 1.0, missPenalty: 20 },
  hard:   { scale: 0.5, scoreMultiplier: 1.5, missPenalty: 40 }
};

window.setDifficulty = d => currentDifficulty = d;

/* ===================== RENDERER ===================== */
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

/* ===================== SCENE & CAMERA ===================== */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 10;

/* ===================== STATE ===================== */
let gameStarted = false;
let gamePaused = false;
let currentMode = "";
let score = 0;
let timeLeft = 30;
let INITIAL_TIME = 30;
let timer = null;
let spawnTime = 0;

/* ===================== COMBO STATE (TAMBAHAN) ===================== */
let combo = 0;

function updateAccuracy() {
  if (!accuracyEl || !resAccuracy) return;
  const acc = stats.shots === 0 ? 100 : Math.round((stats.hit / stats.shots) * 100);
  accuracyEl.textContent = `${acc}%`;
  resAccuracy.textContent = `${acc}%`;
}

export let stats = { spawned: 0, hit: 0, shots: 0 };

/* ===================== CONTROLS ===================== */
let yaw = 0, pitch = 0;
const sensitivity = 0.002;
let isLocked = false;

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
  isLocked = document.pointerLockElement === canvas;
  if (!isLocked && gameStarted && !gamePaused && window.onGamePause) window.onGamePause();
});

window.setGamePaused = v => gamePaused = v;

/* ===================== TEXTURE ===================== */
const loader = new THREE.TextureLoader();
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");

/* ===================== TARGET ===================== */
export const targetGroup = new THREE.Group();
scene.add(targetGroup);

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

const geometryHitbox = new THREE.SphereGeometry(0.25, 16, 16);
const sphereHitbox = new THREE.Mesh(
  geometryHitbox,
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
);

targetGroup.add(sphereVisual, sphereHitbox);
targetGroup.visible = false;

/* ===================== LIGHT ===================== */
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(2, 5, 5);
scene.add(light);

/* ===================== AIM ===================== */
const AIM_CONE_ANGLE = THREE.MathUtils.degToRad(3.5);
const AIM_MAX_DISTANCE = 15;
const raycaster = new THREE.Raycaster();

/* ===================== START GAME ===================== */
window.startGame = (mode, customTime = 30, difficulty = "normal") => {
  INITIAL_TIME = customTime;
  currentMode = mode;
  currentDifficulty = difficulty;

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

  yaw = pitch = 0;
  camera.rotation.set(0, 0, 0);
  canvas.requestPointerLock();

  scoreboardContainer.style.display = "block";
  resultOverlay.style.display = "none";
  crosshair.style.display = "block";
  targetGroup.visible = true;

  const diff = DIFFICULTY_CONFIG[currentDifficulty];
  sphereVisual.scale.setScalar(diff.scale);
  sphereHitbox.scale.setScalar(diff.scale);

  (mode === "spidershot") ? SpiderLogic.init() : MotionLogic.init();
  spawnTime = performance.now();

  clearInterval(timer);
  timer = setInterval(() => {
    if (!gamePaused && --timeLeft <= 0) endGame();
    timeEl.textContent = timeLeft;
  }, 1000);
};

/* ===================== END GAME ===================== */
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
  resTime.textContent = `${INITIAL_TIME}s`;
  resHit.textContent = stats.hit;
  resMiss.textContent = miss;
  resScore.textContent = score;
  updateAccuracy();

  resultOverlay.style.display = "flex";
}

btnResultBack.onclick = () => {
  resultOverlay.style.display = "none";
  const menu = document.getElementById("menu-overlay");
  if (menu) { menu.style.opacity = 1; menu.style.pointerEvents = "auto"; }
};

/* ===================== HIT EXPLOSION ===================== */
function playHitExplosion(onComplete) {
  if (currentMode === "spidershot") {
    SpiderLogic.playHitExplosion(scene, sphereVisual, onComplete);
  } else {
    // fallback: tetap jalan seperti biasa (future safe)
    SpiderLogic.playHitExplosion(scene, sphereVisual, onComplete);
  }
}

/* ===================== SHOOT ===================== */
canvas.addEventListener("mousedown", () => {
  if (!gameStarted || !isLocked || gamePaused) return;
  stats.shots++;

  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  const targetPos = new THREE.Vector3();
  sphereHitbox.getWorldPosition(targetPos);

  const toTarget = targetPos.clone().sub(camera.position);
  const distance = toTarget.length();
  toTarget.normalize();

  let shootDir = camDir.angleTo(toTarget) <= AIM_CONE_ANGLE && distance <= AIM_MAX_DISTANCE
    ? toTarget
    : camDir;

  raycaster.set(camera.position, shootDir);
  const hit = raycaster.intersectObject(sphereHitbox);

  if (hit.length) {
    stats.hit++;
    combo++;

    playHitExplosion();

    const rt = performance.now() - spawnTime;
    const base = THREE.MathUtils.clamp(
      100 - ((rt - 400) / 1600) * 90,
      10, 100
    );

    const center = new THREE.Vector3();
    sphereHitbox.getWorldPosition(center);
    const accRatio = Math.min(hit[0].point.distanceTo(center) / geometryHitbox.parameters.radius, 1);
    const accMul = THREE.MathUtils.lerp(1.3, 0.7, accRatio);

    const diffMul = DIFFICULTY_CONFIG[currentDifficulty].scoreMultiplier;

    let comboMul = 1;
    if (combo >= 10) comboMul = 1.5;
    else if (combo >= 5) comboMul = 1.25;
    else if (combo >= 2) comboMul = 1.1;

    score += Math.round(base * accMul * diffMul * comboMul);
    scoreEl.textContent = score;

    comboEl.textContent = `COMBO x${combo}`;
    comboEl.style.display = "block";

    updateAccuracy();

    const respawn = () => {
      if (!gameStarted) return;
      spawnTime = performance.now();
      targetGroup.visible = true;
    };

    currentMode === "spidershot"
      ? SpiderLogic.onHit(respawn)
      : MotionLogic.onHit(respawn);

  } else {
    combo = 0;
    comboEl.style.display = "none";

    score = Math.max(0, score - DIFFICULTY_CONFIG[currentDifficulty].missPenalty);
    scoreEl.textContent = score;

    updateAccuracy();
  }
  
  if (accuracyBar && accuracyEl) {
  const acc = Math.round((stats.hit / Math.max(stats.shots, 1)) * 100);

  accuracyEl.textContent = `${acc}%`;
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

});

/* ===================== LOOP ===================== */
function animate() {
  requestAnimationFrame(animate);
  if (gamePaused) return;

  sphereVisual.rotation.y += 0.004;
  if (gameStarted && currentMode === "motionshot") MotionLogic.update();;
  renderer.render(scene, camera);
}
animate();
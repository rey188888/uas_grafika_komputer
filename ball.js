import * as THREE from "three";

const canvas = document.getElementById("webgl");

// ========================
// RENDERER
// ========================
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ========================
// SCENE & CAMERA
// ========================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 10;

// ========================
// RESIZE
// ========================
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ========================
// TEXTURE (ASLI - TIDAK DIUBAH)
// ========================
const loader = new THREE.TextureLoader();

const albedo = loader.load("./img/metal-roof-unity/metal-roof_albedo.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");

albedo.colorSpace = THREE.SRGBColorSpace;

// ========================
// GEOMETRY & MATERIAL (ASLI)
// ========================
const geometry = new THREE.SphereGeometry(0.1, 128, 128);
geometry.setAttribute(
  "uv2",
  new THREE.BufferAttribute(geometry.attributes.uv.array, 2)
);

const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  normalMap: normal,
  roughnessMap: rough,
  aoMap: rough,
  displacementMap: height,
  roughness: 0.5,
  metalness: 0.1,
});

// ========================
// TARGET BALL
// ========================
const sphere = new THREE.Mesh(geometry, material);
sphere.visible = false; // ⛔ HIDDEN SAMPAI COUNTDOWN SELESAI
scene.add(sphere);

// ========================
// LIGHT (ASLI)
// ========================
scene.add(new THREE.AmbientLight(0xffffff, 1));

const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(2, 5, 5);
scene.add(dirLight);

// ========================
// GAME STATE
// ========================
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
// START GAME (DIPANGGIL DARI INDEX)
// ========================
window.startSpidershot = () => {
  gameStarted = true;
  score = 0;
  sphere.visible = true;
  randomizePosition();
  console.log("SPIDERSHOT STARTED");
};

// ========================
// CLICK DETECTION 
// ========================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener("click", (event) => {
  if (!gameStarted || !sphere.visible) return;

  const rect = canvas.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(sphere);

  if (intersects.length > 0) {
    score++;
    console.log("HIT! SCORE:", score);

    sphere.visible = false;

    setTimeout(() => {
      randomizePosition();
      sphere.visible = true;
    }, 100);
  }
});

// ========================
// LOOP
// ========================
function animate() {
  sphere.rotation.y += 0.004; // ROTASI ASLI
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

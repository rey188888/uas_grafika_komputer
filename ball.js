
import * as THREE from "three";

export const canvas = document.getElementById("webgl");

// ========================
// RENDERER
// ========================
export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ========================
// SCENE & CAMERA
// ========================
export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(
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
// TEXTURE
// ========================
const loader = new THREE.TextureLoader();
// Adjust paths if necessary, assuming relative current dir
const albedo = loader.load("./img/metal-roof-unity/metal-roof_albedo.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");
albedo.colorSpace = THREE.SRGBColorSpace;

// ========================
// GEOMETRY & MATERIAL
// ========================
const geometry = new THREE.SphereGeometry(0.1, 128, 128); // Visual size
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
// TARGET BALL (VISUAL)
// ========================
export const sphere = new THREE.Mesh(geometry, material);
sphere.visible = false;
scene.add(sphere);

// ========================
// HITBOX (INVISIBLE, LARGER)
// ========================
// Making it 3x larger for easier clicking
const hitGeometry = new THREE.SphereGeometry(0.5, 32, 32); 
const hitMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000,
    transparent: true,
    opacity: 0, // Invisible
    depthWrite: false
});
export const hitSphere = new THREE.Mesh(hitGeometry, hitMaterial);
hitSphere.visible = false; // logic will toggle this along with sphere
scene.add(hitSphere);


// ========================
// LIGHT
// ========================
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(2, 5, 5);
scene.add(dirLight);

// ========================
// RAYCASTER (Shared)
// ========================
export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

// ========================
// LOOP SYSTEM
// ========================
let updateCallback = null;

export function setUpdateCallback(callback) {
  updateCallback = callback;
}

function animate() {
  sphere.rotation.y += 0.004; 
  
  // Sync hitbox position
  hitSphere.position.copy(sphere.position);
  hitSphere.visible = sphere.visible;

  if (updateCallback) {
    updateCallback();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();


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
// Initial position
camera.position.z = 10;

// FPS CAMERA CONTROLS
let yaw = 0;
let pitch = 0;
const sensitivity = 0.002;
let isLocked = false;

document.addEventListener('mousemove', (event) => {
  if (isLocked) {
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;
    
    // Clamp pitch (limit looking up/down)
    const maxPitch = Math.PI / 2 - 0.1;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }
});

// Helper to start locking pointer
export function lockPointer() {
    canvas.requestPointerLock();
}

export function unlockPointer() {
    document.exitPointerLock();
}

// Track pointer lock state
document.addEventListener('pointerlockchange', () => {
    isLocked = (document.pointerLockElement === canvas);
    
    // If user presses ESC or alt-tab, browser unlocks pointer.
    // Use this to trigger pause menu.
    if (!isLocked && window.onGamePause) {
        window.onGamePause();
    }
});

export function resetCamera() {
    yaw = 0;
    pitch = 0;
    camera.rotation.set(0, 0, 0);
}

// Helper to force hide ball (for restart sequence)
export function setBallVisibility(visible) {
    sphere.visible = visible;
    hitSphere.visible = visible;
}

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
const albedo = loader.load("./img/metal-roof-unity/metal-roof_albedo.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");
albedo.colorSpace = THREE.SRGBColorSpace;

// ========================
// GEOMETRY & MATERIAL
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
// TARGET BALL (VISUAL)
// ========================
export const sphere = new THREE.Mesh(geometry, material);
sphere.visible = false;
scene.add(sphere);

// ========================
// HITBOX (INVISIBLE, LARGER)
// ========================
const hitGeometry = new THREE.SphereGeometry(0.5, 32, 32); 
const hitMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000,
    transparent: true,
    opacity: 0, 
    depthWrite: false
});
export const hitSphere = new THREE.Mesh(hitGeometry, hitMaterial);
hitSphere.visible = false;
scene.add(hitSphere);


// ========================
// LIGHT
// ========================
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(2, 5, 5);
scene.add(dirLight);

// ========================
// RAYCASTER
// ========================
export const raycaster = new THREE.Raycaster();

// ========================
// LOOP SYSTEM
// ========================
let updateCallback = null;

export function setUpdateCallback(callback) {
  updateCallback = callback;
}

function animate() {
  sphere.rotation.y += 0.004; 
  
  hitSphere.position.copy(sphere.position);
  hitSphere.visible = sphere.visible;

  if (updateCallback) {
    updateCallback();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

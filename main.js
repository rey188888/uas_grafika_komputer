import * as THREE from "three";
const canvas = document.getElementById("webgl");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55,window.innerWidth / window.innerHeight,0.1,100);
camera.position.z = 6;

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const loader = new THREE.TextureLoader();

const albedo = loader.load("./img/metal-roof-unity/metal-roof_albedo.png");
const rough = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
const normal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
const height = loader.load("./img/metal-roof-unity/metal-roof_height.png");

albedo.colorSpace = THREE.SRGBColorSpace;

const geometry = new THREE.SphereGeometry(0.4, 128, 128);
geometry.setAttribute("uv2",new THREE.BufferAttribute(geometry.attributes.uv.array, 2));

const material = new THREE.MeshStandardMaterial({
  map: albedo,
  normalMap: normal,
  roughnessMap: rough,
  aoMap: rough,
  displacementMap: height,
  roughness: 0.9,
  metalness: 0.2,
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

function draw() {
  sphere.rotation.y += 0.004;

  renderer.render(scene, camera);
  requestAnimationFrame(draw);
}

draw();
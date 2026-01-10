import * as THREE from "three";

export function init3DEnvironment(scene) {
  /* ===================== TEXTURES ===================== */
  const loader = new THREE.TextureLoader();
  
  // Load metal textures for walls (futuristic look)
  const wallNormal = loader.load("./img/metal-roof-unity/metal-roof_normal-ogl.png");
  const wallAO = loader.load("./img/metal-roof-unity/metal-roof_ao.png");
  
  // Set texture repeat for tiling
  [wallNormal, wallAO].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
  });

  /* ===================== ROOM (ENVIRONMENT) ===================== */
  const roomGeometry = new THREE.BoxGeometry(60, 40, 100); 
  const roomMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e, // Dark blue-ish
    normalMap: wallNormal,
    aoMap: wallAO,
    roughness: 0.7,
    metalness: 0.5,
    side: THREE.BackSide 
  });
  const room = new THREE.Mesh(roomGeometry, roomMaterial);
  room.position.set(0, 0, 0); 
  scene.add(room);

  // Grid on floor - cyan glow
  const gridHelper = new THREE.GridHelper(60, 60, 0x00ffff, 0x0a2a2a);
  gridHelper.position.y = -20;
  scene.add(gridHelper);

  /* ===================== LIGHT ===================== */
  const ambientLight = new THREE.HemisphereLight(0x4444ff, 0x111122, 1.2);
  scene.add(ambientLight);

  const mainLight = new THREE.PointLight(0xffffff, 400, 0);
  mainLight.position.set(0, 20, 10);
  scene.add(mainLight);

  // Cyan accent light from behind
  const backLight = new THREE.PointLight(0x00ffff, 250, 0);
  backLight.position.set(0, 5, -40);
  scene.add(backLight);

  // Warm front light
  const frontLight = new THREE.SpotLight(0xffaa44, 300, 0);
  frontLight.position.set(0, 15, 40);
  frontLight.target.position.set(0, 0, 0);
  scene.add(frontLight);
  scene.add(frontLight.target);
}
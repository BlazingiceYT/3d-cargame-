// ═══════════════════════════════════════════════
// BLAZINGICE CITY RACER — game.js
// ═══════════════════════════════════════════════

// ── RENDERER ──
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.physicallyCorrectLights = true;

// ── SCENE ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a); // dark night sky
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);

// ── CAMERA ──
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
cam.position.set(0, 5, -12);
cam.lookAt(0, 0, 0);

// ── LIGHTS ──
scene.add(new THREE.AmbientLight(0x223355, 1.2)); // cool blue night ambient

const sun = new THREE.DirectionalLight(0xfffbe8, 2.0);
sun.position.set(100, 200, 100);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left   = -300;
sun.shadow.camera.right  =  300;
sun.shadow.camera.top    =  300;
sun.shadow.camera.bottom = -300;
sun.shadow.camera.far    =  600;
sun.shadow.bias = -0.0003;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
fill.position.set(-80, 60, -80);
scene.add(fill);

// ── MATERIALS ──
const matRoad  = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.95, metalness: 0.0 });
const matLine  = new THREE.MeshBasicMaterial({ color: 0xffffff });
const matYLine = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const matGrass = new THREE.MeshStandardMaterial({ color: 0x3d6e35, roughness: 0.95 });
const matDirt  = new THREE.MeshStandardMaterial({ color: 0x7a5c30, roughness: 0.98 });
const matPave  = new THREE.MeshStandardMaterial({ color: 0x888890, roughness: 0.85 });

// ── BUMPY GRASS TERRAIN with vertex colors ──
const TERRAIN_SEGS = 100;
const terrainGeo = new THREE.PlaneGeometry(1400, 1400, TERRAIN_SEGS, TERRAIN_SEGS);
const tPos = terrainGeo.attributes.position;

// Height function — deterministic so we can sample it at runtime
function terrainHeight(wx, wz) {
  const distFromCenter = Math.sqrt(wx*wx + wz*wz);
  const bumpStrength = Math.min(1, Math.max(0, (distFromCenter - 130) / 100));
  return (Math.sin(wx*0.15)*Math.cos(wz*0.18) + Math.sin(wx*0.3+wz*0.2)*0.5) * 2.5 * bumpStrength;
}

// Apply heights to terrain mesh
for (let i = 0; i < tPos.count; i++) {
  const wx = tPos.getX(i);
  const wz = tPos.getY(i); // before rotation Y=Z
  tPos.setZ(i, terrainHeight(wx, wz));
}
terrainGeo.computeVertexNormals();

// Vertex colors — darker in valleys, lighter on peaks
const colors = new Float32Array(tPos.count * 3);
for (let i = 0; i < tPos.count; i++) {
  const h = tPos.getZ(i);
  const t = (h + 2.5) / 5.0; // 0..1
  // Mix dark green valley → bright green peak
  colors[i*3]   = 0.15 + t * 0.12;
  colors[i*3+1] = 0.30 + t * 0.25;
  colors[i*3+2] = 0.10 + t * 0.08;
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const ground = new THREE.Mesh(terrainGeo,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

for (let i = 0; i < 35; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 200 + Math.random() * 400;
  const p = new THREE.Mesh(
    new THREE.PlaneGeometry(30 + Math.random()*60, 20 + Math.random()*40),
    matDirt
  );
  p.rotation.x = -Math.PI / 2;
  p.position.set(Math.cos(a)*r, 0.005, Math.sin(a)*r);
  scene.add(p);
}

// ── ROAD BUILDER ──
const GL = [-120, -60, 0, 60, 120];

function road(x, z, w, d) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matRoad);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.01, z);
  m.receiveShadow = true;
  scene.add(m);
}
function dash(x, z, w, d) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matLine);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.02, z);
  scene.add(m);
}
function pavement(x, z, w, d) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matPave);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.008, z);
  scene.add(m);
}

GL.forEach(z => {
  road(0, z, 242, 11);
  pavement(0, z - 7, 242, 3);
  pavement(0, z + 7, 242, 3);
  for (let x = -120; x <= 120; x += 9) dash(x, z, 4.5, 0.35);
});
GL.forEach(x => {
  road(x, 0, 11, 242);
  pavement(x - 7, 0, 3, 242);
  pavement(x + 7, 0, 3, 242);
  for (let z = -120; z <= 120; z += 9) dash(x, z, 0.35, 4.5);
});

road(0,  300, 15, 360); road(0, -300, 15, 360);
road( 300, 0, 360, 15); road(-300, 0, 360, 15);
for (let i = 130; i < 580; i += 13) {
  const yd  = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 5.5), matYLine);
  yd.rotation.x = -Math.PI / 2;
  yd.position.set(0, 0.022, i); scene.add(yd);
  const yd2 = yd.clone(); yd2.position.z = -i; scene.add(yd2);
  const yd3 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 0.45), matYLine);
  yd3.rotation.x = -Math.PI / 2;
  yd3.position.set(i, 0.022, 0); scene.add(yd3);
  const yd4 = yd3.clone(); yd4.position.x = -i; scene.add(yd4);
}

const RR = 162;
for (let i = 0; i < 72; i++) {
  const a1 = (i / 72) * Math.PI * 2, a2 = ((i+1) / 72) * Math.PI * 2;
  const x1 = Math.cos(a1)*RR, z1 = Math.sin(a1)*RR;
  const x2 = Math.cos(a2)*RR, z2 = Math.sin(a2)*RR;
  const mx = (x1+x2)/2, mz = (z1+z2)/2;
  const len = Math.sqrt((x2-x1)**2+(z2-z1)**2)+0.6;
  const ang = Math.atan2(z2-z1, x2-x1);
  const seg = new THREE.Mesh(new THREE.PlaneGeometry(len, 13), matRoad);
  seg.rotation.x = -Math.PI / 2;
  seg.rotation.z = -ang;
  seg.position.set(mx, 0.012, mz);
  seg.receiveShadow = true;
  scene.add(seg);
}

// CHANGE 2: Bake window reflections once at load using CubeCamera
// Positioned at city center, rendered once, then removed — zero ongoing cost
const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
  format: THREE.RGBFormat,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
});
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRT);
scene.add(cubeCamera);
const skyEnvMap = cubeRT.texture;

// ═══════════════════════════════════════════════
// REALISTIC BUILDINGS WITH REFLECTIVE WINDOWS
// ═══════════════════════════════════════════════

// ── SHARED BUILDING MATERIALS ──
const matRed        = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.6 });
const matGoldTrim   = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.3, metalness: 0.5, emissive: 0xd4a017, emissiveIntensity: 0.2 });
const matDarkWall   = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.8 });
const matConcrete   = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.9 });
const matLanternRed = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.8, roughness: 0.6 });
const matLanternYel = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.8, roughness: 0.6 });

// ── PAGODA ROOF ──
function addPagodaRoof(group, y, w, d, color) {
  // Upturned eave profile using stacked boxes
  const roofMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const scale = 1 - t * 0.2;
    const th = 0.8;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w * scale * 1.4, th, d * scale * 1.4), roofMat);
    roof.position.y = y + t * (th + 0.3);
    group.add(roof);
    // Gold trim edge
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w * scale * 1.45, 0.2, d * scale * 1.45), matGoldTrim);
    trim.position.y = y + t * (th + 0.3) - 0.35;
    group.add(trim);
  }
  // Spire on top
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 2.5, 6), matGoldTrim);
  spire.position.y = y + tiers * 1.2;
  group.add(spire);
}

// ── NEON SIGN ──
function addNeonSign(group, y, w, text_color) {
  const neonMat = new THREE.MeshStandardMaterial({
    color: text_color,
    emissive: new THREE.Color(text_color),
    emissiveIntensity: 2.0,
    roughness: 0.1,
  });
  // Horizontal neon bar
  const bar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.3, 0.15), neonMat);
  bar.position.set(0, y, 0);
  group.add(bar);
  // Vertical bars (like Chinese characters)
  for (let i = 0; i < 3; i++) {
    const vbar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 0.15), neonMat.clone());
    vbar.material.emissiveIntensity = 1.5 + Math.random();
    vbar.position.set(-w*0.25 + i * w*0.25, y - 1.5, 0);
    group.add(vbar);
  }
}

// ── LANTERN ──
function addLantern(group, x, y, z) {
  const mat = Math.random() > 0.3 ? matLanternRed : matLanternYel;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat);
  body.scale.y = 1.4;
  body.position.set(x, y, z);
  group.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.2, 6), matGoldTrim);
  top.position.set(x, y + 0.55, z);
  group.add(top);
  const bot = top.clone(); bot.position.set(x, y - 0.55, z); group.add(bot);
  // Tassel
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.6, 4), matLanternRed);
  tassel.position.set(x, y - 1.0, z);
  group.add(tassel);
}

// ── MAIN BUILDING FUNCTION ──
const FACADE_PALETTES = [
  { wall: 0x1a1208, glass: 0xffcc66, emit: 0xffaa33 }, // warm gold
  { wall: 0x0d0d1a, glass: 0xff6644, emit: 0xff4422 }, // neon red
  { wall: 0x1a1a0d, glass: 0x88ffcc, emit: 0x44ffaa }, // teal neon
  { wall: 0x1a0d0d, glass: 0xffaaff, emit: 0xff44ff }, // magenta
  { wall: 0x0d1a1a, glass: 0x44aaff, emit: 0x2288ff }, // blue neon
  { wall: 0x1a1208, glass: 0xffee88, emit: 0xffcc44 }, // golden
];

const buildingBounds = [];

function makeBuilding(x, z, w, d, h) {
  const palette = FACADE_PALETTES[Math.floor(Math.random() * FACADE_PALETTES.length)];
  const isPagoda = Math.random() > 0.5; // 50% chance of pagoda style
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  buildingBounds.push({ minX: x-w/2, maxX: x+w/2, minZ: z-d/2, maxZ: z+d/2 });

  // ── MAIN BODY ──
  const bodyMat = new THREE.MeshStandardMaterial({
    color: palette.wall, roughness: 0.80, metalness: 0.05,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // ── RED COLUMN ACCENTS on corners ──
  const colH = Math.min(h, 20);
  [[-w/2+0.3, d/2-0.3],[w/2-0.3, d/2-0.3],[-w/2+0.3,-d/2+0.3],[w/2-0.3,-d/2+0.3]].forEach(([cx,cz])=>{
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, colH, 0.5), matRed);
    col.position.set(cx, colH/2, cz);
    group.add(col);
  });

  // ── HORIZONTAL GOLD BANDS every few floors ──
  for (let wy = 6; wy < h - 4; wy += 7) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w+0.1, 0.4, d+0.1), matGoldTrim);
    band.position.y = wy;
    group.add(band);
  }

  // ── GLOWING WINDOWS ──
  const floorHeight = 3.8;
  const windowH     = 2.0;
  const windowInset = 0.06;

  for (let wy = floorHeight; wy < h - 2; wy += floorHeight) {
    const lit = Math.random() > 0.15; // 85% lit — city at night feel
    const winColor = lit ? palette.emit : palette.glass;
    const glassMat = new THREE.MeshStandardMaterial({
      color: winColor,
      emissive: lit ? new THREE.Color(palette.emit) : new THREE.Color(0x000000),
      emissiveIntensity: lit ? 0.6 + Math.random() * 0.6 : 0,
      roughness: 0.04,
      metalness: 0.85,
      envMap: skyEnvMap,
      envMapIntensity: 1.5,
    });

    const wf = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.0, windowH), glassMat);
    wf.position.set(0, wy, d/2 + windowInset); group.add(wf);

    const wb = wf.clone(); wb.material = glassMat.clone();
    wb.position.set(0, wy, -(d/2+windowInset)); wb.rotation.y = Math.PI; group.add(wb);

    const wr = new THREE.Mesh(new THREE.PlaneGeometry(d - 1.0, windowH), glassMat.clone());
    wr.rotation.y = Math.PI/2; wr.position.set(w/2+windowInset, wy, 0); group.add(wr);

    const wl = wr.clone(); wl.material = glassMat.clone();
    wl.position.set(-(w/2+windowInset), wy, 0); wl.rotation.y = -Math.PI/2; group.add(wl);
  }

  // ── ROOF — pagoda or modern ──
  if (isPagoda) {
    const roofColor = Math.random() > 0.5 ? 0x8b0000 : 0x1a3300;
    addPagodaRoof(group, h, w, d, roofColor);
  } else {
    // Modern flat roof with parapet
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(w+0.4,1.0,d+0.4),
      new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.8 }));
    parapet.position.y = h + 0.5; group.add(parapet);
    // Rooftop billboard glow
    const bill = new THREE.Mesh(new THREE.BoxGeometry(w*0.6, 4, 0.3),
      new THREE.MeshStandardMaterial({ color: palette.emit, emissive: new THREE.Color(palette.emit), emissiveIntensity: 1.0 }));
    bill.position.set(0, h+3, d/2); group.add(bill);
  }

  // ── NEON SIGNS on tall buildings ──
  if (h > 20) {
    const neonColors = [0xff2200, 0xffaa00, 0x00ffcc, 0xff00ff, 0x00aaff, 0xffff00];
    addNeonSign(group, h * 0.6, w, neonColors[Math.floor(Math.random()*neonColors.length)]);
    if (h > 35) {
      addNeonSign(group, h * 0.35, w, neonColors[Math.floor(Math.random()*neonColors.length)]);
    }
  }

  // ── LANTERNS on ground floor ──
  if (Math.random() > 0.4) {
    const count = 2 + Math.floor(Math.random()*3);
    for (let li = 0; li < count; li++) {
      const lx = -w/2 + (li+1) * w/(count+1);
      addLantern(group, lx, 5, d/2 + 0.1);
    }
  }

  // ── DARK LOBBY ──
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(w+0.1,3.5,d+0.1), matDarkWall);
  lobby.position.y = 1.75; lobby.castShadow = true; group.add(lobby);

  // Red entrance arch
  const arch = new THREE.Mesh(new THREE.BoxGeometry(w*0.5, 4, 0.4), matRed);
  arch.position.set(0, 2, d/2+0.2); group.add(arch);
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(w*0.5+1, 0.5, 0.4), matGoldTrim);
  archTop.position.set(0, 4.2, d/2+0.2); group.add(archTop);
}

function buildCity() {
  for (let gi = 0; gi < GL.length - 1; gi++) {
    for (let gj = 0; gj < GL.length - 1; gj++) {
      const bx = (GL[gi] + GL[gi+1]) / 2;
      const bz = (GL[gj] + GL[gj+1]) / 2;
      const blockW = GL[gi+1] - GL[gi] - 16;
      const blockD = GL[gj+1] - GL[gj] - 16;
      const n = 1 + Math.floor(Math.random() * 3);
      if (n === 1) {
        makeBuilding(bx, bz, blockW * 0.78, blockD * 0.78, 12+Math.random()*55);
      } else {
        [[0.35,0.35],[0.35,-0.35],[-0.35,0.35],[-0.35,-0.35]].slice(0,n).forEach(([ox,oz]) => {
          makeBuilding(bx+ox*blockW, bz+oz*blockD, blockW*0.38, blockD*0.38, 8+Math.random()*32);
        });
      }
    }
  }
}
buildCity();

// ── STREET LIGHTS WITH LANTERNS ──
function makeLight(x, z) {
  const g = new THREE.Group();
  // Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 })
  );
  pole.position.y = 4; pole.castShadow = true; g.add(pole);

  // Cross arm
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.15, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 })
  );
  arm.position.set(0, 8, 0); g.add(arm);

  // Gold cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.1, 0.5, 6),
    matGoldTrim
  );
  cap.position.y = 8.3; g.add(cap);

  // Lanterns hanging from arm ends
  [-1.5, 0, 1.5].forEach(lx => {
    addLantern(g, lx, 7.2, 0);
  });

  // Warm point light
  const pt = new THREE.PointLight(0xff8833, 1.5, 25);
  pt.position.set(0, 7, 0);
  g.add(pt);

  g.position.set(x, 0, z);
  scene.add(g);
}
// ── STREET LIGHTS — InstancedMesh + dynamic PointLights near player ──

// Collect all light positions
const lightPositions = [];
const lampBounds = []; // for collision
GL.forEach(x => GL.forEach(z => {
  lightPositions.push([x+7.5, z+7.5]);
  lightPositions.push([x-7.5, z-7.5]);
  lampBounds.push({x:x+7.5, z:z+7.5});
  lampBounds.push({x:x-7.5, z:z-7.5});
}));

// Instanced pole mesh (one draw call for all poles)
const poleGeo  = new THREE.CylinderGeometry(0.08, 0.12, 8, 5);
const poleMat2 = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 });
const poleInst = new THREE.InstancedMesh(poleGeo, poleMat2, lightPositions.length);
poleInst.castShadow = true;
const _dummy = new THREE.Object3D();
lightPositions.forEach(([lx, lz], i) => {
  _dummy.position.set(lx, 4, lz);
  _dummy.updateMatrix();
  poleInst.setMatrixAt(i, _dummy.matrix);
});
poleInst.instanceMatrix.needsUpdate = true;
scene.add(poleInst);

// Instanced lantern glows — emissive only, no real lights
const lanternGeo  = new THREE.SphereGeometry(0.35, 6, 5);
const lanternMat2 = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1.2, roughness: 0.6 });
const lanternInst = new THREE.InstancedMesh(lanternGeo, lanternMat2, lightPositions.length);
lanternInst.scale.y = 1.4;
lightPositions.forEach(([lx, lz], i) => {
  _dummy.position.set(lx, 7.2, lz);
  _dummy.updateMatrix();
  lanternInst.setMatrixAt(i, _dummy.matrix);
});
lanternInst.instanceMatrix.needsUpdate = true;
scene.add(lanternInst);

// Only 6 real PointLights — moved to nearest streetlights each frame
const NUM_REAL_LIGHTS = 6;
const realLights = [];
for (let i = 0; i < NUM_REAL_LIGHTS; i++) {
  const pt = new THREE.PointLight(0xff8833, 2.5, 30);
  pt.castShadow = false; // no shadow from street lights = big perf win
  scene.add(pt);
  realLights.push(pt);
}

// Update real lights to follow nearest street lights to player
let lightUpdateTimer = 0;
function updateNearestLights() {
  // Sort light positions by distance to player, take nearest NUM_REAL_LIGHTS
  const sorted = lightPositions
    .map(([lx, lz]) => ({ lx, lz, d: (lx-px)**2 + (lz-pz)**2 }))
    .sort((a, b) => a.d - b.d);
  realLights.forEach((light, i) => {
    if (sorted[i]) {
      light.position.set(sorted[i].lx, 7, sorted[i].lz);
      light.visible = sorted[i].d < 3600; // only visible within ~60 units
    }
  });
}

// ── TREES — InstancedMesh for trunk and canopy ──
const treePositions = [];
for (let t = 130; t < 560; t += 14) {
  treePositions.push([9,t],[-9,t],[9,-t],[-9,-t]);
  treePositions.push([t,9],[t,-9],[-t,9],[-t,-9]);
}
for (let i = 0; i < 120; i++) {
  const a = Math.random()*Math.PI*2, r = 175+Math.random()*410;
  treePositions.push([Math.cos(a)*r, Math.sin(a)*r]);
}

// Instanced trunk
const trunkGeo2  = new THREE.CylinderGeometry(0.2, 0.35, 3, 5);
const trunkMat2  = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
const trunkInst  = new THREE.InstancedMesh(trunkGeo2, trunkMat2, treePositions.length);

// Instanced canopy
const canopyGeo2 = new THREE.ConeGeometry(2.5, 6, 6);
const canopyMat2 = new THREE.MeshLambertMaterial({ color: 0x1e4d2b });
const canopyInst = new THREE.InstancedMesh(canopyGeo2, canopyMat2, treePositions.length);
canopyInst.castShadow = true;

treePositions.forEach(([tx, tz], i) => {
  _dummy.position.set(tx, 1.5, tz); _dummy.rotation.set(0,0,0); _dummy.scale.set(1,1,1);
  _dummy.updateMatrix(); trunkInst.setMatrixAt(i, _dummy.matrix);
  _dummy.position.set(tx, 6.5, tz);
  _dummy.updateMatrix(); canopyInst.setMatrixAt(i, _dummy.matrix);
});
trunkInst.instanceMatrix.needsUpdate = true;
canopyInst.instanceMatrix.needsUpdate = true;
scene.add(trunkInst); scene.add(canopyInst);

// For collision we still need individual positions — just use treePositions array
const trees = treePositions.map(([tx, tz]) => ({
  position: { x: tx, z: tz },
  userData: { alive: true, fall: 0, dir: Math.random()>0.5?1:-1 },
  // We'll hide fallen trees by moving them underground via matrix
  idx: 0,
}));
trees.forEach((t, i) => t.idx = i);

// ── PLAYER CAR ──
const player = new THREE.Group();
const pbody = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 0.8, 4.5),
  new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.2, metalness: 0.6 })
);
pbody.position.y = 0.7; pbody.castShadow = true; player.add(pbody);
const pcabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.6, 2.2),
  new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.1, metalness: 0.3 })
);
pcabin.position.set(0, 1.35, -0.1); player.add(pcabin);
[[-1.1,0.35,1.4],[1.1,0.35,1.4],[-1.1,0.35,-1.4],[1.1,0.35,-1.4]].forEach(([wx,wy,wz]) => {
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
  );
  w.rotation.z = Math.PI/2; w.position.set(wx,wy,wz); player.add(w);
});
player.position.set(0,0,0); scene.add(player);

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('CL1M02.glb', (gltf) => {
  player.remove(pbody); player.remove(pcabin);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3(), center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  const scale = 5/Math.max(size.x,size.y,size.z);
  model.scale.setScalar(scale);
  model.position.x = -center.x*scale; model.position.z = -center.z*scale;
  const box2 = new THREE.Box3().setFromObject(model);
  model.position.y = -box2.min.y;
  model.rotation.y = Math.PI;
  model.traverse(c => { if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; } });
  player.add(model);
}, null, ()=>{});

// ── AI CARS ──
const AI_COLORS=[0x2255ff,0xff8800,0x00cc44,0xcc00cc,0xffff00,0x00ccff,0xff4444,0x88ff00,0xff0088,0x00ffcc,0xaa6600,0x6600aa,0x0044aa,0xaa0044,0x44aa00,0xccaa00,0x00aacc,0xcc4400];
const WPS=[
  [-120,-120],[-120,-60],[-120,0],[-120,60],[-120,120],
  [-60,-120],[-60,-60],[-60,0],[-60,60],[-60,120],
  [0,-120],[0,-60],[0,0],[0,60],[0,120],
  [60,-120],[60,-60],[60,0],[60,60],[60,120],
  [120,-120],[120,-60],[120,0],[120,60],[120,120],
  [0,280],[0,-280],[280,0],[-280,0],
];
for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;WPS.push([Math.cos(a)*162,Math.sin(a)*162]);}

const aiCars=[];
for(let i=0;i<18;i++){
  const g=new THREE.Group();
  const b=new THREE.Mesh(new THREE.BoxGeometry(2,0.7,3.8),new THREE.MeshStandardMaterial({color:AI_COLORS[i%AI_COLORS.length],roughness:0.3,metalness:0.4}));
  b.position.y=0.65; b.castShadow=true; g.add(b);
  const cb=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,2),new THREE.MeshStandardMaterial({color:0x111822,roughness:0.15}));
  cb.position.set(0,1.2,-0.1); g.add(cb);
  [[-0.95,0.32,1.1],[0.95,0.32,1.1],[-0.95,0.32,-1.1],[0.95,0.32,-1.1]].forEach(([wx,wy,wz])=>{
    const w=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.25,8),new THREE.MeshStandardMaterial({color:0x111111,roughness:0.8}));
    w.rotation.z=Math.PI/2; w.position.set(wx,wy,wz); g.add(w);
  });
  const wp=WPS[Math.floor(Math.random()*WPS.length)];
  g.position.set(wp[0]+(Math.random()-0.5)*5,0,wp[1]+(Math.random()-0.5)*5);
  g.userData={wpIdx:Math.floor(Math.random()*WPS.length),spd:i<5?20+Math.random()*10:7+Math.random()*8,angle:Math.random()*Math.PI*2,isRacer:i<5};
  scene.add(g); aiCars.push(g);
}

// ── INPUT ──
const K={gas:false,brake:false,left:false,right:false};
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'||e.key==='w')K.gas=true;
  if(e.key==='ArrowDown'||e.key==='s')K.brake=true;
  if(e.key==='ArrowLeft'||e.key==='a')K.left=true;
  if(e.key==='ArrowRight'||e.key==='d')K.right=true;
});
document.addEventListener('keyup',e=>{
  if(e.key==='ArrowUp'||e.key==='w')K.gas=false;
  if(e.key==='ArrowDown'||e.key==='s')K.brake=false;
  if(e.key==='ArrowLeft'||e.key==='a')K.left=false;
  if(e.key==='ArrowRight'||e.key==='d')K.right=false;
});
function bindBtn(id,key){
  const el=document.getElementById(id);
  const on=()=>{K[key]=true;el.classList.add('on');};
  const off=()=>{K[key]=false;el.classList.remove('on');};
  el.addEventListener('touchstart',e=>{e.preventDefault();on();},{passive:false});
  el.addEventListener('touchend',e=>{e.preventDefault();off();},{passive:false});
  el.addEventListener('mousedown',on);el.addEventListener('mouseup',off);el.addEventListener('mouseleave',off);
}
bindBtn('gg','gas');bindBtn('bg','brake');bindBtn('bl','left');bindBtn('br','right');

// ── PHYSICS ──
let spd=0, px=0, pz=0, pa=0, steer=0;
let velX=0, velZ=0;
let isDrifting=false;

// Vertical physics for airtime
let carY=0, velY=0;
let onGround=true;
const GRAVITY = -18;

const MAXS = 139;    // ~500 km/h in world units/s
const ACC  = 55;     // strong acceleration
const BRK  = 80;
const FRIC = 10;
const SS=0.6, MS=0.18, TF=0.008;
const GRIP=9, DRIFT_GRIP=2;

// Gear ratios — 6 gears
const GEAR_SPEEDS=[0,18,40,70,95,115,139]; // world units/s per gear threshold

// CHANGE 3: Smooth slow minimap
const mmEl=document.getElementById('mm');
const mc=mmEl.getContext('2d');
const MMS=110, MMSC=MMS/1200;

// Offscreen canvas for static roads (drawn once)
const mmOff=document.createElement('canvas');
mmOff.width=MMS; mmOff.height=MMS;
const mco=mmOff.getContext('2d');
mco.fillStyle='#111a14'; mco.fillRect(0,0,MMS,MMS);
mco.fillStyle='#333336';
GL.forEach(z=>{mco.fillRect(0,(z+600)*MMSC-3,MMS,6);});
GL.forEach(x=>{mco.fillRect((x+600)*MMSC-3,0,6,MMS);});
mco.strokeStyle='#444'; mco.lineWidth=3;
mco.beginPath(); mco.arc(MMS/2,MMS/2,162*MMSC,0,Math.PI*2); mco.stroke();

// Smooth dot positions for AI — lerp toward real position
const mmAiPos=aiCars.map(c=>({
  x:(c.position.x+600)*MMSC,
  z:(c.position.z+600)*MMSC,
  tx:(c.position.x+600)*MMSC,
  tz:(c.position.z+600)*MMSC
}));

let mmTimer=0;
const MM_UPDATE=0.25; // update targets every 0.25s
const MM_LERP=0.06;   // smooth glide speed

function drawMinimap(dt){
  mmTimer+=dt;
  // Only snap targets every MM_UPDATE seconds
  if(mmTimer>=MM_UPDATE){
    mmTimer=0;
    aiCars.forEach((c,i)=>{
      mmAiPos[i].tx=(c.position.x+600)*MMSC;
      mmAiPos[i].tz=(c.position.z+600)*MMSC;
    });
  }
  // Lerp dots every frame — smooth glide
  mmAiPos.forEach(p=>{
    p.x+=(p.tx-p.x)*MM_LERP;
    p.z+=(p.tz-p.z)*MM_LERP;
  });

  // Draw static roads from offscreen canvas
  mc.drawImage(mmOff,0,0);

  // Draw AI dots (smoothly interpolated)
  aiCars.forEach((c,i)=>{
    mc.fillStyle=c.userData.isRacer?'#ff8800':'#4488ff';
    mc.beginPath(); mc.arc(mmAiPos[i].x,mmAiPos[i].z,2,0,Math.PI*2); mc.fill();
  });

  // Player dot + direction line (always live)
  const curPX=(px+600)*MMSC, curPZ=(pz+600)*MMSC;
  mc.fillStyle='#00ffcc';
  mc.beginPath(); mc.arc(curPX,curPZ,4,0,Math.PI*2); mc.fill();
  mc.strokeStyle='#00ffcc'; mc.lineWidth=1.5;
  mc.beginPath(); mc.moveTo(curPX,curPZ);
  mc.lineTo(curPX+Math.sin(pa)*8, curPZ+Math.cos(pa)*8); mc.stroke();
}

// ── COLLISION SYSTEM ──
function resolveCollisions(){
  // Buildings
  buildingBounds.forEach(b=>{
    const testX=Math.max(b.minX,Math.min(px,b.maxX));
    const testZ=Math.max(b.minZ,Math.min(pz,b.maxZ));
    const dx=px-testX, dz=pz-testZ;
    const dist=Math.sqrt(dx*dx+dz*dz);
    const radius=1.5;
    if(dist<radius){
      const push=radius-dist;
      if(dist===0){pz=b.minZ-radius;}
      else{px+=(dx/dist)*push; pz+=(dz/dist)*push;}
      spd*=-0.2; velX*=-0.2; velZ*=-0.2;
    }
  });
  // Lampposts
  lampBounds.forEach(l=>{
    const dx=px-l.x, dz=pz-l.z;
    const dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<1.0&&dist>0){
      px+=(dx/dist)*(1.0-dist);
      pz+=(dz/dist)*(1.0-dist);
      spd*=-0.3; velX*=-0.3; velZ*=-0.3;
    }
  });
  // AI cars
  aiCars.forEach(ai=>{
    const dx=px-ai.position.x, dz=pz-ai.position.z;
    const dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<2.5&&dist>0){
      const push=2.5-dist;
      px+=(dx/dist)*push*0.7; pz+=(dz/dist)*push*0.7;
      ai.position.x-=(dx/dist)*push*0.3; ai.position.z-=(dz/dist)*push*0.3;
      spd*=-0.35; velX*=-0.35; velZ*=-0.35;
    }
  });
}

// ── SPEEDOMETER CANVAS ──
const spdCanvas = document.createElement('canvas');
spdCanvas.width = 200; spdCanvas.height = 200;
spdCanvas.style.cssText = 'position:fixed;bottom:220px;right:16px;width:160px;height:160px;z-index:10;pointer-events:none;';
document.body.appendChild(spdCanvas);
const sctx = spdCanvas.getContext('2d');

function drawSpeedometer(kmh, gear, rpmPct) {
  const cx=100, cy=115, r=80;
  sctx.clearRect(0,0,200,200);

  // Outer ring
  sctx.beginPath();
  sctx.arc(cx,cy,r,Math.PI*0.75,Math.PI*2.25);
  sctx.strokeStyle='#ffffff11'; sctx.lineWidth=14; sctx.stroke();

  // Speed arc — green to red
  const maxKmh=500;
  const spdAngle=Math.PI*0.75+(kmh/maxKmh)*Math.PI*1.5;
  const grad=sctx.createLinearGradient(cx-r,cy,cx+r,cy);
  grad.addColorStop(0,'#00ffcc');
  grad.addColorStop(0.5,'#ffcc00');
  grad.addColorStop(1,'#ff2244');
  sctx.beginPath();
  sctx.arc(cx,cy,r,Math.PI*0.75,spdAngle);
  sctx.strokeStyle=grad; sctx.lineWidth=14; sctx.stroke();

  // RPM inner ring
  sctx.beginPath();
  sctx.arc(cx,cy,r-20,Math.PI*0.75,Math.PI*0.75+rpmPct*Math.PI*1.5);
  sctx.strokeStyle=rpmPct>0.85?'#ff2244':'#ff8800';
  sctx.lineWidth=5; sctx.stroke();

  // Tick marks
  for(let i=0;i<=10;i++){
    const a=Math.PI*0.75+(i/10)*Math.PI*1.5;
    const inner=i%5===0?r-28:r-22;
    sctx.beginPath();
    sctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);
    sctx.lineTo(cx+Math.cos(a)*(r-8),cy+Math.sin(a)*(r-8));
    sctx.strokeStyle=i%5===0?'#ffffff88':'#ffffff33';
    sctx.lineWidth=i%5===0?2:1; sctx.stroke();
  }

  // Speed number
  sctx.fillStyle='#ffffff';
  sctx.font='bold 28px monospace';
  sctx.textAlign='center';
  sctx.fillText(kmh,cx,cy+8);

  // KM/H label
  sctx.fillStyle='#ffffff55';
  sctx.font='9px monospace';
  sctx.fillText('KM/H',cx,cy+24);

  // Gear
  sctx.fillStyle='#00ffcc';
  sctx.font='bold 14px monospace';
  sctx.fillText('G'+gear,cx,cy+44);

  // Airborne indicator
  if(!onGround){
    sctx.fillStyle='#ff8800';
    sctx.font='bold 10px monospace';
    sctx.fillText('AIR',cx,cy-30);
  }
  if(isDrifting){
    sctx.fillStyle='#ff2244';
    sctx.font='bold 10px monospace';
    sctx.fillText('DRIFT',cx,cy-44);
  }
}

// ── GAME LOOP ──
const clock=new THREE.Clock();

function update(dt){
  // Acceleration
  if(K.gas)        spd=Math.min(spd+ACC*dt,MAXS);
  else if(K.brake) spd=Math.max(spd-BRK*dt,-MAXS*0.3);
  else{if(spd>0)spd=Math.max(0,spd-FRIC*dt);if(spd<0)spd=Math.min(0,spd+FRIC*dt);}

  // Speed-sensitive steering
  const speedFactor=Math.max(0.25,1-Math.abs(spd)/MAXS*0.75);
  if(K.left)       steer=Math.min(steer+SS*speedFactor*dt, MS*speedFactor);
  else if(K.right) steer=Math.max(steer-SS*speedFactor*dt,-MS*speedFactor);
  else             steer*=(1-6*dt);

  // Drift
  const wantDrift=K.brake&&Math.abs(spd)>20&&Math.abs(steer)>0.04;
  isDrifting=wantDrift;
  const grip=isDrifting?DRIFT_GRIP:GRIP;

  if(Math.abs(spd)>0.3) pa+=steer*spd*TF;

  // Horizontal velocity with grip
  const targetVX=Math.sin(pa)*spd;
  const targetVZ=Math.cos(pa)*spd;
  velX+=(targetVX-velX)*grip*dt;
  velZ+=(targetVZ-velZ)*grip*dt;

  px+=velX*dt;
  pz+=velZ*dt;

  resolveCollisions();

  const LIM=590;
  if(px>LIM){px=LIM;spd*=0.3;}if(px<-LIM){px=-LIM;spd*=0.3;}
  if(pz>LIM){pz=LIM;spd*=0.3;}if(pz<-LIM){pz=-LIM;spd*=0.3;}

  // ── VERTICAL PHYSICS (gravity + airtime) ──
  const groundH = terrainHeight(px, pz);

  if(onGround){
    // Follow terrain smoothly
    const targetY = groundH;
    carY += (targetY - carY) * 12 * dt;

    // Launch into air if going fast over a bump
    const bumpSlope = terrainHeight(px+Math.sin(pa)*2, pz+Math.cos(pa)*2) - groundH;
    if(bumpSlope < -0.4 && Math.abs(spd) > 40){
      velY = Math.abs(bumpSlope) * Math.abs(spd) * 0.12;
      onGround = false;
    }
  } else {
    // Airborne — apply gravity
    velY += GRAVITY * dt;
    carY += velY * dt;

    if(carY <= groundH){
      carY = groundH;
      velY = 0;
      onGround = true;
      // Hard landing — lose some speed
      if(Math.abs(velY) > 5) spd *= 0.85;
    }
  }

  // Car pitch based on terrain slope
  const slopeF = terrainHeight(px+Math.sin(pa)*2, pz+Math.cos(pa)*2) - terrainHeight(px-Math.sin(pa)*2, pz-Math.cos(pa)*2);
  const slopeS = terrainHeight(px+Math.cos(pa)*1.5, pz-Math.sin(pa)*1.5) - terrainHeight(px-Math.cos(pa)*1.5, pz+Math.sin(pa)*1.5);

  player.position.set(px, carY, pz);
  player.rotation.order = 'YXZ';
  player.rotation.y = pa;
  player.rotation.x = onGround ? -slopeF * 0.12 : 0;
  player.rotation.z = onGround ?  slopeS * 0.12 : 0;

  // Camera — pull back when airborne
  const camDist = isDrifting?16:onGround?12:14;
  const camH    = isDrifting?6:onGround?5:8;
  const cosA=Math.cos(pa), sinA=Math.sin(pa);
  cam.position.lerp(new THREE.Vector3(px-sinA*camDist, carY+camH, pz-cosA*camDist), 5*dt);
  cam.lookAt(px+sinA*8, carY+0.8, pz+cosA*8);

  aiCars.forEach(c=>{
    const wp=WPS[c.userData.wpIdx%WPS.length];
    const dx=wp[0]-c.position.x,dz=wp[1]-c.position.z;
    if(Math.sqrt(dx*dx+dz*dz)<8)c.userData.wpIdx=(c.userData.wpIdx+1)%WPS.length;
    const ta=Math.atan2(dx,dz);
    let diff=ta-c.userData.angle;
    while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
    c.userData.angle+=Math.sign(diff)*Math.min(Math.abs(diff),2*dt);
    c.position.x+=Math.sin(c.userData.angle)*c.userData.spd*dt;
    c.position.z+=Math.cos(c.userData.angle)*c.userData.spd*dt;
    c.rotation.y=c.userData.angle;

    // AI building collision — push out of buildings
    buildingBounds.forEach(b=>{
      const tx=Math.max(b.minX,Math.min(c.position.x,b.maxX));
      const tz=Math.max(b.minZ,Math.min(c.position.z,b.maxZ));
      const dx=c.position.x-tx, dz=c.position.z-tz;
      const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist<1.5&&dist>0){
        c.position.x+=(dx/dist)*(1.5-dist);
        c.position.z+=(dz/dist)*(1.5-dist);
        c.userData.angle+=Math.PI*0.25; // nudge angle so they don't get stuck
      } else if(dist===0){
        c.position.x=b.maxX+1.5;
      }
    });

    c.position.x=Math.max(-590,Math.min(590,c.position.x));
    c.position.z=Math.max(-590,Math.min(590,c.position.z));
  });

  // Trees (instanced — tilt fallen trees via matrix)
  trees.forEach((t, i) => {
    if (!t.userData.alive) {
      if (t.userData.fall < Math.PI/2) {
        t.userData.fall += 0.04;
        _dummy.position.set(t.position.x, 6.5 - t.userData.fall * 4, t.position.z);
        _dummy.rotation.set(t.userData.dir * t.userData.fall, 0, 0);
        _dummy.scale.set(1,1,1); _dummy.updateMatrix();
        canopyInst.setMatrixAt(i, _dummy.matrix);
        canopyInst.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    const dx = px - t.position.x, dz = pz - t.position.z;
    if (dx*dx + dz*dz < 7) t.userData.alive = false;
  });

  // Dynamic nearest street lights (update every 0.4s)
  lightUpdateTimer += dt;
  if (lightUpdateTimer > 0.4) { lightUpdateTimer = 0; updateNearestLights(); }

  // Gear calculation
  const kmh = Math.abs(Math.round(spd * 3.6));
  let gear = 1;
  for(let g=1;g<GEAR_SPEEDS.length;g++){
    if(Math.abs(spd)>=GEAR_SPEEDS[g-1]) gear=g;
  }
  // RPM — rises within each gear band then drops at shift
  const gearLow  = GEAR_SPEEDS[gear-1]*3.6;
  const gearHigh = GEAR_SPEEDS[gear]*3.6;
  const rpmPct   = Math.max(0,Math.min(1,(kmh-gearLow)/(gearHigh-gearLow)));

  document.getElementById('sv').textContent  = kmh;
  document.getElementById('gear-disp').textContent = 'GEAR ' + gear;
  // Update needle angle on speedometer canvas
  drawSpeedometer(kmh, gear, rpmPct);
  sun.position.set(px+100,200,pz+100);
  sun.target.position.set(px,0,pz);

  drawMinimap(dt);
}

// ── FPS COUNTER ──
const fpsEl = document.createElement('div');
fpsEl.style.cssText = 'position:fixed;top:18px;right:18px;color:#00ffcc;font-family:monospace;font-size:11px;letter-spacing:2px;background:rgba(0,0,0,0.5);padding:4px 10px;border-radius:4px;pointer-events:none;z-index:10;';
document.body.appendChild(fpsEl);
let fpsFrames=0, fpsTime=0, fpsVal=0;

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);

  // FPS tracking
  fpsFrames++;
  fpsTime+=dt;
  if(fpsTime>=0.5){
    fpsVal=Math.round(fpsFrames/fpsTime);
    fpsEl.textContent=fpsVal+' FPS';
    fpsEl.style.color=fpsVal>=50?'#00ffcc':fpsVal>=30?'#ffcc00':'#ff4444';
    fpsFrames=0; fpsTime=0;
  }

  update(dt);
  renderer.render(scene,cam);
}

window.addEventListener('resize',()=>{
  cam.aspect=innerWidth/innerHeight;
  cam.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

animate();

// Bake window reflections ONCE after everything loads, then remove cube camera
setTimeout(()=>{
  cubeCamera.position.set(0, 10, 0);
  scene.background = new THREE.Color(0x0a0a1a);
  cubeCamera.update(renderer, scene);
  scene.remove(cubeCamera);
  const l=document.getElementById('loader');
  if(l){ l.style.opacity='0'; setTimeout(()=>{ if(l.parentNode)l.remove(); },700); }
},1400);

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
scene.background = new THREE.Color(0x87CEEB);
// CHANGE 1: Exponential fog = objects naturally blur/fade at distance like real atmosphere
scene.fog = new THREE.FogExp2(0x87CEEB, 0.010);

// ── CAMERA ──
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
cam.position.set(0, 5, -12);
cam.lookAt(0, 0, 0);

// ── LIGHTS ──
scene.add(new THREE.AmbientLight(0xfff4e0, 0.9));

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

// ── GROUND ──
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), matGrass);
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

// CHANGE 2: Remove CubeCamera (was rendering scene twice = huge lag)
// Replace with a simple static sky colour env map using DataTexture
const skyData = new Uint8Array([135, 206, 235, 255]); // sky blue RGBA
const skyTex = new THREE.DataTexture(skyData, 1, 1, THREE.RGBAFormat);
skyTex.needsUpdate = true;
const skyEnvMap = skyTex;

// ═══════════════════════════════════════════════
// REALISTIC BUILDINGS WITH REFLECTIVE WINDOWS
// ═══════════════════════════════════════════════

const FACADE_PALETTES = [
  { wall: 0x1a2030, glass: 0x88bbdd, emit: 0xffeebb },
  { wall: 0x2a2a35, glass: 0x99ccee, emit: 0xfff4cc },
  { wall: 0x3a3028, glass: 0xaabbcc, emit: 0xffeedd },
  { wall: 0x2d3a2d, glass: 0x88ddaa, emit: 0xeeffcc },
  { wall: 0x35252a, glass: 0xddaaaa, emit: 0xffeeee },
  { wall: 0x252535, glass: 0xaabbff, emit: 0xddeeff },
];

const buildingBounds = [];

function makeBuilding(x, z, w, d, h) {
  const palette = FACADE_PALETTES[Math.floor(Math.random() * FACADE_PALETTES.length)];
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  buildingBounds.push({ minX: x-w/2, maxX: x+w/2, minZ: z-d/2, maxZ: z+d/2 });

  const bodyMat = new THREE.MeshStandardMaterial({
    color: palette.wall, roughness: 0.75, metalness: 0.1,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const floorHeight = 4.0;
  const windowH     = 2.2;
  const windowInset = 0.06;

  for (let wy = floorHeight; wy < h - 2; wy += floorHeight) {
    const lit = Math.random() > 0.25;
    const glassMat = new THREE.MeshStandardMaterial({
      color: lit ? palette.emit : palette.glass,
      emissive: lit ? new THREE.Color(palette.emit) : new THREE.Color(0x000000),
      emissiveIntensity: lit ? 0.3 + Math.random() * 0.4 : 0,
      roughness: 0.04,
      metalness: 0.92,
    });

    const wf = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.2, windowH), glassMat);
    wf.position.set(0, wy, d/2 + windowInset);
    group.add(wf);

    const wb = wf.clone();
    wb.material = glassMat.clone();
    wb.position.set(0, wy, -(d/2 + windowInset));
    wb.rotation.y = Math.PI;
    group.add(wb);

    const wr = new THREE.Mesh(new THREE.PlaneGeometry(d - 1.2, windowH), glassMat.clone());
    wr.rotation.y = Math.PI / 2;
    wr.position.set(w/2 + windowInset, wy, 0);
    group.add(wr);

    const wl = wr.clone();
    wl.material = glassMat.clone();
    wl.position.set(-(w/2 + windowInset), wy, 0);
    wl.rotation.y = -Math.PI / 2;
    group.add(wl);
  }

  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.8 });
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(w+0.4, 1.0, d+0.4), parapetMat);
  parapet.position.y = h + 0.5;
  group.add(parapet);

  if (h > 20) {
    const acMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.7 });
    for (let ai = 0; ai < 1 + Math.floor(Math.random()*3); ai++) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(w*0.12, 1.8, d*0.12), acMat);
      ac.position.set((Math.random()-0.5)*w*0.6, h+1.4, (Math.random()-0.5)*d*0.6);
      group.add(ac);
    }
    if (h > 35) {
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, h*0.15, 4),
        new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.2 })
      );
      spire.position.y = h + 1 + h*0.075;
      group.add(spire);
    }
  }

  const lobbyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.2, metalness: 0.7 });
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(w+0.1, 3.5, d+0.1), lobbyMat);
  lobby.position.y = 1.75;
  lobby.castShadow = true;
  group.add(lobby);

  const lobbyGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(w*0.4, 2.8),
    new THREE.MeshStandardMaterial({
      color: 0x88ccff, roughness: 0.0, metalness: 1.0,
      transparent: true, opacity: 0.8,
    })
  );
  lobbyGlass.position.set(0, 1.4, d/2 + 0.07);
  group.add(lobbyGlass);
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

// ── STREET LIGHTS ──
function makeLight(x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x505055, metalness: 0.6, roughness: 0.4 })
  );
  pole.position.y = 3.5; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x404045 })
  );
  arm.position.set(0.6, 7.05, 0); g.add(arm);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.25, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x222225 })
  );
  head.position.set(1.1, 6.9, 0); g.add(head);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfffce0, emissive: 0xfffce0, emissiveIntensity: 1.5 })
  );
  bulb.position.set(1.1, 6.75, 0); g.add(bulb);
  g.position.set(x, 0, z);
  scene.add(g);
}
GL.forEach(x => GL.forEach(z => { makeLight(x+7.5, z+7.5); makeLight(x-7.5, z-7.5); }));

// ── DESTRUCTIBLE TREES ──
const trees = [];
function makeTree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.35, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.95 })
  );
  trunk.position.y = 1.5; trunk.castShadow = true; g.add(trunk);
  const shades = [0x1e4d2b, 0x2d6a4f, 0x1a5c38, 0x38855a];
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 6, 7),
    new THREE.MeshStandardMaterial({ color: shades[Math.floor(Math.random()*shades.length)], roughness: 0.9 })
  );
  top.position.y = 6.5; top.castShadow = true; g.add(top);
  g.position.set(x, 0, z);
  g.userData = { alive: true, fall: 0, dir: Math.random() > 0.5 ? 1 : -1 };
  scene.add(g); trees.push(g);
}
for (let t = 130; t < 560; t += 12) {
  makeTree(9,t); makeTree(-9,t); makeTree(9,-t); makeTree(-9,-t);
  makeTree(t,9); makeTree(t,-9); makeTree(-t,9); makeTree(-t,-9);
}
for (let i = 0; i < 200; i++) {
  const a = Math.random()*Math.PI*2, r = 175+Math.random()*410;
  makeTree(Math.cos(a)*r, Math.sin(a)*r);
}

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
let spd=0,px=0,pz=0,pa=0,steer=0;
const MAXS=30,ACC=14,BRK=24,FRIC=7,SS=0.9,MS=0.22,TF=0.013;

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
      spd*=-0.2;
    }
  });
  aiCars.forEach(ai=>{
    const dx=px-ai.position.x, dz=pz-ai.position.z;
    const dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<2.5&&dist>0){
      const push=2.5-dist;
      px+=(dx/dist)*push*0.7; pz+=(dz/dist)*push*0.7;
      ai.position.x-=(dx/dist)*push*0.3; ai.position.z-=(dz/dist)*push*0.3;
      spd*=-0.35;
    }
  });
}

// ── GAME LOOP ──
const clock=new THREE.Clock();

function update(dt){
  if(K.gas)        spd=Math.min(spd+ACC*dt,MAXS);
  else if(K.brake) spd=Math.max(spd-BRK*dt,-MAXS*0.35);
  else{if(spd>0)spd=Math.max(0,spd-FRIC*dt);if(spd<0)spd=Math.min(0,spd+FRIC*dt);}

  if(K.left)       steer=Math.min(steer+SS*dt,MS);
  else if(K.right) steer=Math.max(steer-SS*dt,-MS);
  else             steer*=(1-5*dt);

  if(Math.abs(spd)>0.3) pa+=steer*spd*TF;
  px+=Math.sin(pa)*spd*dt;
  pz+=Math.cos(pa)*spd*dt;

  resolveCollisions();

  const LIM=590;
  if(px>LIM){px=LIM;spd*=0.3;}if(px<-LIM){px=-LIM;spd*=0.3;}
  if(pz>LIM){pz=LIM;spd*=0.3;}if(pz<-LIM){pz=-LIM;spd*=0.3;}

  player.position.set(px,0,pz);
  player.rotation.y=pa;

  const cosA=Math.cos(pa),sinA=Math.sin(pa);
  cam.position.lerp(new THREE.Vector3(px-sinA*12,5,pz-cosA*12),5*dt);
  cam.lookAt(px+sinA*8,0.8,pz+cosA*8);

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
    c.position.x=Math.max(-590,Math.min(590,c.position.x));
    c.position.z=Math.max(-590,Math.min(590,c.position.z));
  });

  trees.forEach(t=>{
    if(!t.userData.alive){
      if(t.userData.fall<Math.PI/2){t.userData.fall+=0.04;t.rotation.z=t.userData.dir*t.userData.fall;}
      return;
    }
    const dx=px-t.position.x,dz=pz-t.position.z;
    if(dx*dx+dz*dz<7)t.userData.alive=false;
  });

  document.getElementById('sv').textContent=Math.abs(Math.round(spd*3.6));
  sun.position.set(px+100,200,pz+100);
  sun.target.position.set(px,0,pz);

  drawMinimap(dt);
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  update(dt);
  renderer.render(scene,cam);
}

window.addEventListener('resize',()=>{
  cam.aspect=innerWidth/innerHeight;
  cam.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

animate();
setTimeout(()=>{
  const l=document.getElementById('loader');
  l.style.opacity='0';
  setTimeout(()=>l.remove(),700);
},1400);

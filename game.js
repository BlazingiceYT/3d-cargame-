// ═══════════════════════════════════════════════
// BLAZINGICE CITY RACER — game.js
// ═══════════════════════════════════════════════

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.physicallyCorrectLights = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);

const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
cam.position.set(0, 5, -12);
cam.lookAt(0, 1, 10);

scene.add(new THREE.AmbientLight(0x556688, 2.5));
const sun = new THREE.DirectionalLight(0xfffbe8, 2.0);
sun.position.set(100, 200, 100);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -300; sun.shadow.camera.right = 300;
sun.shadow.camera.top = 300;   sun.shadow.camera.bottom = -300;
sun.shadow.camera.far = 600;   sun.shadow.bias = -0.0003;
scene.add(sun);
scene.add(new THREE.DirectionalLight(0xaaccff, 0.4)).position.set(-80, 60, -80);

const matRoad = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.95 });
const matLine = new THREE.MeshBasicMaterial({ color: 0xffffff });
const matYLine = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const matPave = new THREE.MeshStandardMaterial({ color: 0x888890, roughness: 0.85 });
const matDirt = new THREE.MeshStandardMaterial({ color: 0x7a5c30, roughness: 0.98 });

// ── TERRAIN — flat with a few big distinct bumps ──
const BUMPS = [
  { x:220,  z:180,  r:40, h:3.5 },
  { x:-180, z:250,  r:35, h:4.0 },
  { x:300,  z:-200, r:45, h:3.0 },
  { x:-280, z:-160, r:38, h:3.8 },
  { x:180,  z:-320, r:42, h:2.8 },
  { x:-350, z:280,  r:50, h:4.5 },
  { x:400,  z:100,  r:36, h:3.2 },
  { x:-100, z:400,  r:44, h:3.6 },
];

function terrainHeight(wx, wz) {
  const d = Math.sqrt(wx*wx + wz*wz);
  if(d < 135) return 0;

  let h = 0;
  for(const b of BUMPS){
    const bd = Math.sqrt((wx-b.x)**2 + (wz-b.z)**2);
    if(bd < b.r){
      const t = bd / b.r;
      h += b.h * (0.5 + 0.5*Math.cos(t * Math.PI));
    }
  }
  return h;
}

const terrainGeo = new THREE.PlaneGeometry(1400, 1400, 100, 100);
const tPos = terrainGeo.attributes.position;
for (let i = 0; i < tPos.count; i++) {
  tPos.setZ(i, terrainHeight(tPos.getX(i), tPos.getY(i)));
}
terrainGeo.computeVertexNormals();
const tColors = new Float32Array(tPos.count * 3);
for (let i = 0; i < tPos.count; i++) {
  const h = tPos.getZ(i);
  const t = Math.max(0, Math.min(1, h / 4.5));
  tColors[i*3]   = 0.10 + t*0.15;  // R
  tColors[i*3+1] = 0.25 + t*0.30;  // G
  tColors[i*3+2] = 0.08 + t*0.05;  // B
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
const ground = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

for (let i = 0; i < 35; i++) {
  const a = Math.random()*Math.PI*2, r = 200+Math.random()*400;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(30+Math.random()*60, 20+Math.random()*40), matDirt);
  p.rotation.x = -Math.PI/2; p.position.set(Math.cos(a)*r, 0.005, Math.sin(a)*r); scene.add(p);
}

// ── ROADS ──
const GL = [-120,-60,0,60,120];
function road(x,z,w,d){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),matRoad); m.rotation.x=-Math.PI/2; m.position.set(x,0.01,z); m.receiveShadow=true; scene.add(m); }
function dash(x,z,w,d){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),matLine); m.rotation.x=-Math.PI/2; m.position.set(x,0.02,z); scene.add(m); }
function pave(x,z,w,d){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),matPave); m.rotation.x=-Math.PI/2; m.position.set(x,0.008,z); scene.add(m); }

GL.forEach(z=>{ road(0,z,242,11); pave(0,z-7,242,3); pave(0,z+7,242,3); for(let x=-120;x<=120;x+=9)dash(x,z,4.5,0.35); });
GL.forEach(x=>{ road(x,0,11,242); pave(x-7,0,3,242); pave(x+7,0,3,242); for(let z=-120;z<=120;z+=9)dash(x,z,0.35,4.5); });
road(0,300,15,360); road(0,-300,15,360); road(300,0,360,15); road(-300,0,360,15);
for(let i=130;i<580;i+=13){
  const yd=new THREE.Mesh(new THREE.PlaneGeometry(0.45,5.5),matYLine); yd.rotation.x=-Math.PI/2;
  yd.position.set(0,0.022,i); scene.add(yd); const yd2=yd.clone(); yd2.position.z=-i; scene.add(yd2);
  const yd3=new THREE.Mesh(new THREE.PlaneGeometry(5.5,0.45),matYLine); yd3.rotation.x=-Math.PI/2;
  yd3.position.set(i,0.022,0); scene.add(yd3); const yd4=yd3.clone(); yd4.position.x=-i; scene.add(yd4);
}
for(let i=0;i<72;i++){
  const a1=(i/72)*Math.PI*2, a2=((i+1)/72)*Math.PI*2;
  const x1=Math.cos(a1)*162,z1=Math.sin(a1)*162,x2=Math.cos(a2)*162,z2=Math.sin(a2)*162;
  const seg=new THREE.Mesh(new THREE.PlaneGeometry(Math.sqrt((x2-x1)**2+(z2-z1)**2)+0.6,13),matRoad);
  seg.rotation.x=-Math.PI/2; seg.rotation.z=-Math.atan2(z2-z1,x2-x1);
  seg.position.set((x1+x2)/2,0.012,(z1+z2)/2); seg.receiveShadow=true; scene.add(seg);
}

// ── ENV MAP for windows ──
const cubeRT = new THREE.WebGLCubeRenderTarget(256,{format:THREE.RGBFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
const cubeCamera = new THREE.CubeCamera(0.1,1000,cubeRT);
scene.add(cubeCamera);
const skyEnvMap = cubeRT.texture;

// ── BUILDING MATERIALS ──
const matRed = new THREE.MeshStandardMaterial({color:0xcc1111,roughness:0.6});
const matGold = new THREE.MeshStandardMaterial({color:0xd4a017,roughness:0.3,metalness:0.5,emissive:0xd4a017,emissiveIntensity:0.2});
const matDarkWall = new THREE.MeshStandardMaterial({color:0x1a1208,roughness:0.8});
const matLanternR = new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff2200,emissiveIntensity:0.8});
const matLanternY = new THREE.MeshStandardMaterial({color:0xffaa00,emissive:0xffaa00,emissiveIntensity:0.8});

function addPagodaRoof(g,y,w,d,color){
  const rm=new THREE.MeshStandardMaterial({color,roughness:0.7});
  for(let t=0;t<3;t++){
    const sc=1-t*0.2;
    const r=new THREE.Mesh(new THREE.BoxGeometry(w*sc*1.4,0.8,d*sc*1.4),rm);
    r.position.y=y+t*1.1; g.add(r);
    const tr=new THREE.Mesh(new THREE.BoxGeometry(w*sc*1.45,0.2,d*sc*1.45),matGold);
    tr.position.y=y+t*1.1-0.35; g.add(tr);
  }
  const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.3,2.5,6),matGold);
  sp.position.y=y+3.6; g.add(sp);
}

function addNeonSign(g,y,w,col){
  const nm=new THREE.MeshStandardMaterial({color:col,emissive:new THREE.Color(col),emissiveIntensity:2.0,roughness:0.1});
  const bar=new THREE.Mesh(new THREE.BoxGeometry(w*0.7,0.3,0.15),nm); bar.position.set(0,y,0); g.add(bar);
  for(let i=0;i<3;i++){ const vb=new THREE.Mesh(new THREE.BoxGeometry(0.2,2.5,0.15),nm.clone()); vb.position.set(-w*0.25+i*w*0.25,y-1.5,0); g.add(vb); }
}

function addLantern(g,x,y,z){
  const mat=Math.random()>0.3?matLanternR:matLanternY;
  const b=new THREE.Mesh(new THREE.SphereGeometry(0.35,8,6),mat);
  b.scale.y=1.4; b.position.set(x,y,z); g.add(b);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.2,0.2,6),matGold); top.position.set(x,y+0.55,z); g.add(top);
  const bot=top.clone(); bot.position.set(x,y-0.55,z); g.add(bot);
  const ts=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.01,0.6,4),matLanternR); ts.position.set(x,y-1.0,z); g.add(ts);
}

const PALETTES=[
  {wall:0x1a1208,glass:0xffcc66,emit:0xffaa33},
  {wall:0x0d0d1a,glass:0xff6644,emit:0xff4422},
  {wall:0x1a1a0d,glass:0x88ffcc,emit:0x44ffaa},
  {wall:0x1a0d0d,glass:0xffaaff,emit:0xff44ff},
  {wall:0x0d1a1a,glass:0x44aaff,emit:0x2288ff},
  {wall:0x1a1208,glass:0xffee88,emit:0xffcc44},
];

const buildingBounds=[];
function makeBuilding(x,z,w,d,h){
  const p=PALETTES[Math.floor(Math.random()*PALETTES.length)];
  const isPagoda=Math.random()>0.5;
  const grp=new THREE.Group(); grp.position.set(x,0,z); scene.add(grp);
  buildingBounds.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,h});

  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:p.wall,roughness:0.8,metalness:0.05}));
  body.position.y=h/2; body.castShadow=true; body.receiveShadow=true; grp.add(body);

  const colH=Math.min(h,20);
  [[-w/2+0.3,d/2-0.3],[w/2-0.3,d/2-0.3],[-w/2+0.3,-d/2+0.3],[w/2-0.3,-d/2+0.3]].forEach(([cx,cz])=>{
    const col=new THREE.Mesh(new THREE.BoxGeometry(0.5,colH,0.5),matRed); col.position.set(cx,colH/2,cz); grp.add(col);
  });
  for(let wy=6;wy<h-4;wy+=7){ const band=new THREE.Mesh(new THREE.BoxGeometry(w+0.1,0.4,d+0.1),matGold); band.position.y=wy; grp.add(band); }

  for(let wy=3.8;wy<h-2;wy+=3.8){
    const lit=Math.random()>0.15;
    const gm=new THREE.MeshStandardMaterial({color:lit?p.emit:p.glass,emissive:lit?new THREE.Color(p.emit):new THREE.Color(0),emissiveIntensity:lit?0.6+Math.random()*0.6:0,roughness:0.04,metalness:0.85,envMap:skyEnvMap,envMapIntensity:1.5});
    const wf=new THREE.Mesh(new THREE.PlaneGeometry(w-1,2),gm); wf.position.set(0,wy,d/2+0.06); grp.add(wf);
    const wb=wf.clone(); wb.material=gm.clone(); wb.position.set(0,wy,-(d/2+0.06)); wb.rotation.y=Math.PI; grp.add(wb);
    const wr=new THREE.Mesh(new THREE.PlaneGeometry(d-1,2),gm.clone()); wr.rotation.y=Math.PI/2; wr.position.set(w/2+0.06,wy,0); grp.add(wr);
    const wl=wr.clone(); wl.material=gm.clone(); wl.position.set(-(w/2+0.06),wy,0); wl.rotation.y=-Math.PI/2; grp.add(wl);
  }

  if(isPagoda){ addPagodaRoof(grp,h,w,d,Math.random()>0.5?0x8b0000:0x1a3300); }
  else{
    const par=new THREE.Mesh(new THREE.BoxGeometry(w+0.4,1,d+0.4),new THREE.MeshStandardMaterial({color:0x111118})); par.position.y=h+0.5; grp.add(par);
    const bill=new THREE.Mesh(new THREE.BoxGeometry(w*0.6,4,0.3),new THREE.MeshStandardMaterial({color:p.emit,emissive:new THREE.Color(p.emit),emissiveIntensity:1})); bill.position.set(0,h+3,d/2); grp.add(bill);
  }

  if(h>20){ const nc=[0xff2200,0xffaa00,0x00ffcc,0xff00ff,0x00aaff,0xffff00]; addNeonSign(grp,h*0.6,w,nc[Math.floor(Math.random()*nc.length)]); }
  if(Math.random()>0.4){ const cnt=2+Math.floor(Math.random()*3); for(let li=0;li<cnt;li++) addLantern(grp,-w/2+(li+1)*w/(cnt+1),5,d/2+0.1); }

  const lob=new THREE.Mesh(new THREE.BoxGeometry(w+0.1,3.5,d+0.1),matDarkWall); lob.position.y=1.75; lob.castShadow=true; grp.add(lob);
  const arch=new THREE.Mesh(new THREE.BoxGeometry(w*0.5,4,0.4),matRed); arch.position.set(0,2,d/2+0.2); grp.add(arch);
  const at=new THREE.Mesh(new THREE.BoxGeometry(w*0.5+1,0.5,0.4),matGold); at.position.set(0,4.2,d/2+0.2); grp.add(at);
}

for(let gi=0;gi<GL.length-1;gi++) for(let gj=0;gj<GL.length-1;gj++){
  const bx=(GL[gi]+GL[gi+1])/2, bz=(GL[gj]+GL[gj+1])/2;
  const bw=GL[gi+1]-GL[gi]-16, bd=GL[gj+1]-GL[gj]-16;
  const n=1+Math.floor(Math.random()*3);
  if(n===1) makeBuilding(bx,bz,bw*0.78,bd*0.78,12+Math.random()*55);
  else [[0.35,0.35],[0.35,-0.35],[-0.35,0.35],[-0.35,-0.35]].slice(0,n).forEach(([ox,oz])=>makeBuilding(bx+ox*bw,bz+oz*bd,bw*0.38,bd*0.38,8+Math.random()*32));
}

// ── STREET LIGHTS ──
const lightPositions=[], lampBounds=[];
GL.forEach(x=>GL.forEach(z=>{
  lightPositions.push([x+7.5,z+7.5],[x-7.5,z-7.5]);
  lampBounds.push({x:x+7.5,z:z+7.5},{x:x-7.5,z:z-7.5});
}));
const _dummy=new THREE.Object3D();
const poleInst=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08,0.12,8,5),new THREE.MeshStandardMaterial({color:0x8B0000}),lightPositions.length);
lightPositions.forEach(([lx,lz],i)=>{ _dummy.position.set(lx,4,lz); _dummy.updateMatrix(); poleInst.setMatrixAt(i,_dummy.matrix); });
poleInst.instanceMatrix.needsUpdate=true; scene.add(poleInst);

const lanternInst=new THREE.InstancedMesh(new THREE.SphereGeometry(0.35,6,5),new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff2200,emissiveIntensity:1.2}),lightPositions.length);
lightPositions.forEach(([lx,lz],i)=>{ _dummy.position.set(lx,7.2,lz); _dummy.updateMatrix(); lanternInst.setMatrixAt(i,_dummy.matrix); });
lanternInst.instanceMatrix.needsUpdate=true; scene.add(lanternInst);

const realLights=[];
for(let i=0;i<6;i++){ const pt=new THREE.PointLight(0xff8833,2.5,30); pt.castShadow=false; scene.add(pt); realLights.push(pt); }
let lightTimer=0;
function updateNearestLights(){
  const sorted=lightPositions.map(([lx,lz])=>({lx,lz,d:(lx-px)**2+(lz-pz)**2})).sort((a,b)=>a.d-b.d);
  realLights.forEach((l,i)=>{ if(sorted[i]){l.position.set(sorted[i].lx,7,sorted[i].lz);l.visible=sorted[i].d<3600;} });
}

// ── TREES ──
const treePos=[];
for(let t=130;t<560;t+=14){ treePos.push([9,t],[-9,t],[9,-t],[-9,-t],[t,9],[t,-9],[-t,9],[-t,-9]); }
for(let i=0;i<120;i++){ const a=Math.random()*Math.PI*2,r=175+Math.random()*410; treePos.push([Math.cos(a)*r,Math.sin(a)*r]); }

const trunkInst=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2,0.35,3,5),new THREE.MeshLambertMaterial({color:0x5c3d1e}),treePos.length);
const canopyInst=new THREE.InstancedMesh(new THREE.ConeGeometry(2.5,6,6),new THREE.MeshLambertMaterial({color:0x1e4d2b}),treePos.length);
canopyInst.castShadow=true;
treePos.forEach(([tx,tz],i)=>{
  _dummy.position.set(tx,1.5,tz); _dummy.rotation.set(0,0,0); _dummy.scale.set(1,1,1); _dummy.updateMatrix(); trunkInst.setMatrixAt(i,_dummy.matrix);
  _dummy.position.set(tx,6.5,tz); _dummy.updateMatrix(); canopyInst.setMatrixAt(i,_dummy.matrix);
});
trunkInst.instanceMatrix.needsUpdate=true; canopyInst.instanceMatrix.needsUpdate=true;
scene.add(trunkInst); scene.add(canopyInst);
const trees=treePos.map(([tx,tz],i)=>({position:{x:tx,z:tz},userData:{alive:true,fall:0,dir:Math.random()>0.5?1:-1},idx:i}));

// ── PLAYER CAR ──
const player=new THREE.Group();
const pbody=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.8,4.5),new THREE.MeshStandardMaterial({color:0xff2244,roughness:0.2,metalness:0.6}));
pbody.position.y=0.7; pbody.castShadow=true; player.add(pbody);
const pcabin=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.6,2.2),new THREE.MeshStandardMaterial({color:0x111822,roughness:0.1,metalness:0.3}));
pcabin.position.set(0,1.35,-0.1); player.add(pcabin);
[[-1.1,0.35,1.4],[1.1,0.35,1.4],[-1.1,0.35,-1.4],[1.1,0.35,-1.4]].forEach(([wx,wy,wz])=>{
  const wh=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.3,12),new THREE.MeshStandardMaterial({color:0x111111,roughness:0.8}));
  wh.rotation.z=Math.PI/2; wh.position.set(wx,wy,wz); player.add(wh);
});
player.position.set(0,0,0); scene.add(player);

// ── NITRO EFFECT ──
const NITRO_PARTICLE_COUNT = 40;
const nitroGeo = new THREE.BufferGeometry();
const nitroPositions = new Float32Array(NITRO_PARTICLE_COUNT * 3);
const nitroSizes = new Float32Array(NITRO_PARTICLE_COUNT);
nitroGeo.setAttribute('position', new THREE.BufferAttribute(nitroPositions, 3));
nitroGeo.setAttribute('size', new THREE.BufferAttribute(nitroSizes, 1));

const nitroMat = new THREE.PointsMaterial({
  color: 0x00aaff,
  size: 0.6,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const nitroParticles = new THREE.Points(nitroGeo, nitroMat);
scene.add(nitroParticles);

const nitroState = Array.from({length: NITRO_PARTICLE_COUNT}, () => ({
  active: false, x:0, y:0, z:0, vx:0, vy:0, vz:0, life:0, maxLife:0
}));

function updateNitroEffect(dt) {
  if(K.nitro && Math.abs(spd) > 5) {
    const cosA = Math.cos(pa), sinA = Math.sin(pa);
    const exX = px - sinA*2.5, exZ = pz - cosA*2.5;
    for(let i=0; i<3; i++) {
      const p = nitroState.find(p => !p.active);
      if(!p) break;
      p.active = true;
      p.x = exX + (Math.random()-0.5)*0.8;
      p.y = carY + 0.3 + Math.random()*0.3;
      p.z = exZ + (Math.random()-0.5)*0.8;
      p.vx = -sinA*(3+Math.random()*4) + (Math.random()-0.5)*2;
      p.vy = Math.random()*1.5 + 0.5;
      p.vz = -cosA*(3+Math.random()*4) + (Math.random()-0.5)*2;
      p.maxLife = 0.25 + Math.random()*0.2;
      p.life = p.maxLife;
    }
  }

  nitroState.forEach((p, i) => {
    if(!p.active){
      nitroPositions[i*3] = 0; nitroPositions[i*3+1] = -999; nitroPositions[i*3+2] = 0;
      return;
    }
    p.life -= dt;
    if(p.life <= 0){ p.active = false; return; }
    p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt;
    p.vy -= 4*dt;
    const t = p.life/p.maxLife;
    nitroMat.color.setHSL(0.58 + (1-t)*0.1, 1, 0.5+t*0.5);
    nitroPositions[i*3]   = p.x;
    nitroPositions[i*3+1] = p.y;
    nitroPositions[i*3+2] = p.z;
  });
  nitroGeo.attributes.position.needsUpdate = true;
  nitroParticles.visible = K.nitro && Math.abs(spd) > 5;
}

new THREE.GLTFLoader().load('CL1M02.glb',gltf=>{
  player.remove(pbody); player.remove(pcabin);
  const model=gltf.scene;
  const box=new THREE.Box3().setFromObject(model);
  const size=new THREE.Vector3(),center=new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  const scale=5/Math.max(size.x,size.y,size.z);
  model.scale.setScalar(scale);
  model.position.x=-center.x*scale; model.position.z=-center.z*scale;
  const box2=new THREE.Box3().setFromObject(model); model.position.y=-box2.min.y;
  model.rotation.y=Math.PI;
  model.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
  player.add(model);
},null,()=>{});

// ── AI CARS ──
const AI_COLORS=[0x2255ff,0xff8800,0x00cc44,0xcc00cc,0xffff00,0x00ccff,0xff4444,0x88ff00,0xff0088,0x00ffcc,0xaa6600,0x6600aa,0x0044aa,0xaa0044,0x44aa00,0xccaa00,0x00aacc,0xcc4400];
const WPS=[[-120,-120],[-120,-60],[-120,0],[-120,60],[-120,120],[-60,-120],[-60,-60],[-60,0],[-60,60],[-60,120],[0,-120],[0,-60],[0,0],[0,60],[0,120],[60,-120],[60,-60],[60,0],[60,60],[60,120],[120,-120],[120,-60],[120,0],[120,60],[120,120],[0,280],[0,-280],[280,0],[-280,0]];
for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;WPS.push([Math.cos(a)*162,Math.sin(a)*162]);}
const aiCars=[];
for(let i=0;i<18;i++){
  const g=new THREE.Group();
  const b=new THREE.Mesh(new THREE.BoxGeometry(2,0.7,3.8),new THREE.MeshStandardMaterial({color:AI_COLORS[i%AI_COLORS.length],roughness:0.3,metalness:0.4}));
  b.position.y=0.65; b.castShadow=true; g.add(b);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,2),new THREE.MeshStandardMaterial({color:0x111822}));
  cab.position.set(0,1.2,-0.1); g.add(cab);
  const wp=WPS[Math.floor(Math.random()*WPS.length)];
  g.position.set(wp[0]+(Math.random()-0.5)*5,0,wp[1]+(Math.random()-0.5)*5);
  g.userData={wpIdx:Math.floor(Math.random()*WPS.length),spd:i<5?20+Math.random()*10:7+Math.random()*8,angle:Math.random()*Math.PI*2,isRacer:i<5};
  scene.add(g); aiCars.push(g);
}

// ── INPUT ──
const K={gas:false,brake:false,left:false,right:false,nitro:false};
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'||e.key==='w')K.gas=true;
  if(e.key==='ArrowDown'||e.key==='s')K.brake=true;
  if(e.key==='ArrowLeft'||e.key==='a')K.left=true;
  if(e.key==='ArrowRight'||e.key==='d')K.right=true;
  if(e.key==='Shift')K.nitro=true;
});
document.addEventListener('keyup',e=>{
  if(e.key==='ArrowUp'||e.key==='w')K.gas=false;
  if(e.key==='ArrowDown'||e.key==='s')K.brake=false;
  if(e.key==='ArrowLeft'||e.key==='a')K.left=false;
  if(e.key==='ArrowRight'||e.key==='d')K.right=false;
  if(e.key==='Shift')K.nitro=false;
});
function bindBtn(id,key){
  const el=document.getElementById(id);
  if(!el)return;
  const on=()=>{K[key]=true;el.classList.add('on');};
  const off=()=>{K[key]=false;el.classList.remove('on');};
  el.addEventListener('touchstart',e=>{e.preventDefault();on();},{passive:false});
  el.addEventListener('touchend',e=>{e.preventDefault();off();},{passive:false});
  el.addEventListener('mousedown',on); el.addEventListener('mouseup',off); el.addEventListener('mouseleave',off);
}
bindBtn('gg','gas');bindBtn('bg','brake');bindBtn('bl','left');bindBtn('br','right');bindBtn('nitroBtn','nitro');

// ── TIRE MARKS ──
const tireMarkMat=new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:0.6,depthWrite:false});
const tireMarks=[]; const MAX_MARKS=300; let markTimer=0;
function addTireMark(x,z,angle){
  markTimer++;
  if(markTimer%3!==0)return;
  if(tireMarks.length>MAX_MARKS){ const old=tireMarks.shift(); scene.remove(old); old.geometry.dispose(); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.8),tireMarkMat.clone());
  m.rotation.x=-Math.PI/2; m.rotation.z=angle; m.position.set(x,0.02,z); scene.add(m); tireMarks.push(m);
  tireMarks.forEach((mk,i)=>{mk.material.opacity=Math.min(0.6,i/tireMarks.length*0.6);});
}

// ── PHYSICS & CAMERA UTILS ──
let spd=0,px=0,pz=0,pa=0,steer=0,velX=0,velZ=0,carY=terrainHeight(0,0),velY=0,onGround=true,isDrifting=false;
let isFirstFrame = true; // Flag to instantly set camera on start loop
const GRAVITY=-18, MAXS=41.7, NITRO_MAXS=55.6, ACC=10, BRK=28, FRIC=6;
const SS=0.55, MS=0.16, TF=0.008, GRIP=9, DRIFT_GRIP=2;
const GEAR_SPEEDS=[0,5,12,20,29,36,41.7];

// ── MINIMAP ──
const mmEl=document.getElementById('mm');
const mc=mmEl.getContext('2d');
const MMS=110,MMSC=MMS/1200;
const mmOff=document.createElement('canvas'); mmOff.width=MMS; mmOff.height=MMS;
const mco=mmOff.getContext('2d');
mco.fillStyle='#111a14'; mco.fillRect(0,0,MMS,MMS);
mco.fillStyle='#333336';
GL.forEach(z=>mco.fillRect(0,(z+600)*MMSC-3,MMS,6));
GL.forEach(x=>mco.fillRect((x+600)*MMSC-3,0,6,MMS));
mco.strokeStyle='#444'; mco.lineWidth=3;
mco.beginPath(); mco.arc(MMS/2,MMS/2,162*MMSC,0,Math.PI*2); mco.stroke();
const mmAiPos=aiCars.map(c=>({x:(c.position.x+600)*MMSC,z:(c.position.z+600)*MMSC,tx:(c.position.x+600)*MMSC,tz:(c.position.z+600)*MMSC}));
let mmTimer=0;
function drawMinimap(dt){
  mmTimer+=dt;
  if(mmTimer>=0.25){ mmTimer=0; aiCars.forEach((c,i)=>{mmAiPos[i].tx=(c.position.x+600)*MMSC;mmAiPos[i].tz=(c.position.z+600)*MMSC;}); }
  mmAiPos.forEach(p=>{p.x+=(p.tx-p.x)*0.06;p.z+=(p.tz-p.z)*0.06;});
  mc.drawImage(mmOff,0,0);
  aiCars.forEach((c,i)=>{ mc.fillStyle=c.userData.isRacer?'#ff8800':'#4488ff'; mc.beginPath(); mc.arc(mmAiPos[i].x,mmAiPos[i].z,2,0,Math.PI*2); mc.fill(); });
  const cpx=(px+600)*MMSC,cpz=(pz+600)*MMSC;
  mc.fillStyle='#00ffcc'; mc.beginPath(); mc.arc(cpx,cpz,4,0,Math.PI*2); mc.fill();
  mc.strokeStyle='#00ffcc'; mc.lineWidth=1.5; mc.beginPath(); mc.moveTo(cpx,cpz); mc.lineTo(cpx+Math.sin(pa)*8,cpz+Math.cos(pa)*8); mc.stroke();
}

// ── SPEEDOMETER ──
const spdCanvas=document.createElement('canvas');
spdCanvas.width=200; spdCanvas.height=200;
spdCanvas.style.cssText='position:fixed;bottom:16px;right:16px;width:160px;height:160px;z-index:10;pointer-events:none;';
document.body.appendChild(spdCanvas);
const sctx=spdCanvas.getContext('2d');
if(mmEl) mmEl.style.bottom='186px';

function drawSpeedometer(kmh,gear,rpmPct){
  const cx=100,cy=115,r=80;
  sctx.clearRect(0,0,200,200);
  sctx.beginPath(); sctx.arc(cx,cy,r,Math.PI*0.75,Math.PI*2.25); sctx.strokeStyle='#ffffff11'; sctx.lineWidth=14; sctx.stroke();
  const maxK=200, ang=Math.PI*0.75+(Math.min(kmh,maxK)/maxK)*Math.PI*1.5;
  const gr=sctx.createLinearGradient(cx-r,cy,cx+r,cy);
  gr.addColorStop(0,'#00ffcc'); gr.addColorStop(0.5,'#ffcc00'); gr.addColorStop(1,'#ff2244');
  sctx.beginPath(); sctx.arc(cx,cy,r,Math.PI*0.75,ang); sctx.strokeStyle=gr; sctx.lineWidth=14; sctx.stroke();
  sctx.beginPath(); sctx.arc(cx,cy,r-20,Math.PI*0.75,Math.PI*0.75+rpmPct*Math.PI*1.5);
  sctx.strokeStyle=rpmPct>0.85?'#ff2244':'#ff8800'; sctx.lineWidth=5; sctx.stroke();
  for(let i=0;i<=10;i++){
    const a=Math.PI*0.75+(i/10)*Math.PI*1.5, inner=i%5===0?r-28:r-22;
    sctx.beginPath(); sctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner); sctx.lineTo(cx+Math.cos(a)*(r-8),cy+Math.sin(a)*(r-8));
    sctx.strokeStyle=i%5===0?'#ffffff88':'#ffffff33'; sctx.lineWidth=i%5===0?2:1; sctx.stroke();
  }
  sctx.fillStyle='#ffffff'; sctx.font='bold 28px monospace'; sctx.textAlign='center'; sctx.fillText(kmh,cx,cy+8);
  sctx.fillStyle='#ffffff55'; sctx.font='9px monospace'; sctx.fillText('KM/H',cx,cy+24);
  sctx.fillStyle='#00ffcc'; sctx.font='bold 14px monospace'; sctx.fillText('G'+gear,cx,cy+44);
  if(!onGround){sctx.fillStyle='#ff8800';sctx.font='bold 10px monospace';sctx.fillText('AIR',cx,cy-30);}
  if(isDrifting){sctx.fillStyle='#ff2244';sctx.font='bold 10px monospace';sctx.fillText('DRIFT',cx,cy-44);}
  if(K.nitro){sctx.fillStyle='#00aaff';sctx.font='bold 10px monospace';sctx.fillText('NITRO',cx,cy-58);}
}

// ── FPS ──
const fpsEl=document.createElement('div');
fpsEl.style.cssText='position:fixed;top:18px;right:18px;color:#00ffcc;font-family:monospace;font-size:11px;letter-spacing:2px;background:rgba(0,0,0,0.5);padding:4px 10px;border-radius:4px;pointer-events:none;z-index:10;';
document.body.appendChild(fpsEl);
let fpsF=0,fpsT=0;

// ── GAME LOOP ──
const clock=new THREE.Clock();
function update(dt){
  const curMax=K.nitro?NITRO_MAXS:MAXS;
  if(K.gas) spd=Math.min(spd+ACC*dt,curMax);
  else if(K.brake) spd=Math.max(spd-BRK*dt,-MAXS*0.3);
  else{if(spd>0)spd=Math.max(0,spd-FRIC*dt);if(spd<0)spd=Math.min(0,spd+FRIC*dt);}
  if(!K.nitro&&spd>MAXS)spd=Math.max(MAXS,spd-FRIC*dt);

  const sf=Math.max(0.25,1-Math.abs(spd)/MAXS*0.75);
  if(K.left)       steer=Math.min(steer+SS*sf*dt,MS*sf);
  else if(K.right) steer=Math.max(steer-SS*sf*dt,-MS*sf);
  else             steer*=(1-6*dt);

  const wantDrift=K.brake&&Math.abs(spd)>10&&Math.abs(steer)>0.04;
  isDrifting=wantDrift;
  const grip=isDrifting?DRIFT_GRIP:GRIP;
  if(isDrifting)spd*=(1-1.2*dt);

  if(Math.abs(spd)>0.3)pa+=steer*spd*TF;
  const tvx=Math.sin(pa)*spd, tvz=Math.cos(pa)*spd;
  velX+=(tvx-velX)*grip*dt; velZ+=(tvz-velZ)*grip*dt;
  px+=velX*dt; pz+=velZ*dt;

  if(isDrifting&&onGround&&Math.abs(spd)>5)addTireMark(px,pz,pa);

  buildingBounds.forEach(b=>{
    const tx=Math.max(b.minX,Math.min(px,b.maxX));
    const tz=Math.max(b.minZ,Math.min(pz,b.maxZ));
    const dx=px-tx,dz=pz-tz,dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<1.5){
      if(carY<b.h-1){
        if(dist>0){px+=(dx/dist)*(1.5-dist);pz+=(dz/dist)*(1.5-dist);}else{pz=b.minZ-1.5;}
        velY=Math.max(velY,Math.abs(spd)*0.3+5); onGround=false; spd*=0.7; velX*=0.7; velZ*=0.7;
      } else { carY=b.h; if(velY<0)velY=0; onGround=true; }
    }
  });

  lampBounds.forEach(l=>{
    const dx=px-l.x,dz=pz-l.z,dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<1&&dist>0){px+=(dx/dist)*(1-dist);pz+=(dz/dist)*(1-dist);spd*=-0.3;velX*=-0.3;velZ*=-0.3;}
  });

  aiCars.forEach(ai=>{
    const dx=px-ai.position.x,dz=pz-ai.position.z,dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<2.5&&dist>0){
      const push=2.5-dist;
      px+=(dx/dist)*push*0.7;pz+=(dz/dist)*push*0.7;
      ai.position.x-=(dx/dist)*push*0.3;ai.position.z-=(dz/dist)*push*0.3;
      spd*=-0.35;velX*=-0.35;velZ*=-0.35;
    }
  });

  const LIM=590;
  if(px>LIM){px=LIM;spd*=0.3;}if(px<-LIM){px=-LIM;spd*=0.3;}
  if(pz>LIM){pz=LIM;spd*=0.3;}if(pz<-LIM){pz=-LIM;spd*=0.3;}

  // Vertical physics
  const gh = terrainHeight(px,pz);
  const CAR_GROUND_OFFSET = 0.0;
  if(onGround){
    carY+=(gh+CAR_GROUND_OFFSET - carY)*12*dt;
    const bs=terrainHeight(px+Math.sin(pa)*2,pz+Math.cos(pa)*2)-gh;
    if(bs<-0.3&&Math.abs(spd)>15){velY=Math.abs(bs)*Math.abs(spd)*0.15;onGround=false;}
  } else {
    velY+=GRAVITY*dt; carY+=velY*dt;
    if(carY<=gh+CAR_GROUND_OFFSET){carY=gh+CAR_GROUND_OFFSET;velY=0;onGround=true;}
  }

  const sf2=terrainHeight(px+Math.sin(pa)*2,pz+Math.cos(pa)*2)-terrainHeight(px-Math.sin(pa)*2,pz-Math.cos(pa)*2);
  const ss2=terrainHeight(px+Math.cos(pa)*1.5,pz-Math.sin(pa)*1.5)-terrainHeight(px-Math.cos(pa)*1.5,pz+Math.sin(pa)*1.5);
  player.position.set(px, Math.max(0, carY), pz);
  player.rotation.order='YXZ'; player.rotation.y=pa;
  player.rotation.x=onGround?-sf2*0.12:0; player.rotation.z=onGround?ss2*0.12:0;

  // Camera Positioning Fix
  const cosA=Math.cos(pa),sinA=Math.sin(pa);
  const camTargetY = Math.max(gh + 2.5, carY + 5); // Clamped relative to current terrain height
  const idealCamPos = new THREE.Vector3(px-sinA*12, camTargetY, pz-cosA*12);

  if (isFirstFrame) {
    cam.position.copy(idealCamPos); // Snap immediately to correct coordinate on frame 1
    isFirstFrame = false;
  } else {
    cam.position.lerp(idealCamPos, 5*dt);
  }
  // Keep absolute vertical check protection
  if(cam.position.y < gh + 1.5) cam.position.y = gh + 1.5;

  cam.lookAt(px+sinA*8, Math.max(0, carY)+0.8, pz+cosA*8);

  // AI update
  aiCars.forEach(c=>{
    const wp=WPS[c.userData.wpIdx%WPS.length];
    const dx=wp[0]-c.position.x,dz=wp[1]-c.position.z;
    if(dx*dx+dz*dz<64)c.userData.wpIdx=(c.userData.wpIdx+1)%WPS.length;
    const ta=Math.atan2(dx,dz); let diff=ta-c.userData.angle;
    while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
    c.userData.angle+=Math.sign(diff)*Math.min(Math.abs(diff),2*dt);
    c.position.x+=Math.sin(c.userData.angle)*c.userData.spd*dt;
    c.position.z+=Math.cos(c.userData.angle)*c.userData.spd*dt;
    c.rotation.y=c.userData.angle;
    buildingBounds.forEach(b=>{
      const tx=Math.max(b.minX,Math.min(c.position.x,b.maxX));
      const tz=Math.max(b.minZ,Math.min(c.position.z,b.maxZ));
      const dx2=c.position.x-tx,dz2=c.position.z-tz,dist=Math.sqrt(dx2*dx2+dz2*dz2);
      if(dist<1.5&&dist>0){c.position.x+=(dx2/dist)*(1.5-dist);c.position.z+=(dz2/dist)*(1.5-dist);c.userData.angle+=Math.PI*0.25;}
      else if(dist===0)c.position.x=b.maxX+1.5;
    });
    c.position.x=Math.max(-590,Math.min(590,c.position.x));
    c.position.z=Math.max(-590,Math.min(590,c.position.z));
  });

  // Trees
  trees.forEach((t,i)=>{
    if(!t.userData.alive){
      if(t.userData.fall<Math.PI/2){
        t.userData.fall+=0.04;
        _dummy.position.set(t.position.x,6.5-t.userData.fall*4,t.position.z);
        _dummy.rotation.set(t.userData.dir*t.userData.fall,0,0); _dummy.scale.set(1,1,1); _dummy.updateMatrix();
        canopyInst.setMatrixAt(i,_dummy.matrix); canopyInst.instanceMatrix.needsUpdate=true;
      }
      return;
    }
    const dx=px-t.position.x,dz=pz-t.position.z;
    if(dx*dx+dz*dz<7)t.userData.alive=false;
  });

  updateNitroEffect(dt);
  lightTimer+=dt; if(lightTimer>0.4){lightTimer=0;updateNearestLights();}
  sun.position.set(px+100,200,pz+100); sun.target.position.set(px,0,pz);

  const kmh=Math.abs(Math.round(spd*3.6));
  let gear=1; for(let g=1;g<GEAR_SPEEDS.length;g++)if(Math.abs(spd)>=GEAR_SPEEDS[g-1])gear=g;
  const gl=GEAR_SPEEDS[gear-1]*3.6,gh2=GEAR_SPEEDS[gear]*3.6;
  const rpmPct=Math.max(0,Math.min(1,(kmh-gl)/(gh2-gl)));
  const svEl=document.getElementById('sv'); if(svEl)svEl.textContent=kmh;
  drawSpeedometer(kmh,gear,rpmPct);
  drawMinimap(dt);
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  fpsF++; fpsT+=dt;
  if(fpsT>=0.5){const v=Math.round(fpsF/fpsT);fpsEl.textContent=v+' FPS';fpsEl.style.color=v>=50?'#00ffcc':v>=30?'#ffcc00':'#ff4444';fpsF=0;fpsT=0;}
  update(dt);
  renderer.render(scene,cam);
}

window.addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

animate();

// Initial Setup sequence optimization
const initGroundHeight = terrainHeight(0, 0);
cam.position.set(0, initGroundHeight + 5, -12);
cam.lookAt(0, initGroundHeight + 1, 10);

setTimeout(()=>{
  cubeCamera.position.set(0,10,0);
  scene.background=new THREE.Color(0x0a0a1a);
  cubeCamera.update(renderer,scene);
  scene.remove(cubeCamera);
  const l=document.getElementById('loader');
  if(l){l.style.opacity='0';setTimeout(()=>{if(l.parentNode)l.remove();},700);}
},1400);

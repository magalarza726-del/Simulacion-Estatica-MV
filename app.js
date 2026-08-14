
import * as THREE from 'three';

const G = 9.81;
const H = 0.34;
const R3_FIXED = 0.08; // radio experimental fijo para la polea 3
const TOWER_MASS = 0.085; // kg, valor visual/dinámico aproximado
const MASSES_G = [5.18394, 4.77344, 5.32001, 5.37805, 4.49533, 4.6934, 5.12995, 4.99438, 5.08579, 4.83051, 5.35937, 5.32836, 5.11108, 5.43503, 5.23364, 4.8286, 5.20349, 4.7982, 5.35908, 5.07568, 5.03449, 4.88305, 5.46413, 5.04375, 4.96016, 4.98342, 5.25342, 5.20248, 5.21691, 5.22244];

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f6fb);
scene.fog = new THREE.Fog(0xf2f6fb, 1.1, 2.2);

const camera = new THREE.PerspectiveCamera(42,1,0.01,10);
let camRadius=0.78, camYaw=0.72, camPitch=0.56;
let rotationMode='free';

const ambient = new THREE.HemisphereLight(0xffffff,0x8aa0b5,2.0); scene.add(ambient);
const key = new THREE.DirectionalLight(0xffffff,3.2); key.position.set(0.5,0.8,0.35); key.castShadow=true; scene.add(key);
const fill = new THREE.DirectionalLight(0xffe1bd,1.0); fill.position.set(-0.4,0.3,-0.2); scene.add(fill);

function woodTexture(){
  const c=document.createElement('canvas'); c.width=c.height=512;
  const x=c.getContext('2d');
  x.fillStyle='#caa06d'; x.fillRect(0,0,512,512);
  for(let i=0;i<120;i++){
    const y=Math.random()*512;
    x.strokeStyle=`rgba(92,54,23,${0.03+Math.random()*0.07})`;
    x.lineWidth=0.5+Math.random()*2; x.beginPath(); x.moveTo(0,y);
    x.bezierCurveTo(140,y+Math.random()*12-6,340,y+Math.random()*12-6,512,y); x.stroke();
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
const wood = woodTexture();

const base = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.018,0.38),
  new THREE.MeshStandardMaterial({map:wood,roughness:.76,metalness:.02}));
base.position.y=-0.012; base.receiveShadow=true; scene.add(base);

const baseEdge = new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry), new THREE.LineBasicMaterial({color:0x725333}));
base.add(baseEdge);

// Rótula
const socket = new THREE.Mesh(new THREE.CylinderGeometry(.037,.045,.018,48),
 new THREE.MeshStandardMaterial({color:0xbfc7ce,metalness:.8,roughness:.22}));
socket.position.y=.008; socket.castShadow=true; scene.add(socket);
const ball = new THREE.Mesh(new THREE.SphereGeometry(.017,32,20),
 new THREE.MeshStandardMaterial({color:0xd9dee2,metalness:.9,roughness:.12}));
ball.position.y=.024; ball.castShadow=true; scene.add(ball);

// tower group rotates about O
const towerPivot = new THREE.Group(); towerPivot.position.set(0,.024,0); scene.add(towerPivot);
const towerGeom = new THREE.Group(); towerPivot.add(towerGeom);
const dowelMat = new THREE.MeshStandardMaterial({color:0xb78043,roughness:.65});
const glueMat = new THREE.MeshStandardMaterial({color:0xe9e5dc,roughness:.7});

function cylinderBetween(a,b,r,mat,parent=towerGeom){
  const mid=a.clone().add(b).multiplyScalar(.5), d=a.distanceTo(b);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,10),mat);
  m.position.copy(mid); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), b.clone().sub(a).normalize());
  m.castShadow=true; parent.add(m); return m;
}
const topLocal = new THREE.Vector3(0,H,0);
const footR=.035;
for(let k=0;k<3;k++){
  const a=2*Math.PI*k/3;
  cylinderBetween(new THREE.Vector3(footR*Math.cos(a),0,footR*Math.sin(a)), topLocal, .003, dowelMat);
}
for(const y of [.07,.14,.21]){
  const scale=1-y/H, rr=footR*scale;
  const pts=[0,1,2].map(k=>new THREE.Vector3(rr*Math.cos(2*Math.PI*k/3),y,rr*Math.sin(2*Math.PI*k/3)));
  for(let k=0;k<3;k++) cylinderBetween(pts[k],pts[(k+1)%3],.0018,dowelMat);
}
const topCap=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.018,24),glueMat); topCap.position.copy(topLocal); towerGeom.add(topCap);

// pulleys and masses
const pulleyGroups=[new THREE.Group(),new THREE.Group(),new THREE.Group()];
const massMeshes=[null,null,null], cableLines=[null,null,null], vectorLines=[null,null,null];
const anchorPts=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
const colors=[0x2563eb,0xef4444,0x16a34a];

function makePulley(group){
  const standMat=new THREE.MeshStandardMaterial({color:0xbfc6cc,metalness:.78,roughness:.25});
  const wheelMat=new THREE.MeshStandardMaterial({color:0xc79b34,metalness:.75,roughness:.2});
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.034,.006,.025),standMat); foot.position.y=.006; foot.castShadow=true; group.add(foot);
  const wheel=new THREE.Mesh(new THREE.TorusGeometry(.012,.004,12,28),wheelMat); wheel.rotation.y=Math.PI/2; wheel.position.y=.024; wheel.castShadow=true; group.add(wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.012,16),standMat); hub.rotation.z=Math.PI/2; hub.position.y=.024; group.add(hub);
}
pulleyGroups.forEach(g=>{makePulley(g);scene.add(g)});

function makeMass(kg, color=0x6b7280){
  const g=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color,metalness:.5,roughness:.35});
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.026,24),mat); cyl.castShadow=true; g.add(cyl);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.006,.0015,8,20),mat); ring.rotation.x=Math.PI/2; ring.position.y=.018; g.add(ring);
  g.userData.kg=kg; return g;
}

function setMassMesh(i,kg){
  if(massMeshes[i]) scene.remove(massMeshes[i]);
  if(!kg){massMeshes[i]=null;return}
  const m=makeMass(kg, i===0?0x66788a:i===1?0x707b86:0x596674); massMeshes[i]=m; scene.add(m);
}

function lineBetween(a,b,color,width=1){
  const geo=new THREE.BufferGeometry().setFromPoints([a,b]);
  return new THREE.Line(geo,new THREE.LineBasicMaterial({color,linewidth:width}));
}

function updateCable(i,a,b){
  if(cableLines[i]) scene.remove(cableLines[i]);
  cableLines[i]=lineBetween(a,b,colors[i]); scene.add(cableLines[i]);
}

function arrow(origin, vec, color){
  const len=vec.length(); if(len<1e-6) return new THREE.Group();
  return new THREE.ArrowHelper(vec.clone().normalize(),origin,len,color,Math.min(.025,len*.22),Math.min(.012,len*.12));
}
const dclGroup=new THREE.Group(); scene.add(dclGroup); dclGroup.visible=false;

let mode='sliders';
let assigned=[null,null,null]; // kg
let data={m1:.005,m2:.005,r1:.08,a1:140,r2:.08,a2:40,m3Ideal:0,r3:new THREE.Vector3(),m3Used:0};
let omega = new THREE.Vector3();
let qTower = new THREE.Quaternion();
let last=performance.now();

function vecFromPolar(r,aDeg){
  const a=THREE.MathUtils.degToRad(aDeg);
  return new THREE.Vector3(r*Math.cos(a),0,r*Math.sin(a));
}
function solve(){
  const R1=vecFromPolar(data.r1,data.a1), R2=vecFromPolar(data.r2,data.a2);
  const L1=Math.sqrt(H*H+data.r1*data.r1), L2=Math.sqrt(H*H+data.r2*data.r2);
  const q=R1.clone().multiplyScalar(data.m1/L1).add(R2.clone().multiplyScalar(data.m2/L2));
  const qn=q.length();
  let R3=new THREE.Vector3(-R3_FIXED,0,0), m3=0;
  if(qn>1e-9){R3=q.clone().multiplyScalar(-R3_FIXED/qn); const L3=Math.sqrt(H*H+R3_FIXED*R3_FIXED); m3=L3*qn/R3_FIXED;}
  data.m3Ideal=m3; data.r3=R3;
  data.m3Used = mode==='masses' ? (assigned[2] ?? m3) : m3;
  return [R1,R2,R3];
}
function topWorld(){
  const v=topLocal.clone().applyQuaternion(towerPivot.quaternion); return towerPivot.position.clone().add(v);
}
function cmWorld(){
  const v=new THREE.Vector3(0,H*.48,0).applyQuaternion(towerPivot.quaternion); return towerPivot.position.clone().add(v);
}
function forceAtTop(anchor, massKg, top){
  const dir=anchor.clone().sub(top).normalize(); return dir.multiplyScalar(massKg*G);
}
function torqueNow(){
  const top=topWorld(), O=towerPivot.position;
  const masses=[data.m1,data.m2,data.m3Used];
  let tau=new THREE.Vector3(), sumF=new THREE.Vector3();
  for(let i=0;i<3;i++){
    const F=forceAtTop(anchorPts[i],masses[i],top); tau.add(top.clone().sub(O).cross(F)); sumF.add(F);
  }
  const cm=cmWorld(), W=new THREE.Vector3(0,-TOWER_MASS*G,0);
  tau.add(cm.clone().sub(O).cross(W)); sumF.add(W);
  return {tau,sumF};
}
function updateDCL(){
  while(dclGroup.children.length) dclGroup.remove(dclGroup.children[0]);
  const top=topWorld(), O=towerPivot.position, masses=[data.m1,data.m2,data.m3Used];
  const scale=.05;
  let sum=new THREE.Vector3();
  for(let i=0;i<3;i++){
    const F=forceAtTop(anchorPts[i],masses[i],top); sum.add(F);
    dclGroup.add(arrow(top,F.clone().multiplyScalar(scale),colors[i]));
  }
  const W=new THREE.Vector3(0,-TOWER_MASS*G,0); sum.add(W);
  dclGroup.add(arrow(cmWorld(),W.clone().multiplyScalar(scale),0x111827));
  dclGroup.add(arrow(O,sum.clone().multiplyScalar(-scale),0xf59e0b));
}

function updateSceneGeometry(){
  const [R1,R2,R3]=solve(); [R1,R2,R3].forEach((p,i)=>anchorPts[i].copy(p));
  for(let i=0;i<3;i++){
    pulleyGroups[i].position.copy(anchorPts[i]); pulleyGroups[i].rotation.y=Math.atan2(anchorPts[i].x,anchorPts[i].z);
  }
  const top=topWorld();
  for(let i=0;i<3;i++){
    updateCable(i,top,anchorPts[i].clone().setY(.025));
    if(massMeshes[i]){
      const a=anchorPts[i]; massMeshes[i].position.set(a.x,-.035,a.z);
    }
  }
  updateDCL();
  updateVectorDrawings(R1,R2,R3);
  updateUI();
}

const rGroup=new THREE.Group(); scene.add(rGroup);
function updateVectorDrawings(...rs){
  while(rGroup.children.length) rGroup.remove(rGroup.children[0]);
  const origin=new THREE.Vector3(0,.005,0);
  rs.forEach((r,i)=>{rGroup.add(new THREE.ArrowHelper(r.clone().normalize(),origin,r.length(),colors[i],.012,.006))});
}

function residualStaticMoment(){
  const [R1,R2,R3]=[vecFromPolar(data.r1,data.a1),vecFromPolar(data.r2,data.a2),data.r3.clone()];
  const L=[Math.sqrt(H*H+data.r1**2),Math.sqrt(H*H+data.r2**2),Math.sqrt(H*H+R3_FIXED**2)];
  const masses=[data.m1,data.m2,data.m3Used];
  const q=R1.clone().multiplyScalar(masses[0]/L[0]).add(R2.clone().multiplyScalar(masses[1]/L[1])).add(R3.clone().multiplyScalar(masses[2]/L[2]));
  return G*H*q.length();
}

function updateUI(){
  const f=(x,n=2)=>Number(x).toFixed(n);
  document.getElementById('m1Out').textContent=f(data.m1*1000)+' g';
  document.getElementById('m2Out').textContent=f(data.m2*1000)+' g';
  document.getElementById('r1Out').textContent=f(data.r1*100,1)+' cm';
  document.getElementById('r2Out').textContent=f(data.r2*100,1)+' cm';
  document.getElementById('a1Out').textContent=f(data.a1,0)+'°';
  document.getElementById('a2Out').textContent=f(data.a2,0)+'°';
  const m3=f(data.m3Ideal*1000,3)+' g';
  const r3=`(${f(data.r3.x*100,2)}, ${f(data.r3.z*100,2)}) cm`;
  document.getElementById('m3Result').textContent=m3; document.getElementById('m3Mobile').textContent=m3;
  document.getElementById('r3Result').textContent=r3; document.getElementById('r3Mobile').textContent=r3;
  const M=residualStaticMoment(); document.getElementById('momentResult').textContent=M.toExponential(2)+' N·m';
  const pill=document.getElementById('statusPill');
  const err=M/Math.max(1e-9,(data.m1+data.m2+data.m3Ideal)*G*H);
  pill.className='status '+(err<.004?'ok':err<.03?'warn':'bad');
  pill.textContent=err<.004?'Equilibrio':err<.03?'Ligera inclinación':'Desequilibrio';
}

function applyInputs(){
  data.m1=+document.getElementById('m1').value/1000;
  data.m2=+document.getElementById('m2').value/1000;
  data.r1=+document.getElementById('r1').value/100;
  data.r2=+document.getElementById('r2').value/100;
  data.a1=+document.getElementById('a1').value;
  data.a2=+document.getElementById('a2').value;
  setMassMesh(0,data.m1); setMassMesh(1,data.m2); setMassMesh(2,data.m3Ideal||.005);
  updateSceneGeometry();
}
['m1','m2','r1','r2','a1','a2'].forEach(id=>document.getElementById(id).addEventListener('input',applyInputs));

function setMode(m){
  mode=m;
  document.getElementById('sliderMode').hidden=m!=='sliders';
  document.getElementById('massMode').hidden=m!=='masses';
  document.getElementById('modeSliders').classList.toggle('active',m==='sliders');
  document.getElementById('modeMasses').classList.toggle('active',m==='masses');
  if(m==='sliders'){
    assigned=[null,null,null];
    setMassMesh(0,data.m1); setMassMesh(1,data.m2); setMassMesh(2,data.m3Ideal);
  }
  updateSceneGeometry();
}
document.getElementById('modeSliders').onclick=()=>setMode('sliders');
document.getElementById('modeMasses').onclick=()=>setMode('masses');

const tray=document.getElementById('massTray');
MASSES_G.forEach((g,i)=>{
  const e=document.createElement('div'); e.className='mass-chip'; e.draggable=true; e.textContent=`#${i+1} · ${g.toFixed(3)} g`;
  e.dataset.kg=(g/1000); e.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/plain',e.dataset.kg);document.getElementById('dropHint').classList.add('show')});
  e.addEventListener('dragend',()=>document.getElementById('dropHint').classList.remove('show')); tray.appendChild(e);
});
document.querySelectorAll('.assigned button').forEach(b=>b.onclick=()=>{
  const i=+b.dataset.slot;assigned[i]=null;setMassMesh(i,null);if(i===0)data.m1=.005;if(i===1)data.m2=.005;updateSceneGeometry();updateSlots();
});
function updateSlots(){
  assigned.forEach((v,i)=>document.getElementById('slot'+i).textContent=v?`${(v*1000).toFixed(3)} g`:'sin masa');
}

canvas.addEventListener('dragover',e=>e.preventDefault());
canvas.addEventListener('drop',e=>{
  e.preventDefault(); if(mode!=='masses') return;
  const kg=parseFloat(e.dataTransfer.getData('text/plain')); if(!kg)return;
  const rect=canvas.getBoundingClientRect();
  const pts=anchorPts.map(p=>{
    const v=p.clone().project(camera);
    return {x:rect.left+(v.x*.5+.5)*rect.width,y:rect.top+(-v.y*.5+.5)*rect.height};
  });
  let best=0,bd=1e9; pts.forEach((p,i)=>{const d=(p.x-e.clientX)**2+(p.y-e.clientY)**2;if(d<bd){bd=d;best=i}});
  assigned[best]=kg; setMassMesh(best,kg);
  if(best===0)data.m1=kg; if(best===1)data.m2=kg;
  updateSceneGeometry(); updateSlots(); document.getElementById('dropHint').classList.remove('show');
});

// Camera interaction: 3 modes
let dragging=false,lastX=0,lastY=0;
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointermove',e=>{
  if(!dragging)return; const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
  if(rotationMode==='horizontal'||rotationMode==='free') camYaw-=dx*.008;
  if(rotationMode==='vertical'||rotationMode==='free') camPitch=Math.max(.12,Math.min(1.35,camPitch-dy*.006));
});
canvas.addEventListener('wheel',e=>{e.preventDefault();camRadius=Math.max(.45,Math.min(1.25,camRadius+e.deltaY*.0006))},{passive:false});
function rotButton(id,modeName){
  document.getElementById(id).onclick=()=>{rotationMode=modeName;['rotHorizontal','rotVertical','rotFree'].forEach(x=>document.getElementById(x).classList.remove('active'));document.getElementById(id).classList.add('active')};
}
rotButton('rotHorizontal','horizontal');rotButton('rotVertical','vertical');rotButton('rotFree','free');
document.getElementById('zoomIn').onclick=()=>camRadius=Math.max(.45,camRadius-.08);
document.getElementById('zoomOut').onclick=()=>camRadius=Math.min(1.25,camRadius+.08);
document.getElementById('resetView').onclick=()=>{camRadius=.78;camYaw=.72;camPitch=.56};
document.getElementById('toggleDCL').onclick=()=>{dclGroup.visible=!dclGroup.visible;document.getElementById('dclLegend').hidden=!dclGroup.visible;document.getElementById('toggleDCL').classList.toggle('active',dclGroup.visible)};

function updateCamera(){
  camera.position.set(camRadius*Math.sin(camYaw)*Math.cos(camPitch),camRadius*Math.sin(camPitch)+.12,camRadius*Math.cos(camYaw)*Math.cos(camPitch));
  camera.lookAt(0,.14,0);
}
function resize(){
  const rect=canvas.getBoundingClientRect(); const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  if(canvas.width!==w||canvas.height!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
}

// Dynamics of rigid tower about the ball joint
function integrate(dt){
  const {tau}=torqueNow();
  // slender tower equivalent inertia about base; slightly increased for numerical stability
  const I=Math.max(.0007, TOWER_MASS*H*H/3 + .0003);
  const alpha=tau.clone().multiplyScalar(1/I);
  omega.addScaledVector(alpha,dt);
  omega.multiplyScalar(Math.exp(-2.6*dt));
  // cap angular speed for stable educational simulation
  if(omega.length()>2.2) omega.setLength(2.2);
  const angle=omega.length()*dt;
  if(angle>1e-7){
    const dq=new THREE.Quaternion().setFromAxisAngle(omega.clone().normalize(),angle);
    towerPivot.quaternion.premultiply(dq).normalize();
  }
  // ball-joint physical stop: tower cannot pass below board; max tilt ~58°
  const up=new THREE.Vector3(0,1,0).applyQuaternion(towerPivot.quaternion);
  const tilt=Math.acos(THREE.MathUtils.clamp(up.y,-1,1));
  const maxTilt=THREE.MathUtils.degToRad(58);
  if(tilt>maxTilt){
    const axis=new THREE.Vector3(up.z,0,-up.x).normalize();
    towerPivot.quaternion.setFromAxisAngle(axis,maxTilt); omega.multiplyScalar(.25);
  }
  // when nearly balanced, settle very gently to exact vertical
  const M=residualStaticMoment();
  if(M<2e-6 && omega.length()<.02) towerPivot.quaternion.slerp(new THREE.Quaternion(),.025);
}

function animate(t){
  requestAnimationFrame(animate); resize(); updateCamera();
  const dt=Math.min(.025,(t-last)/1000||.016);last=t;
  integrate(dt);
  updateSceneGeometry();
  renderer.render(scene,camera);
}
applyInputs(); updateSlots(); requestAnimationFrame(animate);
